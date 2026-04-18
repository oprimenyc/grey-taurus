import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const agentLogsTable = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull(),
  runAt: timestamp("run_at").defaultNow(),
  status: text("status").notNull(),
  opportunitiesFound: integer("opportunities_found").default(0),
  grantsFound: integer("grants_found").default(0),
  subcontractsFound: integer("subcontracts_found").default(0),
  redditPostsFound: integer("reddit_posts_found").default(0),
  emailsQueued: integer("emails_queued").default(0),
  errorMessage: text("error_message"),
  durationMs: integer("duration_ms"),
});

export type AgentLog = typeof agentLogsTable.$inferSelect;
export type InsertAgentLog = typeof agentLogsTable.$inferInsert;
