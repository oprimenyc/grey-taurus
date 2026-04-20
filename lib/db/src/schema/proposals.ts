import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id"),
  title: text("title").notNull(),
  agency: text("agency"),
  status: text("status").default("draft"),
  content: text("content"),
  qaScore: integer("qa_score"),
  qaFeedback: text("qa_feedback"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Proposal = typeof proposalsTable.$inferSelect;
export type InsertProposal = typeof proposalsTable.$inferInsert;
