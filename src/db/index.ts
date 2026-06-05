import { drizzle } from "drizzle-orm/postgres-js"
import env from "../utils/env"
import * as schema from "./schema"

import Postgres from 'postgres'

const postgres = Postgres({
    host: "localhost",
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    port: 5432
})

export const db = drizzle({
    client: postgres,
    schema
})
