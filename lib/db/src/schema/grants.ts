import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const grantsTable = pgTable("grants", {
  id: serial("id").primaryKey(),
  grantId: text("grant_id").unique().notNull(),
  title: text("title").notNull(),
  agency: text("agency"),
  amount: integer("amount"),
  eligibility: text("eligibility"),
  deadline: timestamp("deadline"),
  description: text("description"),
  score: integer("score").default(0),
  status: text("status").default("queued"),
  eligibleEntity: text("eligible_entity").default("greytaurus"),
  addedDate: timestamp("added_date").defaultNow(),
  lastAction: timestamp("last_action"),
});

export type Grant = typeof grantsTable.$inferSelect;
export type InsertGrant = typeof grantsTable.$inferInsert;
