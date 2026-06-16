import { pgTable, integer, text, serial, doublePrecision } from "drizzle-orm/pg-core"
import { users } from "./users"
import { products } from "./products"

export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer().notNull().references(() => products.id, { onDelete: "set null" }),
  quantity: integer().notNull(),
  totalPrice: doublePrecision().notNull(),
  address: text(),
  city: text(),
  status: text()
})

type Order = typeof orders.$inferSelect