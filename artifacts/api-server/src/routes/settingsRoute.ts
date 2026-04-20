import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(settingsTable);
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings/:key", async (req, res) => {
  try {
    const key = req.params["key"]!;
    const { value } = req.body as { value: string };
    await db
      .insert(settingsTable)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update setting" });
  }
});

export default router;
