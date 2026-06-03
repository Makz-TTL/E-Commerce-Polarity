import {pgTable, serial, integer, boolean} from "drizzle-orm/pg-core";

export const productUsefulness = pgTable("productUsefulness", {
    id: serial("id").primaryKey(),
    userId: integer("userId").notNull(),
    productId: integer("productId").notNull(),
    usefulness: boolean("usefulness").notNull(),
});

type ProductUsefulness = typeof productUsefulness.$inferSelect;
