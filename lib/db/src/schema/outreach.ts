import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const outreachTable = pgTable("outreach", {
  id: serial("id").primaryKey(),
  targetName: text("target_name"),
  targetEmail: text("target_email"),
  targetOrg: text("target_org"),
  entityType: text("entity_type").default("prime"),
  subject: text("subject"),
  body: text("body"),
  status: text("status").default("draft"),
  qaScore: integer("qa_score"),
  qaFeedback: text("qa_feedback"),
  linkedOpportunityId: integer("linked_opportunity_id"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Outreach = typeof outreachTable.$inferSelect;
export type InsertOutreach = typeof outreachTable.$inferInsert;
