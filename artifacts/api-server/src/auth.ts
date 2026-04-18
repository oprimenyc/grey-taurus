import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { logger } from "./lib/logger.js";

const ADMIN_USERNAME = "admin";

let hashedPassword: string | null = null;

export async function initAuth(): Promise<void> {
  const rawPassword = process.env["HUB_PASSWORD"];
  if (!rawPassword) {
    throw new Error("HUB_PASSWORD env var is required but missing");
  }
  hashedPassword = await bcrypt.hash(rawPassword, 12);
  logger.info("Auth initialized");
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  if (!hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
}

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
    username: string;
  }
}
