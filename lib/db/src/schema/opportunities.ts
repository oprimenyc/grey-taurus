import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const opportunitiesTable = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  noticeId: text("notice_id").unique().notNull(),
  title: text("title"),
  agency: text("agency"),
  postedDate: timestamp("posted_date"),
  responseDeadline: timestamp("response_deadline"),
  naicsCode: text("naics_code"),
  type: text("type"),
  description: text("description"),
  setAside: text("set_aside"),
  placeOfPerformance: text("place_of_performance"),
  score: integer("score").default(0),
  source: text("source").default("sam_gov"),
  status: text("status").default("queued"),
  addedDate: timestamp("added_date").defaultNow(),
});

export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type InsertOpportunity = typeof opportunitiesTable.$inferInsert;
