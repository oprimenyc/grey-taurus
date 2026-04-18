import { db } from "@workspace/db";
import { sentEmailsTable } from "@workspace/db/schema";
import { gte, desc, eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const FORBIDDEN_CLAIMS = [
  "guaranteed",
  "promise",
  "ensure success",
  "proven results",
];

const ALLOWED_CERTIFICATIONS = [
  "small business",
  "florida llc",
  "sam registered",
  "sam.gov",
  "uei:",
  "cage:",
];

const FORBIDDEN_CERTIFICATIONS = [
  "8(a) certified",
  "hubzone certified",
  "sdvosb certified",
  "wosb certified",
  "edwosb certified",
  "service-disabled",
  "woman-owned",
];

export interface GuardrailResult {
  allowed: boolean;
  reasons: string[];
}

export async function checkEmailGuardrails(params: {
  recipient: string;
  subject: string;
  body: string;
  opportunityTitle?: string;
}): Promise<GuardrailResult> {
  const { recipient, subject, body, opportunityTitle } = params;
  const reasons: string[] = [];
  const combined = `${subject} ${body}`.toLowerCase();

  if (!opportunityTitle || opportunityTitle.trim().length === 0) {
    reasons.push("No opportunity title or contact reason referenced");
  }

  for (const phrase of FORBIDDEN_CLAIMS) {
    if (combined.includes(phrase.toLowerCase())) {
      reasons.push(`Forbidden phrase detected: "${phrase}"`);
    }
  }

  for (const cert of FORBIDDEN_CERTIFICATIONS) {
    if (combined.includes(cert.toLowerCase())) {
      reasons.push(`Claims uncertified status: "${cert}"`);
    }
  }

  if (!body.includes("1LXN7")) {
    reasons.push("Missing CAGE 1LXN7");
  }

  if (!combined.includes("greytaurus.com")) {
    reasons.push("Missing greytaurus.com reference");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const todayEmails = await db
      .select()
      .from(sentEmailsTable)
      .where(gte(sentEmailsTable.sentAt, todayStart));

    const sentToday = todayEmails.filter((e) => e.status === "sent").length;
    if (sentToday >= 20) {
      reasons.push(`Daily cap reached: ${sentToday} emails sent today (max 20)`);
    }

    const recentToRecipient = todayEmails.filter((e) => {
      if (e.recipient !== recipient) return false;
      if (!e.sentAt) return false;
      const daysSince = (Date.now() - new Date(e.sentAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 14;
    });

    if (recentToRecipient.length > 0) {
      reasons.push(`Recipient emailed within last 14 days`);
    }
  } catch (err) {
    logger.error({ err }, "Failed to query sent_emails for guardrail check");
  }

  if (reasons.length > 0) {
    try {
      await db.insert(sentEmailsTable).values({
        recipient,
        subject,
        templateType: "guardrail_rejected",
        opportunityRef: opportunityTitle,
        status: "failed",
        guardRailFlags: reasons.join("; "),
      });
    } catch (err) {
      logger.error({ err }, "Failed to log guardrail rejection");
    }
  }

  return { allowed: reasons.length === 0, reasons };
}

export async function checkCooldown(): Promise<{ allowed: boolean; waitMs: number }> {
  try {
    const rows = await db
      .select()
      .from(sentEmailsTable)
      .where(eq(sentEmailsTable.status, "sent"))
      .orderBy(desc(sentEmailsTable.sentAt))
      .limit(1);

    if (rows.length === 0) return { allowed: true, waitMs: 0 };

    const lastSent = rows[0]!.sentAt;
    if (!lastSent) return { allowed: true, waitMs: 0 };

    const elapsed = Date.now() - new Date(lastSent).getTime();
    const COOLDOWN_MS = 90 * 1000;

    if (elapsed < COOLDOWN_MS) {
      return { allowed: false, waitMs: COOLDOWN_MS - elapsed };
    }
  } catch (err) {
    logger.error({ err }, "Failed to check cooldown");
  }

  return { allowed: true, waitMs: 0 };
}
