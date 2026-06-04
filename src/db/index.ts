import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"
import relations from "./schema/relations"
import path from "node:path"

const dbPath = "file:" + path.join(process.cwd(), "local.db")
const client = createClient({ url: dbPath })

export const db = drizzle({ client, schema, relations })