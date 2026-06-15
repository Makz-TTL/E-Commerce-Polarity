import { pgTable, integer, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core"

export const sessions=pgTable("sessions",{

    sid:text().primaryKey(),
    sess:jsonb().notNull(),
    expire:timestamp({withTimezone:true}).notNull()

})