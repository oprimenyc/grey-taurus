import { logger } from "../lib/logger.js";

export async function outreachDraftAgent(count = 20): Promise<number> {
  logger.info({ count }, "outreachDraftAgent: queuing outreach drafts for review");
  return 0;
}
