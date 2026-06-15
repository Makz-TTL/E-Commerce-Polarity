import { pgTable, integer, text, serial, doublePrecision, boolean } from "drizzle-orm/pg-core"

export const products = pgTable("products", {
  id: serial().primaryKey(),
  userId: integer().notNull(),
  productName: text().notNull(),
  description: text(),
  price: doublePrecision().notNull(),
  stock: integer().notNull(),
  category: text().notNull(),
  imageUrl: text(),
  status: text(),
  reliability: doublePrecision(),
  // isDeleted: boolean().notNull().default(false)

})

type Product = typeof products.$inferSelect
