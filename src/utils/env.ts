import dotenv from "dotenv"
dotenv.config()

const {
  SESSION_SECRET,
  PORT = "3000",
  COMMON_PASSWORD = "polarity",
} = process.env

if (!SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET env variable")
}

const env = {
  SESSION_SECRET,
  PORT,
  COMMON_PASSWORD,
}

export default env
