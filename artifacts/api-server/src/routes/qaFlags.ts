import { Router } from "express";
import { db } from "@workspace/db";
import { qaFlagsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/qa-flags", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(qaFlagsTable)
      .where(eq(qaFlagsTable.resolved, false));
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch QA flags" });
  }
});

router.put("/qa-flags/:id/resolve", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db
      .update(qaFlagsTable)
      .set({ resolved: true })
      .where(eq(qaFlagsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to resolve QA flag" });
  }
});

export default router;
