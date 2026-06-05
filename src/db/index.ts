import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

import relations from "./schema/relations"

import path from "node:path"
import Postgres from 'postgres'

const postgres = Postgres({
    "host": "",
    user: "",
    password: "",
    database: "",
    port: 0
})


export const db = drizzle({
    client: postgres,
    schema,
    relations,
})
