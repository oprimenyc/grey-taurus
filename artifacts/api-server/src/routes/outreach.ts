import { Router } from "express";
import { db } from "@workspace/db";
import { outreachTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/outreach", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] || 1));
    const limit = Math.min(50, Number(req.query["limit"] || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(outreachTable)
      .orderBy(desc(outreachTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch outreach" });
  }
});

router.put("/outreach/:id/status", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const { status } = req.body as { status: string };
    await db.update(outreachTable).set({ status, updatedAt: new Date() }).where(eq(outreachTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update outreach status" });
  }
});

export default router;
