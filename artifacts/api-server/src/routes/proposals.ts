import { Router } from "express";
import { db } from "@workspace/db";
import { proposalsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.get("/proposals", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] || 1));
    const limit = Math.min(50, Number(req.query["limit"] || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(proposalsTable)
      .orderBy(desc(proposalsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

router.put("/proposals/:id/status", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status } = req.body as { status: string };
    await db.update(proposalsTable).set({ status, updatedAt: new Date() }).where(eq(proposalsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update proposal status" });
  }
});

router.put("/proposals/:id/content", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { content } = req.body as { content: string };
    await db.update(proposalsTable).set({ content, updatedAt: new Date() }).where(eq(proposalsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update proposal content" });
  }
});

export default router;
