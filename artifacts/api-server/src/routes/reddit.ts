import { Router } from "express";
import { db } from "@workspace/db";
import { redditIntelTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/reddit-intel", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] || 1));
    const limit = Math.min(50, Number(req.query["limit"] || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(redditIntelTable)
      .orderBy(desc(redditIntelTable.score))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch reddit intel" });
  }
});

const actionSchema = z.object({
  actionTaken: z.enum(["none", "contacted", "added_to_pipeline", "archived"]),
});

router.put("/reddit-intel/:id/action", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const parsed = actionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid action" });
      return;
    }

    await db
      .update(redditIntelTable)
      .set({ actionTaken: parsed.data.actionTaken })
      .where(eq(redditIntelTable.id, id));

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update action" });
  }
});

export default router;
