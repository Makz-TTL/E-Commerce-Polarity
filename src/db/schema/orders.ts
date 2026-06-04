import { sqliteTable, integer } from "drizzle-orm/sqlite-core"

export const orders = sqliteTable("orders", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull(),
  productId: integer().notNull(),
  quantity: integer().notNull(),
  totalPrice: integer().notNull(),
})

type Order = typeof orders.$inferSelect
