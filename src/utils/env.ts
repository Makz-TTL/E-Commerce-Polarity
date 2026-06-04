import dotenv from "dotenv"
dotenv.config()

const {
  SESSION_SECRET,
  PORT = "3000",
  COMMON_PASSWORD = "polarity",
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
} = process.env

if (!SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET env variable")
}

if (!POSTGRES_USER) {
  throw new Error("Missing POSTGRES_USER env variable")
}

if (!POSTGRES_PASSWORD) {
  throw new Error("Missing POSTGRES_PASSWORD env variable")
}

if (!POSTGRES_DB) {
  throw new Error("Missing POSTGRES_DB env variable")
}

const env = {
  SESSION_SECRET,
  PORT,
  COMMON_PASSWORD,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB
}

export default env
