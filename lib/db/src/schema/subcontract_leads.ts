import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const subcontractLeadsTable = pgTable("subcontract_leads", {
  id: serial("id").primaryKey(),
  primeContractor: text("prime_contractor").notNull(),
  contractTitle: text("contract_title"),
  awardAmount: integer("award_amount"),
  agency: text("agency"),
  naicsCode: text("naics_code"),
  expiryDate: timestamp("expiry_date"),
  contractId: text("contract_id").unique().notNull(),
  outreachStatus: text("outreach_status").default("queued"),
  score: integer("score").default(0),
  addedDate: timestamp("added_date").defaultNow(),
});

export type SubcontractLead = typeof subcontractLeadsTable.$inferSelect;
export type InsertSubcontractLead = typeof subcontractLeadsTable.$inferInsert;
