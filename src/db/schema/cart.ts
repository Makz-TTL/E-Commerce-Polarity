import {pgTable, integer, serial} from "drizzle-orm/pg-core"
import { text } from "stream/consumers"

export const cart = pgTable("cart", {
    id: serial().primaryKey(),
    userId: integer().notNull(),
    productId: integer().notNull(),
    quantity: integer().notNull(),
})

type CartItem = typeof cart.$inferSelect