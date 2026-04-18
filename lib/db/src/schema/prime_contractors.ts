import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const primeContractorsTable = pgTable("prime_contractors", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  cage: text("cage"),
  uei: text("uei"),
  naicsCodes: text("naics_codes").array(),
  activeContracts: integer("active_contracts").default(0),
  totalContractValue: integer("total_contract_value").default(0),
  lastContactDate: timestamp("last_contact_date"),
  status: text("status").default("new"),
});

export type PrimeContractor = typeof primeContractorsTable.$inferSelect;
export type InsertPrimeContractor = typeof primeContractorsTable.$inferInsert;
