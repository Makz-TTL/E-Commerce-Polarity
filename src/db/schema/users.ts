import { pgTable, integer, text, serial, boolean, numeric } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial().primaryKey(),
  name: text().notNull(),
  lastName: text().notNull(),
  eMail: text().notNull().unique(),
  userName: text().notNull().unique(),
  password: text().notNull(),
  resetToken: text(),
  resetTokenExpiry: text(),
  session: text(),
  isVerified: boolean().notNull().default(false),
  verificationCode: text(),
  hasUnseenModeration: boolean().notNull().default(false),
  isAdmin: boolean().notNull().default(false),
  isBanned: boolean().notNull().default(false)
})


export type User = typeof users.$inferSelect