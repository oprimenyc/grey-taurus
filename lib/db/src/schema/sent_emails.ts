import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const sentEmailsTable = pgTable("sent_emails", {
  id: serial("id").primaryKey(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  templateType: text("template_type"),
  opportunityRef: text("opportunity_ref"),
  sentAt: timestamp("sent_at").defaultNow(),
  status: text("status").default("sent"),
  guardRailFlags: text("guard_rail_flags"),
});

export type SentEmail = typeof sentEmailsTable.$inferSelect;
export type InsertSentEmail = typeof sentEmailsTable.$inferInsert;
