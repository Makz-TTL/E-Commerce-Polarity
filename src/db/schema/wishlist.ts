import { pgTable, integer, serial } from "drizzle-orm/pg-core"

export const wishlist = pgTable("wishlist", {
  id: serial().primaryKey(),
  userId: integer().notNull(),
  productId: integer().notNull(),

})

type WishlistItem = typeof wishlist.$inferSelect
