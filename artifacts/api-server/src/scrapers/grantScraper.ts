import { db } from "@workspace/db";
import { grantsTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";

const KEYWORD_BOOST = ["housing", "workforce", "operations", "logistics"];

function scoreGrant(item: {
  closeDate?: string | null;
  awardCeiling?: number | null;
  description?: string;
}): { score: number; eligibleEntity: string } {
  let score = 0;
  let eligibleEntity = "greytaurus";

  if (item.closeDate) {
    const daysUntil = (new Date(item.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil > 0 && daysUntil <= 21) score += 30;
  }
  if ((item.awardCeiling ?? 0) > 50000) score += 25;

  const text = (item.description || "").toLowerCase();
  if (KEYWORD_BOOST.some((kw) => text.includes(kw))) score += 20;
  if (text.includes("nonprofit") || text.includes("non-profit") || text.includes("501")) {
    score += 15;
    eligibleEntity = "risingpromise";
  }

  return { score, eligibleEntity };
}

export async function grantScraper(): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(
      "https://apply07.grants.gov/grantsws/rest/opportunities/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: "operations logistics program support",
          oppStatuses: "forecasted|posted",
          rows: 25,
        }),
      },
    );

    if (!response.ok) {
      logger.warn({ status: response.status }, "Grants.gov returned non-200");
      return [];
    }

    const data = (await response.json()) as { oppHits?: unknown[] };
    const items = data.oppHits ?? [];
    const results: Record<string, unknown>[] = [];

    for (const raw of items) {
      const item = raw as Record<string, unknown>;
      const grantId = (item["id"] as string) || `grant-${Date.now()}-${Math.random()}`;
      const parsed = {
        grantId,
        title: (item["title"] as string) || "",
        agency: (item["agencyName"] as string) || "",
        amount: Number(item["awardCeiling"] || 0),
        description: (item["synopsis"] as string) || "",
        deadline: item["closeDate"] ? new Date(item["closeDate"] as string) : null,
        eligibility: (item["eligibilities"] as string) || "",
        status: "queued",
      };

      const { score, eligibleEntity } = scoreGrant({
        closeDate: item["closeDate"] as string,
        awardCeiling: Number(item["awardCeiling"] || 0),
        description: parsed.description,
      });

      try {
        await db
          .insert(grantsTable)
          .values({ ...parsed, score, eligibleEntity })
          .onConflictDoUpdate({
            target: grantsTable.grantId,
            set: { title: parsed.title, score, deadline: parsed.deadline, eligibleEntity },
          });
      } catch (err) {
        logger.error({ err, grantId }, "Failed to upsert grant");
      }

      results.push({ ...parsed, score, eligibleEntity });
    }

    return results
      .sort((a, b) => (b.score as number) - (a.score as number))
      .slice(0, 5);
  } catch (err) {
    logger.error({ err }, "grantScraper failed");
    return [];
  }
}
