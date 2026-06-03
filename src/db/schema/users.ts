import { pgTable, serial, integer, boolean, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial().primaryKey(),
    name: text().notNull(),
    lastName: text().notNull(),
    eMail: text().notNull().unique(),
    userName: text().notNull().unique(),
    password: text().notNull(),
    cookieStore: text().notNull(),
});

type User = typeof users.$inferSelect;

