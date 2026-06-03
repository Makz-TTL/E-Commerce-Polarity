import {pgTable, serial, integer, boolean, text} from "drizzle-orm/pg-core";

export const reviews = pgTable("reviews", {
    id: serial().primaryKey(),
    userId: integer().notNull(),
    productId: integer().notNull(),
    rating: integer().notNull(),
    title: text(),
    comment: text(),
});

type Review = typeof reviews.$inferSelect;