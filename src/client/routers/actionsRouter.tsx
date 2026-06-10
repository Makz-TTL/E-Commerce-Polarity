import { ZodFastifyInstance } from "../../types/index"
import ProfileSection from "../components/ProfileSection"
import { db } from "../../db"
import { eq, and } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"
import fs from "fs"

import { orders, users, products, cart } from "../../db/schema"
import LoginForm from "../components/LoginForm"
import Marketplace from "../components/marketplace"   
import OtpForm from "../components/OtpForm"

import SignUpForm from "../components/SignUpForm"
import { sendTemplateEmail } from "../../emails/index"
import path from "path"
import { pipeline } from "stream/promises"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default (server: ZodFastifyInstance) => {

  const loginSchema = z.object({
    username: z.string().trim().min(1, "Il nome utente è obbligatorio"),
    password: z.string().trim().min(1, "La password è obbligatoria"),
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
    nome: z.string().trim().min(1, "Il nome è obbligatorio"),
    cognome: z.string().trim().min(1, "Il cognome è obbligatorio"),
    username: z.string().trim().min(4, "Username deve essere di almeno 4 caratteri"),
    email: z.string().trim().email("Email non valida"),
    password: z.string().trim().min(8, "La password deve essere lunga almeno 8 caratteri"),
  })

  //Sign Up back-end.
  server.post("/signUp", async (req, res) => {
    console.log("signup")
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
    const cartID = parseInt(id, 10)

    if (isNaN(cartID)) {
      return res.status(400).send("ID non valido")
    }

    if (!req.session.username) {
      return res.status(401).send("Devi essere loggato")
    }

    try {
      // 1. Elimina l'elemento dal carrello e ritorna i dati eliminati
      const deletedOrder = await db.delete(cart)
        .where(eq(cart.id, cartID))
        .returning();

    } catch (error) {
      console.error("Errore durante l'eliminazione dal carrello:", error);
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

      // --- CONTROLLO DI SICUREZZA BLOCCANTE ---
      // Impedisce la richiesta diretta HTMX se l'utente tenta di comprare un proprio articolo
      if (product.userId === user.id) {
        return res
          .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Non puoi aggiungere al carrello un tuo prodotto!" } }))
          .send()
      }

      if (product.stock < quantity) {
        return res
          .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: `Stock insufficiente! Disponibili solo: ${product.stock}` } }))
          .send()
      }

      const totalPrice = product.price * quantity

      await db.insert(cart).values({
        userId: user.id,             
        productId: productId, 
        quantity: quantity,
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
  })

  //Edit profile back-end.
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
      
      const rows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
      const email = rows[0]?.eMail || ""

      return res.status(200).html(
        <SignUpForm isEdit={true} values={{ ...(req.body as any), email }} errors={errors} />
      )
    }

    const { nome, cognome, username } = result.data

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
              values={{ ...(req.body as any), email: currentUser.eMail }} 
              errors={{ username: "Username già in uso da un altro utente" }} 
            />
          )
        }
      }
      await db.update(users)
        .set({
          name: nome,
          lastName: cognome,
          userName: username
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
          values={{ ...(req.body as any), email: users?.eMail }} 
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
    const { cardNumber, expiry } = req.body as PaymentBody;

    const [month, year] = expiry.split("/");
    const expiryMonth = parseInt(month);
    const expiryYear = parseInt("20" + year);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const isValidExpiryDate =
      expiryMonth >= 1 && expiryMonth <= 12 &&
      (expiryYear > currentYear || (expiryYear === currentYear && expiryMonth >= currentMonth));

    if (cardNumber == "1234 5678 1234 5678" || !isValidExpiryDate) {
      return res.header("HX-Redirect", "/payment/declined").send();
    } else {

      const user = await db.query.users.findFirst({
        where: { userName: req.session.username }
      });

      if (user) {
        // 1. Prendi gli elementi dal CARRELLO, non dagli ordini
        const cartItems = await db.query.cart.findMany({
          where: { userId: user.id },
          with: { cartItem: true } // Assicurati che la relazione sia attiva nel carrello
        });

        // Se il carrello è vuoto, evita di procedere
        if (cartItems.length === 0) {
          return res.header("HX-Redirect", "/cart").send();
        }

        let totalAmount = 0;

        // Usiamo un ciclo for...of per gestire le operazioni asincrone in sequenza
        for (const item of cartItems) {
          if (item.cartItem) {
            // 2. Calcola il prezzo totale per questo specifico elemento
            const itemTotal = (item.cartItem.price || 0) * item.quantity;
            totalAmount += itemTotal;

            // 3. Inserisci il record definitivo nella tabella ORDERS
            await db.insert(orders).values({
              userId: user.id,
              productId: item.productId,
              quantity: item.quantity,
              totalPrice: itemTotal // Qui inseriamo il doublePrecision richiesto dal tuo db
            });

            // 4. Scala lo stock dal prodotto
            await db.update(products)
              .set({ stock: item.cartItem.stock - item.quantity })
              .where(eq(products.id, item.productId));
          }
        }

        // Formatta il totale complessivo per l'email
        const totalFormatted = totalAmount.toFixed(2);
        // const totalCart = totalFormatted.toLocaleString()

        // 5. SVUOTA IL CARRELLO (e non gli ordini!)
        await db.delete(cart).where(eq(cart.userId, user.id));

        // 6. Invia l'email con il totale corretto
        await sendTemplateEmail({
          to: user.eMail,
          subject: "Conferma del tuo ordine TechStore",
          template: "OrderConfirmEmail",
          payload: {
            name: user.name,
            totalPrice: totalFormatted
          }
        });
      }

      return res.header("HX-Redirect", "/payment/accepted").send();
    }
  });

server.post("/sell-product", async (req, res) => {
  if (!req.session.username) {
    return res.status(401).send("Non autorizzato")
  }

  const uploadDir = path.join(process.cwd(), "public", "images")
  
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
  } catch (dirError: any) {
    console.error("Errore creazione cartella 'images':", dirError.message)
  }

  try {
    const parts = req.parts()
    let productName = ""
    let price = 0
    let stock = 0
    let category = ""
    let description = ""
    
    const imageUrls: string[] = []
    let coverIndex = 0 

    const userRows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
    const user = userRows[0]

    if (!user) {
      return res.status(404).send("Utente non trovato")
    }

    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "images" && part.filename) {
        const ext = path.extname(part.filename).toLowerCase()
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
        
        if (!allowedExtensions.includes(ext)) {
          part.file.resume() 
          continue
        }

        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
        const uploadPath = path.join(uploadDir, uniqueFilename)
        
        await pipeline(part.file, fs.createWriteStream(uploadPath))
        imageUrls.push(`/images/${uniqueFilename}`)

      } else if (part.type === "field") {
        if (part.fieldname === "productName") productName = part.value as string
        if (part.fieldname === "price") price = parseFloat(part.value as string) || 0
        if (part.fieldname === "stock") stock = parseInt(part.value as string, 10) || 0
        if (part.fieldname === "category") category = part.value as string
        if (part.fieldname === "description") description = part.value as string
     
        if (part.fieldname === "coverIndex") {
          coverIndex = parseInt(part.value as string, 10) || 0
        }
      }
    }

    if (!productName || price <= 0 || stock < 1) {
       return res
         .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Errore: Campi non compilati correttamente." } }))
         .send()
    }

    if (imageUrls.length > 0 && coverIndex >= 0 && coverIndex < imageUrls.length) {
      const coverImage = imageUrls.splice(coverIndex, 1)[0]
      imageUrls.unshift(coverImage)
    }

    await db.insert(products).values({
      productName,
      price, 
      stock,
      category,
      description,
      imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined, 
      userId: user.id
    })

    return res
      .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Prodotto inserito nel marketplace!" } }))
      .header("HX-Redirect", `/profile?username=${user.userName}`)
      .send()

  } catch (error: any) {
    console.error("ERRORE INTERNO:", error)
    return res
      .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Errore interno durante il salvataggio." } }))
      .send()
  }
})


server.delete("/product/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)
    const sessionUsername = req.session?.username

    const currentUrl = req.headers["hx-current-url"] as string || ""

    if (isNaN(productId)) {
      return res.status(400).send("ID Prodotto non valido")
    }

    if (!sessionUsername) {
      return res.status(401).send("Devi effettuare il login per completare questa azione")
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.userName, sessionUsername)) 
        .limit(1)

      if (!user) {
        return res.status(404).send("Utente non trovato")
      }

     
      await db
        .delete(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.userId, user.id)
          )
        )

      
      if (currentUrl.includes(`/product/${productId}`)) {
        res.header("HX-Redirect", "/")
        return res.status(200).send()
      }

      
      return res.status(200).send()

    } catch (error) {
      console.error("Errore durante l'eliminazione:", error)
      return res.status(500).send("Impossibile eliminare il prodotto")
    }
  })
}