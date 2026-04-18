import { db } from "@workspace/db";
import { agentLogsTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";
import { samScraper } from "../scrapers/samScraper.js";
import { grantScraper } from "../scrapers/grantScraper.js";
import { subcontractScraper } from "../scrapers/subcontractScraper.js";

const REQUIRED_NAICS = ["541611", "541614", "561110", "561210", "561990", "236220"];

interface ScrapeSummary {
  opportunities: Record<string, unknown>[];
  grants: Record<string, unknown>[];
  subcontracts: Record<string, unknown>[];
  stateResults: Record<string, unknown>[];
}

interface Gap {
  type: string;
  detail: string;
}

export async function gapDetectionAgent(summary: ScrapeSummary): Promise<{
  gaps: Gap[];
  notes: string[];
}> {
  const start = Date.now();
  const gaps: Gap[] = [];
  const notes: string[] = [];

  const foundNaics = new Set(
    [...summary.opportunities, ...summary.subcontracts]
      .map((o) => (o["naicsCode"] as string) || "")
      .filter(Boolean),
  );

  for (const code of REQUIRED_NAICS) {
    if (!foundNaics.has(code)) {
      gaps.push({ type: "missing_naics", detail: `NAICS ${code} not represented in today's results` });
    }
  }

  const hasFloridaResults = summary.stateResults.length > 0;
  if (!hasFloridaResults) {
    gaps.push({ type: "missing_state", detail: "No Florida state results found" });
  }

  if (summary.grants.length < 3) {
    gaps.push({ type: "insufficient_grants", detail: `Only ${summary.grants.length} grants found (minimum 3)` });
    logger.info("Gap detected: insufficient grants — triggering additional grant scrape");
    const extra = await grantScraper();
    notes.push(`Additional grant scrape yielded ${extra.length} results`);
  }

  if (summary.subcontracts.length < 5) {
    gaps.push({ type: "insufficient_subcontracts", detail: `Only ${summary.subcontracts.length} subcontract leads (minimum 5)` });
    logger.info("Gap detected: insufficient subcontracts — triggering additional scrape");
    const extra = await subcontractScraper();
    notes.push(`Additional subcontract scrape yielded ${extra.length} results`);
  }

  if (summary.opportunities.length < 3) {
    gaps.push({ type: "insufficient_opportunities", detail: `Only ${summary.opportunities.length} opportunities found` });
    const extra = await samScraper();
    notes.push(`Additional SAM scrape yielded ${extra.length} results`);
  }

  for (const gap of gaps) {
    notes.push(gap.detail);
  }

  try {
    await db.insert(agentLogsTable).values({
      agentName: "gapDetection",
      status: gaps.length > 0 ? "partial" : "success",
      opportunitiesFound: summary.opportunities.length,
      grantsFound: summary.grants.length,
      subcontractsFound: summary.subcontracts.length,
      errorMessage: gaps.map((g) => g.detail).join("; ") || null,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    logger.error({ err }, "Failed to log gap detection run");
  }

  logger.info({ gapCount: gaps.length }, "Gap detection complete");
  return { gaps, notes };
}
