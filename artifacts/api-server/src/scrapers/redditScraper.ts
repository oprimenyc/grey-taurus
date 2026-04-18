import { db } from "@workspace/db";
import { redditIntelTable } from "@workspace/db/schema";
import { logger } from "../lib/logger.js";

const SUBREDDITS = ["govcontracting", "smallbusiness", "RFP", "federalemployees", "government", "usajobs"];

const SEARCH_KEYWORDS = [
  "teaming partner",
  "subcontractor needed",
  "capabilities statement",
  "sources sought",
  "small business needed",
  "operations support contract",
  "logistics support contract",
  "program support RFP",
  "facilities management contract",
  "administrative support contract",
  "looking for prime",
  "looking for sub",
];

const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  {
    category: "TEAMING_REQUEST",
    keywords: ["looking for", "need a sub", "teaming", "partner needed", "subcontractor", "capabilities statement requested"],
  },
  {
    category: "UNADVERTISED_OPPORTUNITY",
    keywords: ["rfp coming", "solicitation soon", "market research", "sources sought", "pre-solicitation", "planning to award"],
  },
  {
    category: "AGENCY_PAIN_POINT",
    keywords: ["contract issues", "vendor failed", "looking to replace", "incumbent problems", "performance issues", "poor contractor"],
  },
  {
    category: "COMPETITIVE_INTEL",
    keywords: ["idiq", "contract vehicle", "prime contractor", "seaport", "oasis", "alliant"],
  },
  {
    category: "MARKET_SIGNAL",
    keywords: ["agency budget", "new program", "hiring surge", "policy change", "continuing resolution", "cr spending"],
  },
];

const NAICS_KEYWORDS = ["541611", "541614", "561110", "561210", "561990", "operations", "logistics", "facilities", "administrative"];

function classify(title: string, body: string): string {
  const text = `${title} ${body}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.category;
  }
  if (NAICS_KEYWORDS.some((kw) => text.includes(kw))) return "MARKET_SIGNAL";
  return "UNCATEGORIZED";
}

function scorePost(item: {
  category: string;
  redditScore: number;
  numComments: number;
  createdAt: Date;
}): number {
  let score = 0;
  const categoryScores: Record<string, number> = {
    TEAMING_REQUEST: 40,
    UNADVERTISED_OPPORTUNITY: 35,
    AGENCY_PAIN_POINT: 25,
    COMPETITIVE_INTEL: 20,
    MARKET_SIGNAL: 15,
    UNCATEGORIZED: 0,
  };
  score += categoryScores[item.category] ?? 0;
  if (item.redditScore > 50) score += 10;
  if (item.numComments > 10) score += 10;
  const hoursSince = (Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince <= 24) score += 5;
  return score;
}

const DELAY_MS = 1000;

async function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    await delay();
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GreyTaurusBot/1.0 (by /u/oprimenyc)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractPosts(data: Record<string, unknown>): Record<string, unknown>[] {
  try {
    const listing = data as { data?: { children?: Array<{ data?: unknown }> } };
    return (listing.data?.children ?? []).map((c) => c.data as Record<string, unknown>);
  } catch {
    return [];
  }
}

export async function redditScraper(): Promise<Record<string, unknown>[]> {
  const allPosts: Record<string, unknown>[] = [];

  for (const subreddit of SUBREDDITS) {
    const data = await fetchJson(`https://www.reddit.com/r/${subreddit}/new.json?limit=50`);
    if (data) allPosts.push(...extractPosts(data));
  }

  for (const keyword of SEARCH_KEYWORDS) {
    const encoded = encodeURIComponent(keyword);
    const data = await fetchJson(
      `https://www.reddit.com/search.json?q=${encoded}&sort=new&limit=25&t=week`,
    );
    if (data) allPosts.push(...extractPosts(data));
  }

  const seen = new Set<string>();
  const results: Record<string, unknown>[] = [];

  for (const raw of allPosts) {
    const postId = raw["id"] as string;
    if (!postId || seen.has(postId)) continue;
    seen.add(postId);

    const title = (raw["title"] as string) || "";
    const body = (raw["selftext"] as string) || "";
    const combined = `${title} ${body}`.toLowerCase();
    if (!NAICS_KEYWORDS.some((kw) => combined.includes(kw)) &&
        !SEARCH_KEYWORDS.some((kw) => combined.includes(kw.toLowerCase()))) {
      continue;
    }

    const category = classify(title, body);
    const createdAt = new Date(((raw["created_utc"] as number) || 0) * 1000);
    const redditScore = (raw["score"] as number) || 0;
    const numComments = (raw["num_comments"] as number) || 0;

    const score = scorePost({ category, redditScore, numComments, createdAt });

    const post = {
      postId,
      subreddit: (raw["subreddit"] as string) || "",
      title,
      body: body.slice(0, 2000),
      author: (raw["author"] as string) || "",
      url: `https://reddit.com${raw["permalink"] as string || ""}`,
      category,
      score,
      redditScore,
      numComments,
      createdAt,
      actionTaken: "none",
    };

    try {
      await db
        .insert(redditIntelTable)
        .values(post)
        .onConflictDoUpdate({
          target: redditIntelTable.postId,
          set: { score, redditScore, numComments },
        });
      results.push(post);
    } catch (err) {
      logger.error({ err, postId }, "Failed to upsert reddit post");
    }
  }

  logger.info({ count: results.length }, "redditScraper complete");
  return results
    .sort((a, b) => (b.score as number) - (a.score as number))
    .slice(0, 10);
}
