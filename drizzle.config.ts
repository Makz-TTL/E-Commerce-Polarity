import { defineConfig } from "drizzle-kit"
import env from "./src/utils/env"

export default defineConfig({
  dialect: "postgresql", 
  schema: "./src/db/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    database: env.POSTGRES_DB,
    host: "127.0.0.1",
    port: 5432,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD, 
    ssl: false
  },
})
