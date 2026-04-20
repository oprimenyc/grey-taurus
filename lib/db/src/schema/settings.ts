import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Setting = typeof settingsTable.$inferSelect;
export type InsertSetting = typeof settingsTable.$inferInsert;
