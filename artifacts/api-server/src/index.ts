import app from "./app.js";
import { logger } from "./lib/logger.js";
import { initAuth } from "./auth.js";
import { startScheduler } from "./scheduler.js";
import { runMigrations } from "@workspace/db";

// Hard-fail env vars
const REQUIRED_ENV = [
  "ANTHROPIC_API_KEY",
  "DATABASE_URL",
  "SESSION_SECRET",
  "IONOS_USER",
  "IONOS_PASSWORD",
  "BRIEF_RECIPIENT",
  "HUB_PASSWORD",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Required environment variable ${key} is missing`);
  }
}

// Warn-only env vars
const OPTIONAL_ENV = ["SAM_API_KEY", "GMAIL_USER", "GMAIL_APP_PASSWORD"];
for (const key of OPTIONAL_ENV) {
  if (!process.env[key]) {
    logger.warn(`Optional environment variable ${key} is not set`);
  }
}

const port = Number(process.env["PORT"] ?? 5000);

async function main(): Promise<void> {
  logger.info("Running database migrations...");
  await runMigrations();
  logger.info("Database migrations complete");

  await initAuth();
  startScheduler();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Startup failed");
  process.exit(1);
});
