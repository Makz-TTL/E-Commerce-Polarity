import { pgTable, integer, boolean, serial} from "drizzle-orm/pg-core"

export const productUsefulness = pgTable("productUsefulness", {
  id: serial().primaryKey(),
  userId: integer().notNull(),
  productId: integer().notNull(),
  usefulness: boolean()
})

type ProductUsefulness = typeof productUsefulness.$inferSelect
