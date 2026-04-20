import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const pipelineTable = pgTable("pipeline", {
  id: serial("id").primaryKey(),
  opportunityId: integer("opportunity_id"),
  title: text("title").notNull(),
  agency: text("agency"),
  stage: text("stage").default("identified"),
  score: integer("score").default(0),
  naicsCode: text("naics_code"),
  responseDeadline: timestamp("response_deadline"),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  addedDate: timestamp("added_date").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Pipeline = typeof pipelineTable.$inferSelect;
export type InsertPipeline = typeof pipelineTable.$inferInsert;
