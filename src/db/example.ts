/**
 * Esempio d'uso di Drizzle ORM con SQLite e relazioni.
 * Esegui con: npx tsx src/db/example.ts
 */
import { db } from "./index"
import { usersTable } from "./schema"

const main2 = async () => {
  const newUser = {
    email: "rossia@gmail.com",
    name: "Mario",
    lastName: "Rossi",
    userName: "marietasdto",
  }

  // const existingUser = await db
  //   .select()
  //   .from(usersTable)
  //   .where(
  //     or(
  //       eq(usersTable.email, newUser.email),
  //       eq(usersTable.userName, newUser.userName)
  //     )
  //   )

  const existingUser = await db.query.usersTable.findMany({
    where: {
      OR: [
        {
          email: newUser.email,
        },
        {
          userName: newUser.userName,
        },
      ],
    },
  })

  console.log(existingUser)
  if (!existingUser) {
    //creo un utente
    await db.insert(usersTable).values(newUser)
  } else {
    console.log("UTENTE GIÀ CREATO")
  }
}

main2()
