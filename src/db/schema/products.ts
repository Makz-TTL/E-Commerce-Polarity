import {pgTable, serial, integer, boolean, text} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
    id: serial().primaryKey(),
    userId: integer().notNull(),
    productName: text().notNull(),
    description: text(),
    price: integer().notNull(),
    stock: integer().notNull(),
    category: text().notNull(),
});

type Product = typeof products.$inferSelect;
