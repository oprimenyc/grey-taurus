import { Router } from "express";
import { z } from "zod";
import { verifyCredentials } from "../auth.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const { username, password } = parsed.data;
    const valid = await verifyCredentials(username, password);

    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/auth/session", (req, res) => {
  if (req.session.authenticated) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
