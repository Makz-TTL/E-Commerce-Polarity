import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"
import { relations } from "./schema/relations"
import path from "node:path"

const dbPath = path.join(process.cwd(), "sqlite.db")

export const db = drizzle(dbPath, { schema, relations })
