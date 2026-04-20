import { Router } from "express";
import { db } from "@workspace/db";
import { opportunitiesTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/opportunities", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] || 1));
    const limit = Math.min(50, Number(req.query["limit"] || 20));
    const offset = (page - 1) * limit;
    const status = req.query["status"] as string | undefined;

    let query = db.select().from(opportunitiesTable).orderBy(desc(opportunitiesTable.score));
    if (status) {
      query = query.where(eq(opportunitiesTable.status, status)) as typeof query;
    }
    const rows = await query.limit(limit).offset(offset);
    res.json({ data: rows, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

router.put("/opportunities/:id/status", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status } = req.body as { status: string };
    await db.update(opportunitiesTable).set({ status }).where(eq(opportunitiesTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update opportunity status" });
  }
});

export default router;
