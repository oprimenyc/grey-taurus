import { Router } from "express";
import { dailyRun } from "../scheduler.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/scan/run", requireAuth, async (_req, res) => {
  res.json({ message: "Scan triggered — running in background" });
  dailyRun().catch(() => {});
});

export default router;
