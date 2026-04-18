import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const qaFlagsTable = pgTable("qa_flags", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  flagType: text("flag_type").notNull(),
  flagDetail: text("flag_detail"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type QaFlag = typeof qaFlagsTable.$inferSelect;
export type InsertQaFlag = typeof qaFlagsTable.$inferInsert;
