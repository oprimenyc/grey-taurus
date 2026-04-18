import cron from "node-cron";
import { db } from "@workspace/db";
import { agentLogsTable } from "@workspace/db/schema";
import { logger } from "./lib/logger.js";

import { samScraper } from "./scrapers/samScraper.js";
import { grantScraper } from "./scrapers/grantScraper.js";
import { subcontractScraper } from "./scrapers/subcontractScraper.js";
import { stateScraper } from "./scrapers/stateScraper.js";
import { redditScraper } from "./scrapers/redditScraper.js";

import { deduplicationAgent } from "./agents/deduplicationAgent.js";
import { qaAgent } from "./agents/qaAgent.js";
import { gapDetectionAgent } from "./agents/gapDetectionAgent.js";
import { scoringAgent } from "./agents/scoringAgent.js";
import { capabilityMatcher } from "./agents/capabilityMatcher.js";
import { subcontractHunter } from "./agents/subcontractHunter.js";
import { proposalGenerator } from "./agents/proposalGenerator.js";
import { outreachDraftAgent } from "./agents/outreachDraftAgent.js";
import { dailyPriorityAgent } from "./agents/dailyPriorityAgent.js";

import { generateDailyBrief } from "./email/dailyBrief.js";

export async function dailyRun(): Promise<void> {
  const runStart = Date.now();
  logger.info("dailyRun started");

  let opportunitiesFound = 0;
  let grantsFound = 0;
  let subcontractsFound = 0;
  let redditPostsFound = 0;
  let emailsQueued = 0;
  let errorMessage: string | null = null;
  const gapNotes: string[] = [];

  try {
    // Step 1 — Scraping
    logger.info("dailyRun: Step 1 — Scraping");
    const [samResults, grantResults, subResults, stateResults, redditResults] = await Promise.all([
      samScraper(),
      grantScraper(),
      subcontractScraper(),
      stateScraper(),
      redditScraper(),
    ]);

    opportunitiesFound = samResults.length + stateResults.length;
    grantsFound = grantResults.length;
    subcontractsFound = subResults.length;
    redditPostsFound = redditResults.length;

    // Step 2 — Processing
    logger.info("dailyRun: Step 2 — Processing");
    await deduplicationAgent({
      items: samResults.map((o) => ({
        id: (o["noticeId"] as string) || "",
        title: (o["title"] as string) || "",
        agency: (o["agency"] as string) || undefined,
        deadline: (o["responseDeadline"] as string) || undefined,
      })),
      existing: [],
      category: "opportunities",
    });

    // Step 3 — Intelligence
    logger.info("dailyRun: Step 3 — Intelligence");
    const { notes } = await gapDetectionAgent({
      opportunities: samResults,
      grants: grantResults,
      subcontracts: subResults,
      stateResults,
    });
    gapNotes.push(...notes);

    await scoringAgent();
    await capabilityMatcher();
    await subcontractHunter();

    // Step 4 — Execution
    logger.info("dailyRun: Step 4 — Execution");
    await proposalGenerator(3);
    emailsQueued = await outreachDraftAgent(20);

    // Step 5 — Brief
    logger.info("dailyRun: Step 5 — Brief");
    await dailyPriorityAgent();
    await generateDailyBrief(gapNotes);

  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "dailyRun encountered an error");
  }

  const durationMs = Date.now() - runStart;

  try {
    await db.insert(agentLogsTable).values({
      agentName: "dailyRun",
      status: errorMessage ? "error" : "success",
      opportunitiesFound,
      grantsFound,
      subcontractsFound,
      redditPostsFound,
      emailsQueued,
      errorMessage,
      durationMs,
    });
  } catch (logErr) {
    logger.error({ err: logErr }, "Failed to log dailyRun to agent_logs");
  }

  logger.info({ durationMs }, "dailyRun complete");
}

export function startScheduler(): void {
  cron.schedule(
    "0 6 * * *",
    () => {
      dailyRun().catch((err) => logger.error({ err }, "Scheduled dailyRun failed"));
    },
    { timezone: "America/New_York" },
  );
  logger.info("Scheduler started — daily run at 06:00 America/New_York");
}
