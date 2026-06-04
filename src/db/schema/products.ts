import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const products = sqliteTable("products", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull(),
  productName: text().notNull(),
  description: text(),
  price: integer().notNull(),
  stock: integer().notNull(),
  category: text().notNull(),
  imageUrl: text(),
})

type Product = typeof products.$inferSelect
