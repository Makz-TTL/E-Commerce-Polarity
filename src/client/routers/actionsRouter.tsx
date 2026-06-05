import { ZodFastifyInstance } from "../../types/index"
import ProfileSection from "../components/ProfileSection"
import { db } from "../../db"
import { eq } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"

import { users } from "../../db/schema"
import LoginForm from "../components/LoginForm"
import Marketplace from "../components/marketplace"   
import OtpForm from "../components/OtpForm"

import SignUpForm from "../components/SignUpForm"
import { sendTemplateEmail } from "../../emails/index"


// Email Service Import



// AGGIUNGI L'ESPORTAZIONE QUI:
export default (server: ZodFastifyInstance) => {


  //login

  const loginSchema = z.object({
  username: z.string().trim().min(1, "Il nome utente è obbligatorio"),
  password: z.string().min(1, "La password è obbligatoria"),
})

server.post("/login", async (req, res) => {
  
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return res.status(200).html(
      <LoginForm
        values={req.body as any}
        error={{
          username: fieldErrors.username?.[0],
          password: fieldErrors.password?.[0],
        }}
      />
    )
  }

  const { username, password } = result.data

  try {
    
    const rows = await db.select().from(users).where(eq(users.userName, username)).limit(1)
    const dbUser = rows[0]

   
    if (!dbUser || !(await argon2.verify(dbUser.password, password))) {
      return res.status(200).html(
        <LoginForm
          values={{ username, password }}
          error={{ password: "Username o password errati" }}
        />
      )
    }

   
    req.session.username = username

    
    return res
  .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Ti sei loggato con successo" } }))
  .header("HX-Redirect", "/")
  .send()

  } catch (error) {
    server.log.error(error)
    return res.status(200).html(
      <LoginForm
        values={{ username, password }}
        error={{ password: "Si è verificato un errore interno. Riprova più tardi." }}
      />
    )
  }
  
})

//signUp with mail import { sendTemplateEmail } from "./emailService"

const signUpSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  cognome: z.string().min(1, "Il cognome è obbligatorio"),
  username: z.string().min(4, "Username deve essere di almeno 4 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve essere lunga almeno 8 caratteri"),
})



  // STEP 1: Process initial structural registration, dispatch code
  server.post("/signUp", async (req, res) => {
    const result = signUpSchema.safeParse(req.body)

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      const errors = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])
      )
      return res.status(200).html(<SignUpForm values={req.body as any} errors={errors} />)
    }

    const { nome, cognome, username, email, password } = result.data

    try {
      const existingUser = await db.select().from(users).where(eq(users.userName, username)).limit(1)
      if (existingUser.length > 0) {
        return res.status(200).html(
          <SignUpForm values={req.body as any} errors={{ username: "Username già in uso" }} />
        )
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      req.session.tempUserData = {
        name: nome,
        lastName: cognome,
        userName: username,
        eMail: email,
        passwordHash: await argon2.hash(password),
        code: verificationCode
      }

      await sendTemplateEmail({
        to: email,
        subject: "Verifica il tuo account TechStore",
        template: "WelcomeEmail",
        payload: { name: `${nome}! Il tuo codice di verifica è: ${verificationCode}` }
      })

      // Simply swap in the clean OTP form component!
      return res.status(200).html(<OtpForm email={email} />)

    } catch (error) {
      server.log.error(error)
      return res.status(200).html(
        <SignUpForm values={req.body as any} errors={{ email: "Si è verificato un errore interno." }} />
      )
    }
  })

  // STEP 2: Validate incoming OTP input sequences
  server.post("/verify-otp", async (req, res) => {
    const { otp } = req.body as { otp: string }
    const tempUser = req.session.tempUserData

    if (!tempUser) {
      return res.status(200).html(
        <p class="text-red-500 text-sm font-semibold p-4 text-center">
          Sessione scaduta. Per favore, ricarica la pagina e riprova.
        </p>
      )
    }

    if (otp !== tempUser.code) {
      // Re-render the OtpForm component passing down the precise error message
      return res.status(200).html(<OtpForm email={tempUser.eMail} error="Codice non valido o scaduto." />)
    }

    try {
      const cookieValue = Math.random().toString(36).substring(2)

      await db.insert(users).values({
        name: tempUser.name,
        lastName: tempUser.lastName,
        userName: tempUser.userName,
        eMail: tempUser.eMail,
        password: tempUser.passwordHash,
        cookie: cookieValue
      })

      delete req.session.tempUserData
      res.header("Set-Cookie", `sessionId=${cookieValue}; Max-Age=${60 * 60 * 24 * 7}; Path=/; HttpOnly; SameSite=Strict`)
      req.session.username = tempUser.userName

      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Registrazione completata!" } }))
        .header("HX-Redirect", "/")
        .send()

    } catch (error) {
      server.log.error(error)
      return res.status(200).html(<OtpForm email={tempUser.eMail} error="Errore di sistema salvando l'utente." />)
    }
  })




 server.post("/logout", async (req, reply) => {

  await req.session.destroy()

  
  const logoutToastTrigger = { 
    showSuccessToast: { message: "Disconnesso con successo" } 
  }

  
  return reply
    .header("Set-Cookie", "sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict")
    .header("HX-Trigger", JSON.stringify(logoutToastTrigger))
    .header("HX-Redirect", "/")
    .send()
})

}
 // CHIUSURA DELL'ESPORTAZIONE

