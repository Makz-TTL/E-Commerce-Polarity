import { pgTable, integer, text, serial, doublePrecision, boolean } from "drizzle-orm/pg-core"
import { users } from "./users"

export const products = pgTable("products", {
  id: serial().primaryKey(),
  userId: integer().notNull().references(() => users.id, { onDelete: "cascade" }),
  productName: text().notNull(),
  description: text(),
  price: doublePrecision().notNull(),
  stock: integer().notNull(),
  category: text().notNull(),
  isDisable: boolean().notNull().default(false),
  imageUrl: text(),
  status: text(),
  reliability: doublePrecision(),
})

type Product = typeof products.$inferSelect