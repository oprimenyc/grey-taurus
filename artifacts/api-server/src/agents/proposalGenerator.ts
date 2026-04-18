import { logger } from "../lib/logger.js";

export async function proposalGenerator(count = 3): Promise<void> {
  logger.info({ count }, "proposalGenerator: generating proposals for top opportunities");
}
