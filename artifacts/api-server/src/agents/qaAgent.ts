import Anthropic from "@anthropic-ai/sdk";
import { db } from "@workspace/db";
import { qaFlagsTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";

const GENERIC_PHRASES = [
  "we are committed to",
  "proven track record",
  "best in class",
  "synergy",
  "leverage",
  "cutting edge",
  "world class",
  "innovative solutions",
  "dedicated team",
  "comprehensive approach",
];

const WEAK_CLAIM_PATTERNS = [
  { pattern: /guaranteed|guarantee/i, label: "guaranteed outcome claim" },
  { pattern: /promise to deliver/i, label: "promise of delivery" },
  { pattern: /ensure success/i, label: "outcome guarantee" },
  { pattern: /proven results/i, label: "unverified results claim" },
];

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

interface QaResult {
  flagType: string;
  flagDetail: string;
  suggestedRewrite?: string;
}

async function getSuggestedRewrite(text: string, flags: string[]): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are a federal contracting QA specialist. Review this text for generic language, weak claims, and missing credibility signals. Flag specific phrases and suggest precise rewrites using capability-specific language. Never invent past performance. Always recommend including CAGE: 1LXN7 and UEI: FMJFQ6R7B7P8 in outreach.",
      messages: [
        {
          role: "user",
          content: `Review this text and suggest rewrites for the following flags: ${flags.join(", ")}\n\nText:\n${text}`,
        },
      ],
    });

    const content = message.content[0];
    return content?.type === "text" ? content.text : "";
  } catch (err) {
    logger.error({ err }, "Claude QA rewrite failed");
    return "";
  }
}

export async function qaAgent(params: {
  entityType: "proposal" | "outreach" | "capability";
  entityId: number;
  text: string;
}): Promise<QaResult[]> {
  const { entityType, entityId, text } = params;
  const flags: QaResult[] = [];
  const flagTexts: string[] = [];

  for (const phrase of GENERIC_PHRASES) {
    if (text.toLowerCase().includes(phrase)) {
      flags.push({ flagType: "generic_language", flagDetail: `Contains generic phrase: "${phrase}"` });
      flagTexts.push(`generic phrase "${phrase}"`);
    }
  }

  for (const { pattern, label } of WEAK_CLAIM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({ flagType: "weak_claim", flagDetail: `Weak claim detected: ${label}` });
      flagTexts.push(label);
    }
  }

  if (!text.includes("1LXN7")) {
    flags.push({ flagType: "missing_data", flagDetail: "Missing CAGE 1LXN7" });
    flagTexts.push("missing CAGE number");
  }
  if (!text.includes("FMJFQ6R7B7P8")) {
    flags.push({ flagType: "missing_data", flagDetail: "Missing UEI FMJFQ6R7B7P8" });
    flagTexts.push("missing UEI number");
  }
  if (!text.toLowerCase().includes("greytaurus.com")) {
    flags.push({ flagType: "missing_data", flagDetail: "Missing greytaurus.com reference" });
    flagTexts.push("missing website reference");
  }

  if (flags.length === 0) return [];

  let suggestedRewrite = "";
  if (flagTexts.length > 0) {
    suggestedRewrite = await getSuggestedRewrite(text, flagTexts);
  }

  for (const flag of flags) {
    try {
      await db.insert(qaFlagsTable).values({
        entityType,
        entityId,
        flagType: flag.flagType,
        flagDetail: flag.flagDetail,
        resolved: false,
      });
    } catch (err) {
      logger.error({ err }, "Failed to insert QA flag");
    }
  }

  if (flags.length > 0) {
    flags[0]!.suggestedRewrite = suggestedRewrite;
  }

  logger.info({ entityType, entityId, flagCount: flags.length }, "QA scan complete");
  return flags;
}
