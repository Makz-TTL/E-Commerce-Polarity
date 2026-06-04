import { ZodFastifyInstance } from "../../types/index"
import ProfileSection from "../components/ProfileSection"
import { db } from "../../db"
import { eq } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"
import { users } from "../../db/schema"
import LoginForm from "../components/LoginForm"

const COOKIE_NAME = 'sessionId';

const generateCookie = (key: string, value: string, age: number) => {
  return `${key}=${value}; Max-Age=${age}; Path=/; HttpOnly; SameSite=Strict`;
}

const extractCookie = (cookieHeader: string, key: string): string | null => {
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [cookieKey, cookieValue] = cookie.trim().split('=')
    if (cookieKey === key) {
      return cookieValue
    }
  }
  return null
}

const userLoggato = async (cookieHeader: string | undefined): Promise<number | null> => {
  if (!cookieHeader) return null;
  const sessionToken = extractCookie(cookieHeader, COOKIE_NAME);
  if (!sessionToken) return null;

  const rows = await db.select().from(users).where(eq(users.cookie, sessionToken)).limit(1);
  return rows[0] ? rows[0].id : null;
};


// SCHEMAS
const loginSchema = {
  body: z.object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
}

// AGGIUNGI L'ESPORTAZIONE QUI:
export default (server: ZodFastifyInstance) => {

  // Rotta di LOGIN (agganciata al server passato da index.tsx)
  server.post("/login", { schema: loginSchema }, async (req, res) => {
    const body = req.body
    const username = body.username.trim()
    const password = body.password

    if (username === '') {
      return res.code(400).html(
        <LoginForm 
          values={{ username, password }} 
          error={{ username: "Il nome utente è obbligatorio" }} 
        />
      )
    }

    try {
      const rows = await db.select().from(users).where(eq(users.userName, username)).limit(1)
      const dbUser = rows[0]

      if (!dbUser || !(await argon2.verify(dbUser.password, password))) {
        return res.code(400).html(
          <LoginForm 
            values={{ username, password }} 
            error={{ password: "Username o password errati" }} 
          />
        )
      }

      const cookieValue = Math.random().toString(36).substring(2)
      const cookieHeader = generateCookie(COOKIE_NAME, cookieValue, 60 * 60 * 24 * 7)
      res.header('Set-Cookie', cookieHeader)

      await db.update(users).set({ cookie: cookieValue }).where(eq(users.id, dbUser.id))

      req.session.username = username

      return res
        .headers({
          "HX-Reswap": "outerHTML",
          "HX-Retarget": "#profile-section",
          "HX-Trigger": JSON.stringify({ showSuccessToast: { message: "Ti sei loggato con successo" } }),
        })
        .html(<ProfileSection session={req.session} />)

    } catch (error) {
      return res.code(500).html(
        <LoginForm 
          values={{ username, password }} 
          error={{ password: "Si è verificato un errore interno. Riprova più tardi." }} 
        />
      )
    }
  })

  // Rotta di LOGOUT (dentro l'esportazione)
  server.post("/logout", async (req, reply) => {
    await req.session.destroy()
    return reply.html(<ProfileSection session={req.session} />)
  })

} // CHIUSURA DELL'ESPORTAZIONE

