import { logger } from "../lib/logger.js";

export async function scoringAgent(): Promise<void> {
  logger.info("scoringAgent: re-scoring opportunities based on updated criteria");
}
