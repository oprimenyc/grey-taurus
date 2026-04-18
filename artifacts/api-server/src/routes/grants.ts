import { Router } from "express";
import { db } from "@workspace/db";
import { grantsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/grants", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query["page"] || 1));
    const limit = Math.min(50, Number(req.query["limit"] || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(grantsTable)
      .orderBy(desc(grantsTable.score))
      .limit(limit)
      .offset(offset);

    res.json({ data: rows, page, limit });
  } catch {
    res.status(500).json({ error: "Failed to fetch grants" });
  }
});

export default router;
