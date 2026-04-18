import { db } from "@workspace/db";
import { opportunitiesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const NAICS_CODES = ["541611", "541614", "561110", "561210", "561990", "236220"];

function scoreOpportunity(item: Record<string, unknown>): number {
  let score = 0;
  const deadline = item.responseDeadline as string | undefined;
  const setAside = ((item.setAside as string) || "").toLowerCase();
  const naics = (item.naicsCode as string) || "";
  const description = ((item.description as string) || "").toLowerCase();

  if (deadline) {
    const daysUntil = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil > 0 && daysUntil <= 14) score += 30;
  }
  if (setAside.includes("small business") || setAside.includes("8(a)") || setAside.includes("sb")) score += 25;
  if (naics === "541611" || naics === "561110") score += 20;
  if (!description.includes("incumbent")) score += 10;

  return score;
}

export async function samScraper(): Promise<Record<string, unknown>[]> {
  const apiKey = process.env["SAM_API_KEY"];
  if (!apiKey) {
    logger.warn("SAM_API_KEY is not set — skipping SAM.gov scrape");
    return [];
  }

  try {
    const postedFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]!;

    const params = new URLSearchParams({
      api_key: apiKey,
      ptype: "o",
      ncode: NAICS_CODES.join(","),
      limit: "50",
      active: "true",
      postedFrom,
    });

    const response = await fetch(
      `https://api.sam.gov/opportunities/v2/search?${params.toString()}`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) {
      logger.warn({ status: response.status }, "SAM.gov API returned non-200");
      return [];
    }

    const data = (await response.json()) as { opportunitiesData?: unknown[] };
    const items = data.opportunitiesData ?? [];

    const results: Record<string, unknown>[] = [];

    for (const raw of items) {
      const item = raw as Record<string, unknown>;
      const parsed = {
        noticeId: (item["noticeId"] as string) || `sam-${Date.now()}-${Math.random()}`,
        title: (item["title"] as string) || "",
        agency: (item["organizationHierarchy"] as Record<string, unknown>)?.["cgac"] as string || "",
        naicsCode: (item["naicsCode"] as Record<string, unknown>)?.["code"] as string || "",
        type: (item["type"] as string) || "",
        description: (item["description"] as string) || "",
        setAside: (item["typeOfSetAsideDescription"] as string) || "",
        placeOfPerformance: JSON.stringify(item["placeOfPerformance"] || {}),
        postedDate: item["postedDate"] ? new Date(item["postedDate"] as string) : null,
        responseDeadline: item["responseDeadline"] ? new Date(item["responseDeadline"] as string) : null,
        source: "sam_gov",
        status: "queued",
      };

      const score = scoreOpportunity({ ...parsed, naicsCode: parsed.naicsCode });

      try {
        await db
          .insert(opportunitiesTable)
          .values({ ...parsed, score })
          .onConflictDoUpdate({
            target: opportunitiesTable.noticeId,
            set: { title: parsed.title, score, responseDeadline: parsed.responseDeadline },
          });
      } catch (err) {
        logger.error({ err, noticeId: parsed.noticeId }, "Failed to upsert opportunity");
      }

      results.push({ ...parsed, score });
    }

    return results
      .sort((a, b) => (b.score as number) - (a.score as number))
      .slice(0, 10);
  } catch (err) {
    logger.error({ err }, "samScraper failed");
    return [];
  }
}
