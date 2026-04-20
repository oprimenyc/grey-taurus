import { Router } from "express";
import { db } from "@workspace/db";
import { agentRunsTable, agentLogsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

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
