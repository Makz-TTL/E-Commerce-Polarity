/**
 * Esempio d'uso di Drizzle ORM con SQLite e relazioni.
 * Esegui con: npx tsx src/db/example.ts
 */
import { db } from "./index"
import { users } from "./schema"

const main2 = async () => {
  const newUser = {
    eMail: "rossia@gmail.com",
    name: "Mario",
    lastName: "Rossi",
    userName: "marietasdto",
    password: "placeholder",
    cookieStore: "",
  }

  const existingUser = await db.query.users.findMany({
    where: {
      OR: [
        {
          eMail: newUser.eMail,
        },
        {
          userName: newUser.userName,
        },
      ],
    },
  })

  console.log(existingUser)
  if (existingUser.length === 0) {
    await db.insert(users).values(newUser)
  } else {
    console.log("UTENTE GIÀ CREATO")
  }
}

main2()
