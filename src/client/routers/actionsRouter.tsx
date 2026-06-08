import { ZodFastifyInstance } from "../../types/index"
import ProfileSection from "../components/ProfileSection"
import { db } from "../../db"
import { eq } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"

import { orders, users } from "../../db/schema"
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



const signUpSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  cognome: z.string().min(1, "Il cognome è obbligatorio"),
  username: z.string().min(4, "Username deve essere di almeno 4 caratteri"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve essere lunga almeno 8 caratteri"),
})




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
        payload: { 
          name: nome,             
          code: verificationCode  
        }
      })

   
      return res.status(200).html(<OtpForm email={email} />)

    } catch (error) {
      server.log.error(error)
      return res.status(200).html(
        <SignUpForm values={req.body as any} errors={{ email: "Si è verificato un errore interno." }} />
      )
    }
  })

  
  




 server.post("/logout", async (req, reply) => {

  await req.session.destroy()

  
 

  
  return reply
   .header("Set-Cookie", "sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict")
    .header("HX-Redirect", "/")
    .send()
})



server.get("/addToCart/:id", async (req, res) => {
 
  const { id } = req.params as { id: string }
  const productId = parseInt(id, 10)

  if (isNaN(productId)) {
    return res.status(400).send("ID Prodotto non valido")
  }

  if (!req.session.username) {
    return res
    .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Devi essere loggato per aggiungere prodotti al carrello" } }))
    .send() 
   
  }

  const userRows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
  const user = userRows[0]

  if (!user) {
    return res.status(401).html(
      <LoginForm
        values={{ username: "", password: "" }}
        error={{ password: "Utente non trovato. Riprova." }}
      />
    )
  }

 try {
  
  console.log("Tentativo di inserimento ordine:", { userId: user.id, productId });

  await db.insert(orders).values({
    userId: user.id,             
    productId: Number(productId), 
    quantity: 1,
    totalPrice: 0 //valore placeholder, da calcolare in base al prodotto reale
  })  
  
  return res
    .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Prodotto aggiunto al carrello" } }))
    .send() 

} catch (error) {
  
  console.error("ERRORE DB INSERIMENTO:", error)
  return res.status(500).send("Errore durante l'aggiunta al carrello")
}
})
 // CHIUSURA DELL'ESPORTAZIONE
}
