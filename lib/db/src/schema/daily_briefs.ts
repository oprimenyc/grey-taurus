import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const dailyBriefsTable = pgTable("daily_briefs", {
  id: serial("id").primaryKey(),
  subject: text("subject"),
  body: text("body"),
  opportunitiesCount: integer("opportunities_count").default(0),
  grantsCount: integer("grants_count").default(0),
  subcontractsCount: integer("subcontracts_count").default(0),
  gapNotes: text("gap_notes"),
  sentTo: text("sent_to"),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("sent"),
});

export type DailyBrief = typeof dailyBriefsTable.$inferSelect;
export type InsertDailyBrief = typeof dailyBriefsTable.$inferInsert;
