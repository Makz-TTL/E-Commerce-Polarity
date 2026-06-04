import { sqliteTable, integer } from "drizzle-orm/sqlite-core"

export const productUsefulness = sqliteTable("productUsefulness", {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: integer().notNull(),
  productId: integer().notNull(),
  usefulness: integer({ mode: "boolean" }).notNull(),
})

type ProductUsefulness = typeof productUsefulness.$inferSelect
