import { db } from "@workspace/db";
import { opportunitiesTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";

const KEYWORDS = ["operations", "logistics", "facilities", "administrative", "program support", "vendor"];

function scoreStateOpp(text: string, deadline: string | null): number {
  let score = 0;
  const lower = text.toLowerCase();
  if (KEYWORDS.some((kw) => lower.includes(kw))) score += 20;
  if (deadline) {
    const daysUntil = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil > 0 && daysUntil <= 14) score += 30;
  }
  return score;
}

function extractText(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gi");
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) matches.push(match[1].trim());
  }
  return matches;
}

export async function stateScraper(): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(
      "https://www.myflorida.com/apps/vbs/vbs_www.main_menu",
      {
        headers: {
          "User-Agent": "GreyTaurusBot/1.0",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      logger.warn({ status: response.status }, "Florida VBS returned non-200");
      return [];
    }

    const html = await response.text();
    const rows = extractText(html, "td");
    const results: Record<string, unknown>[] = [];

    for (let i = 0; i < rows.length - 3; i++) {
      const combined = [rows[i], rows[i + 1], rows[i + 2], rows[i + 3]].join(" ").toLowerCase();
      if (!KEYWORDS.some((kw) => combined.includes(kw))) continue;

      const title = rows[i] || "";
      const agency = rows[i + 1] || "Florida State";
      const deadline = null;
      const score = scoreStateOpp(combined, deadline);

      const noticeId = `fl-${Buffer.from(title.slice(0, 30)).toString("hex").slice(0, 16)}-${i}`;

      const opp = {
        noticeId,
        title: title.slice(0, 200),
        agency,
        source: "state_fl",
        status: "queued",
        score,
        description: combined.slice(0, 500),
      };

      try {
        await db
          .insert(opportunitiesTable)
          .values(opp)
          .onConflictDoUpdate({
            target: opportunitiesTable.noticeId,
            set: { score, agency },
          });
        results.push(opp);
      } catch (err) {
        logger.error({ err, noticeId }, "Failed to upsert state opportunity");
      }

      if (results.length >= 20) break;
    }

    return results;
  } catch (err) {
    logger.error({ err }, "stateScraper failed");
    return [];
  }
}
