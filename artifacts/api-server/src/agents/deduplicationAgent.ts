import { db } from "@workspace/db";
import { agentLogsTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";

function stringSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

interface DedupeItem {
  id: string;
  title: string;
  agency?: string;
  deadline?: string | Date | null;
}

interface DedupeResult {
  unique: DedupeItem[];
  duplicates: Array<{ item: DedupeItem; reason: string }>;
}

export function checkDuplicates(
  incoming: DedupeItem[],
  existing: DedupeItem[],
): DedupeResult {
  const unique: DedupeItem[] = [];
  const duplicates: Array<{ item: DedupeItem; reason: string }> = [];

  for (const item of incoming) {
    let isDuplicate = false;
    let reason = "";

    for (const ex of existing) {
      if (item.id === ex.id) {
        isDuplicate = true;
        reason = "Exact ID match";
        break;
      }

      const similarity = stringSimilarity(item.title, ex.title);
      if (similarity > 0.85 && item.agency === ex.agency) {
        isDuplicate = true;
        reason = `Title similarity ${(similarity * 100).toFixed(0)}% + same agency`;
        break;
      }

      if (
        item.agency === ex.agency &&
        item.deadline &&
        ex.deadline &&
        new Date(item.deadline).toDateString() === new Date(ex.deadline).toDateString()
      ) {
        isDuplicate = true;
        reason = "Same agency + same deadline";
        break;
      }
    }

    if (isDuplicate) {
      duplicates.push({ item, reason });
    } else {
      unique.push(item);
    }
  }

  return { unique, duplicates };
}

export async function deduplicationAgent(params: {
  items: DedupeItem[];
  existing: DedupeItem[];
  category: string;
}): Promise<DedupeResult> {
  const start = Date.now();
  const result = checkDuplicates(params.items, params.existing);

  if (result.duplicates.length > 0) {
    logger.info(
      { category: params.category, duplicates: result.duplicates.length },
      "Duplicates detected",
    );

    try {
      await db.insert(agentLogsTable).values({
        agentName: "deduplication",
        status: "success",
        errorMessage: result.duplicates
          .map((d) => `${d.item.id}: ${d.reason}`)
          .join("; "),
        durationMs: Date.now() - start,
      });
    } catch (err) {
      logger.error({ err }, "Failed to log deduplication run");
    }
  }

  return result;
}
