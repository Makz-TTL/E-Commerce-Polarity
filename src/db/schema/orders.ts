import { pgTable, integer, serial, doublePrecision } from "drizzle-orm/pg-core"

export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  userId: integer().notNull(),
  productId: integer().notNull(),
  quantity: integer().notNull(),
  totalPrice: doublePrecision().notNull(),
})

type Order = typeof orders.$inferSelect
