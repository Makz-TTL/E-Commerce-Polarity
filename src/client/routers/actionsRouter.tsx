import { ZodFastifyInstance } from "../../types/index"
import ProfileSection from "../components/ProfileSection"
import { db } from "../../db"
import { eq } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"

import { orders, users, products } from "../../db/schema"
import LoginForm from "../components/LoginForm"
import Marketplace from "../components/marketplace"   
import OtpForm from "../components/OtpForm"

import SignUpForm from "../components/SignUpForm"
import { sendTemplateEmail } from "../../emails/index"




export default (server: ZodFastifyInstance) => {

  const loginSchema = z.object({
    username: z.string().trim().min(1, "Il nome utente è obbligatorio"),
    password: z.string().min(1, "La password è obbligatoria"),
  })




  //Log In back-end.
  server.post("/login", async (req, res) => {
    const { redirect } = req.query as { redirect?: string }
    const redirectTo = redirect || "/"
    
    const result = loginSchema.safeParse(req.body)

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      
      return res.status(200).html(
        <LoginForm
          redirectTo={redirectTo}
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
            redirectTo={redirectTo}
            values={{ username, password }}
            error={{ password: "Username o password errati" }}
          />
        )
      }

      req.session.username = username

      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Ti sei loggato con successo" } }))
        .header("HX-Redirect", redirectTo) 
        .send()

    } catch (error) {
      server.log.error(error)
      return res.status(200).html(
        <LoginForm
          redirectTo={redirectTo}
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





  //Sign Up back-end.
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





  //Log Out back-end.
  server.post("/logout", async (req, reply) => {
    await req.session.destroy()
    return reply
      .header("Set-Cookie", "sessionId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict")
      .header("HX-Redirect", "/")
      .send()
  })





  //Delete form card back-end.
  server.post("/deleteFromCart/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const orderId = parseInt(id, 10)

    if (isNaN(orderId)) {
      return res.status(400).send("ID non valido")
    }

    if (!req.session.username) {
      return res.status(401).send("Devi essere loggato")
    }

    try {
      const deletedOrder = await db.delete(orders)
        .where(eq(orders.id, orderId))
        .returning()

      const order = deletedOrder[0]

      if (order) {
        const product = await db.query.products.findFirst({
          where: { id: order.productId }
        })

        if (product) {
          await db.update(products)
            .set({ stock: product.stock + order.quantity })
            .where(eq(products.id, order.productId))
        }
      }

      return res.send("")
    } catch (error) {
      console.error("ERRORE ELIMINAZIONE:", error)
      return res.status(500).send("Errore durante l'eliminazione")
    }
  })





  //Add to cart back-end.
  server.get("/addToCart/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)

    const { quantity: qtyParam } = req.query as { quantity?: string }
    const quantity = parseInt(qtyParam || "1", 10)

    if (isNaN(productId)) {
      return res.status(400).send("ID Prodotto non valido")
    }

    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).send("Quantità non valida")
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
      const productRows = await db.select().from(products).where(eq(products.id, productId)).limit(1)
      const product = productRows[0]

      if (!product) {
        return res.status(404).send("Prodotto non trovato")
      }

      if (product.stock < quantity) {
        return res
          .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: `Stock insufficiente! Disponibili solo: ${product.stock}` } }))
          .send()
      }

      const totalPrice = product.price * quantity
      const newStock = product.stock - quantity

      await db.update(products)
        .set({ stock: newStock })
        .where(eq(products.id, productId))

      await db.insert(orders).values({
        userId: user.id,             
        productId: productId, 
        quantity: quantity,     
        totalPrice: totalPrice  
      })  

      const triggerEvents = {
        showSuccessToast: { message: `${quantity}x ${product.productName} aggiunto al carrello!` }
      }

      return res
        .header("HX-Trigger", JSON.stringify(triggerEvents))
        .send() 

    } catch (error) {
      console.error("ERRORE DB AGGIUNTA CARRELLO/UPDATE STOCK:", error)
      return res.status(500).send("Errore durante l'aggiunta al carrello")
    }
  })

  const editProfileSchema = z.object({
    nome: z.string().min(1, "Il nome è obbligatorio"),
    cognome: z.string().min(1, "Il cognome è obbligatorio"),
    username: z.string().min(4, "Username deve essere di almeno 4 caratteri"),
    email: z.string().email("Email non valida"),
  })





  //Edi profile back-end.
  server.post("/editProfile", async (req, res) => {
    if (!req.session.username) {
      return res.status(401).send("Non autorizzato")
    }

    const result = editProfileSchema.safeParse(req.body)

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      const errors = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]])
      )
      return res.status(200).html(
        <SignUpForm isEdit={true} values={req.body as any} errors={errors} />
      )
    }

    const { nome, cognome, username, email } = result.data

    try {
      const rows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
      const currentUser = rows[0]

      if (!currentUser) {
        return res.status(404).send("Utente non trovato")
      }

      if (username !== req.session.username) {
        const existingUser = await db.select().from(users).where(eq(users.userName, username)).limit(1)
        if (existingUser.length > 0) {
          return res.status(200).html(
            <SignUpForm 
              isEdit={true} 
              values={req.body as any} 
              errors={{ username: "Username già in uso da un altro utente" }} 
            />
          )
        }
      }

      await db.update(users)
        .set({
          name: nome,
          lastName: cognome,
          userName: username,
          eMail: email
        })
        .where(eq(users.id, currentUser.id))

      req.session.username = username
      
      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Profilo aggiornato con successo!" } }))
        .header("HX-Redirect", `/profile?username=${username}`) 
        .send()

    } catch (error) {
      server.log.error(error)
      return res.status(200).html(
        <SignUpForm 
          isEdit={true} 
          values={req.body as any} 
          errors={{ email: "Si è verificato un errore interno durante il salvataggio." }} 
        />
      )
    }
  })





  type PaymentBody = {
  
      cardNumber : string
      expiry : string
  
  }
  
  server.post("/payment/confirm", async (req, res) => {
  
      const { cardNumber, expiry} = req.body as PaymentBody;
  
      //Check sicurezza

      const [month, year] = expiry.split("/");
      const expiryMonth = parseInt(month);
      const expiryYear = parseInt("20"+year);

      const now = new Date();
      const currentMonth = now.getMonth()+1;
      const currentYear = now.getFullYear();

      const isValidExpiryDate = 
        expiryMonth >= 1 && expiryMonth <= 12 &&
        (expiryYear > currentYear || (expiryYear === currentYear && expiryMonth >= currentMonth));



      //Final check
      
      if(cardNumber == "1234 5678 1234 5678" || !isValidExpiryDate){
        return res.header("HX-Redirect", "/payment/declined").send();
      }
  
      else{
        return res.header("HX-Redirect", "/payment/accepted").send();
      }
  
  })
}