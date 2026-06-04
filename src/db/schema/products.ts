import { pgTable, integer, text, serial } from "drizzle-orm/pg-core"

export const products = pgTable("products", {
  id: serial().primaryKey(),
  userId: integer().notNull(),
  productName: text().notNull(),
  description: text(),
  price: integer().notNull(),
  stock: integer().notNull(),
  category: text().notNull(),
  imageUrl: text(),
})

type Product = typeof products.$inferSelect
