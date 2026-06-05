import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql", 
  schema: "./src/db/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: "postgres://username:password@localhost:5432/nomedatabase", 
  },
})
