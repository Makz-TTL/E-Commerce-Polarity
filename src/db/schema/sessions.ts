import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core"

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(), 
  sess: jsonb("sess").notNull(),  
  expire: timestamp("expire", { mode: "date" }).notNull(),
})