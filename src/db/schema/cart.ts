import {pgTable, integer, serial} from "drizzle-orm/pg-core"
import { products } from "./products"

export const cart = pgTable("cart", {
    id: serial().primaryKey(),
    userId: integer().notNull(),
    productId: integer().notNull().references(() => products.id, {onDelete: "cascade"}),
    quantity: integer().notNull(),
})

type CartItem = typeof cart.$inferSelect