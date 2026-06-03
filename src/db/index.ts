import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import { relations } from "./schema"
import path from "node:path"

const dbPath = path.join(process.cwd(), "sqlite.db")

export const db = drizzle(dbPath, { schema, relations })
