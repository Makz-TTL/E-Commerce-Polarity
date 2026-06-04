import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const reviews = sqliteTable("reviews", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull(),
  productId: integer().notNull(),
  rating: integer().notNull(),
  title: text(),
  comment: text(),
})

type Review = typeof reviews.$inferSelect
