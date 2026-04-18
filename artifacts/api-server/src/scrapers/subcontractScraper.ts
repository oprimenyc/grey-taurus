import { db } from "@workspace/db";
import { subcontractLeadsTable, primeContractorsTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";

const NAICS_CODES = ["541611", "541614", "561110", "561210", "561990"];
const FEDERAL_CIVILIAN_AGENCIES = [
  "department of health", "department of labor", "department of education",
  "department of housing", "department of transportation", "general services",
  "veterans affairs", "department of agriculture", "small business administration",
];

function scoreSubcontract(item: {
  expiryDate?: string | null;
  awardAmount?: number;
  naicsCode?: string;
  agency?: string;
}): number {
  let score = 0;
  if (item.expiryDate) {
    const monthsUntil = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsUntil > 0 && monthsUntil <= 6) score += 30;
  }
  if ((item.awardAmount ?? 0) > 2_000_000) score += 25;
  if (NAICS_CODES.includes(item.naicsCode ?? "")) score += 20;
  const agencyLower = (item.agency || "").toLowerCase();
  if (FEDERAL_CIVILIAN_AGENCIES.some((a) => agencyLower.includes(a))) score += 15;
  return score;
}

export async function subcontractScraper(): Promise<Record<string, unknown>[]> {
  try {
    const today = new Date().toISOString().split("T")[0]!;
    const response = await fetch(
      "https://api.usaspending.gov/api/v2/search/spending_by_award/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            naics_codes: NAICS_CODES,
            award_type_codes: ["A", "B", "C", "D"],
            time_period: [{ start_date: "2023-01-01", end_date: today }],
          },
          fields: [
            "recipient_name",
            "awarding_agency_name",
            "award_amount",
            "period_of_performance_end_date",
            "naics_code",
            "generated_internal_id",
          ],
          limit: 50,
          sort: "award_amount",
          order: "desc",
        }),
      },
    );

    if (!response.ok) {
      logger.warn({ status: response.status }, "USASpending API returned non-200");
      return [];
    }

    const data = (await response.json()) as { results?: unknown[] };
    const items = data.results ?? [];
    const results: Record<string, unknown>[] = [];

    for (const raw of items) {
      const item = raw as Record<string, unknown>;
      const awardAmount = Number(item["award_amount"] || 0);
      if (awardAmount < 750_000) continue;

      const expiryDate = item["period_of_performance_end_date"] as string | null;
      if (expiryDate) {
        const monthsLeft = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsLeft <= 0 || monthsLeft > 18) continue;
      }

      const contractId = (item["generated_internal_id"] as string) || `sub-${Date.now()}-${Math.random()}`;
      const primeContractor = (item["recipient_name"] as string) || "Unknown";
      const agency = (item["awarding_agency_name"] as string) || "";
      const naicsCode = (item["naics_code"] as string) || "";

      const score = scoreSubcontract({
        expiryDate: expiryDate ?? undefined,
        awardAmount,
        naicsCode,
        agency,
      });

      const leadData = {
        primeContractor,
        contractTitle: `${agency} Contract`,
        awardAmount: Math.round(awardAmount),
        agency,
        naicsCode,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        contractId,
        outreachStatus: "queued",
        score,
      };

      try {
        await db
          .insert(subcontractLeadsTable)
          .values(leadData)
          .onConflictDoUpdate({
            target: subcontractLeadsTable.contractId,
            set: { score, awardAmount: leadData.awardAmount },
          });

        await db
          .insert(primeContractorsTable)
          .values({
            companyName: primeContractor,
            naicsCodes: [naicsCode],
            activeContracts: 1,
            totalContractValue: Math.round(awardAmount),
            status: "new",
          })
          .onConflictDoNothing();
      } catch (err) {
        logger.error({ err, contractId }, "Failed to upsert subcontract lead");
      }

      results.push(leadData);
    }

    return results
      .sort((a, b) => (b.score as number) - (a.score as number))
      .slice(0, 25);
  } catch (err) {
    logger.error({ err }, "subcontractScraper failed");
    return [];
  }
}
