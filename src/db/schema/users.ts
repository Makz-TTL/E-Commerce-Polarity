import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  lastName: text().notNull(),
  eMail: text().notNull().unique(),
  userName: text().notNull().unique(),
  password: text().notNull(),
  cookie: text().notNull(),
})

type User = typeof users.$inferSelect
