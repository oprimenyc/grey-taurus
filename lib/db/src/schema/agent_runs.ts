import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const agentRunsTable = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull(),
  status: text("status").notNull(),
  input: text("input"),
  output: text("output"),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
  triggeredBy: text("triggered_by").default("scheduler"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type AgentRun = typeof agentRunsTable.$inferSelect;
export type InsertAgentRun = typeof agentRunsTable.$inferInsert;
