import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const redditIntelTable = pgTable("reddit_intel", {
  id: serial("id").primaryKey(),
  postId: text("post_id").unique().notNull(),
  subreddit: text("subreddit"),
  title: text("title"),
  body: text("body"),
  author: text("author"),
  url: text("url"),
  category: text("category").default("UNCATEGORIZED"),
  score: integer("score").default(0),
  redditScore: integer("reddit_score").default(0),
  numComments: integer("num_comments").default(0),
  createdAt: timestamp("created_at"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  actionTaken: text("action_taken").default("none"),
  notes: text("notes"),
});

export type RedditIntel = typeof redditIntelTable.$inferSelect;
export type InsertRedditIntel = typeof redditIntelTable.$inferInsert;
