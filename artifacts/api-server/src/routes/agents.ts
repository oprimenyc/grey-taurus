import { Router } from "express";
import { db } from "@workspace/db";
import { agentRunsTable, agentLogsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";
import { scoringAgent } from "../agents/scoringAgent.js";
import { capabilityMatcher } from "../agents/capabilityMatcher.js";
import { proposalGenerator } from "../agents/proposalGenerator.js";
import { outreachDraftAgent } from "../agents/outreachDraftAgent.js";
import { dailyPriorityAgent } from "../agents/dailyPriorityAgent.js";
import { subcontractHunter } from "../agents/subcontractHunter.js";

const router = Router();

const AGENT_RUNNERS: Record<string, () => Promise<unknown>> = {
  scoringAgent: () => scoringAgent(),
  capabilityMatcher: () => capabilityMatcher(),
  proposalGenerator: () => proposalGenerator(1),
  outreachDraftAgent: () => outreachDraftAgent(5),
  dailyPriorityAgent: () => dailyPriorityAgent(),
  subcontractHunter: () => subcontractHunter(),
};

router.post("/agents/run/:agentName", requireAuth, async (req, res) => {
  const agentName = req.params["agentName"] as string;
  const runner = AGENT_RUNNERS[agentName];
  if (!runner) {
    res.status(404).json({ error: `Agent '${agentName}' is not yet available for direct runs` });
    return;
  }
  res.json({ ok: true, agentName, message: `Agent ${agentName} triggered` });
  const start = Date.now();
  let status = "success";
  let errorMessage: string | null = null;
  try {
    await runner();
  } catch (err) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
  }
  await db.insert(agentRunsTable).values({
    agentName,
    status,
    triggeredBy: "user",
    startedAt: new Date(start),
    durationMs: Date.now() - start,
    errorMessage,
  }).catch(() => {});
});

router.get("/agents/runs", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query["limit"] || 50));
    const rows = await db
      .select()
      .from(agentRunsTable)
      .orderBy(desc(agentRunsTable.startedAt))
      .limit(limit);
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch agent runs" });
  }
});

router.get("/agents/logs", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query["limit"] || 50));
    const rows = await db
      .select()
      .from(agentLogsTable)
      .orderBy(desc(agentLogsTable.runAt))
      .limit(limit);
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch agent logs" });
  }
});

export default router;
