import { defineConfig } from "drizzle-kit"
import env from "./src/utils/env"

export default defineConfig({
  dialect: "postgresql", 
  schema: "./src/db/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    database: env.POSTGRES_DB,
    host: "localhost",
    port: 5432,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD, 
    ssl: false
  },
})
