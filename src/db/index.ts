import { drizzle } from "drizzle-orm/better-sqlite3"
<<<<<<< HEAD
import  { relations } from "./schema/relations"
import { schema } from "./schema/schema"
=======
import * as schema from "./schema"
import { relations } from "./schema/relations"
>>>>>>> d37486b21fa3886e7d5695f151766afc98d6c4c2
import path from "node:path"

const dbPath = path.join(process.cwd(), "sqlite.db")

export const db = drizzle(dbPath, { schema, relations })
