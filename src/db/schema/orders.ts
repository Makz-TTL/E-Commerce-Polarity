import {pgTable, serial, integer, boolean} from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
    id: serial().primaryKey(),
    userId: integer().notNull(),
    productId: integer().notNull(),
    quantity: integer().notNull(),
    totalPrice: integer().notNull(),
    
});

type Order = typeof orders.$inferSelect;
