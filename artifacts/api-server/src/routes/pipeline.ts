import { Router } from "express";
import { db } from "@workspace/db";
import { pipelineTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/pipeline", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] || 1));
    const limit = Math.min(200, Number(req.query["limit"] || 100));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(pipelineTable)
      .orderBy(desc(pipelineTable.score))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

router.post("/pipeline", requireAuth, async (req, res) => {
  try {
    const { opportunityId, title, agency, score, naicsCode, responseDeadline } = req.body as {
      opportunityId?: number;
      title: string;
      agency?: string;
      score?: number;
      naicsCode?: string;
      responseDeadline?: string;
    };

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const [row] = await db.insert(pipelineTable).values({
      opportunityId: opportunityId ?? null,
      title,
      agency: agency ?? null,
      stage: "identified",
      score: score ?? 0,
      naicsCode: naicsCode ?? null,
      responseDeadline: responseDeadline ? new Date(responseDeadline) : null,
    }).returning();

    res.json({ ok: true, data: row });
  } catch {
    res.status(500).json({ error: "Failed to add to pipeline" });
  }
});

router.put("/pipeline/:id/stage", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { stage } = req.body as { stage: string };
    await db.update(pipelineTable).set({ stage, updatedAt: new Date() }).where(eq(pipelineTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update pipeline stage" });
  }
});

export default router;
