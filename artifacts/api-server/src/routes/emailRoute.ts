import { Router } from "express";
import { z } from "zod";
import { sendEmail } from "../email/emailService.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateType: z.string().optional(),
  opportunityRef: z.string().optional(),
});

router.post("/email/send", requireAuth, async (req, res) => {
  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }

    const { to, subject, body, templateType, opportunityRef } = parsed.data;
    const result = await sendEmail({ to, subject, text: body, templateType, opportunityRef });

    if (!result.success) {
      res.status(422).json({ error: result.error });
      return;
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
