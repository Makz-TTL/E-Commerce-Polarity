import { drizzle } from "drizzle-orm/better-sqlite3"
import  { relations } from "./schema/relations"
import { schema } from "./schema/schema"
import path from "node:path"

const dbPath = path.join(process.cwd(), "sqlite.db")

export const db = drizzle(dbPath, { schema, relations })
