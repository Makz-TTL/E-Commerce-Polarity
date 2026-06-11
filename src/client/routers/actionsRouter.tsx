import { ZodFastifyInstance } from "../../types/index"
import ProfileSection from "../components/ProfileSection"
import { db } from "../../db"
import { eq, and } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"
import fs from "fs"
import OpenAI from "openai"

import { orders, users, products, cart } from "../../db/schema"
import LoginForm from "../components/LoginForm"
import Marketplace from "../components/marketplace"   
import OtpForm from "../components/OtpForm"

import SignUpForm from "../components/SignUpForm"
import { sendTemplateEmail } from "../../emails/index"
import path from "path"
import { pipeline } from "stream/promises"
import { fileURLToPath } from "url"
import Cart from "../components/cart"
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "eu-central-1",
})

export default (server: ZodFastifyInstance) => {

  const loginSchema = z.object({
    username: z.string().trim().min(1, "Il nome utente è obbligatorio"),
    password: z.string().trim().min(1, "La password è obbligatoria"),
  })

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
      return res.status(500).send("Errore durante l'eliminazione")
    }
  })

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

      // 1. CONTROLLO SE IL PRODOTTO È GIÀ NEL CARRELLO DELL'UTENTE
      const existingCartRows = await db
        .select()
        .from(cart)
        .where(
          and(
            eq(cart.userId, user.id),
            eq(cart.productId, productId)
          )
        )
        .limit(1)
      
      const existingCartItem = existingCartRows[0]

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + quantity

        // 2. Controllo di sicurezza aggiuntivo: il totale nel carrello supera lo stock?
        if (product.stock < newQuantity) {
          return res
            .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: `Hai già questo articolo nel carrello. Non puoi superare lo stock massimo di ${product.stock}!` } }))
            .send()
        }

        // 3. AGGIORNAMENTO: Incrementa la quantità della riga esistente
        await db
          .update(cart)
          .set({ quantity: newQuantity })
          .where(eq(cart.id, existingCartItem.id))

      } else {
        // 4. INSERIMENTO: Il prodotto non c'era, crea una nuova riga
        await db.insert(cart).values({
          userId: user.id,             
          productId: productId, 
          quantity: quantity,
        })  
      }

      await db.insert(cart).values({
        userId: user.id,             
        productId: productId, 
        quantity: quantity,
      })  
      
      const triggerEvents = {
        showAddedToCartToast: { message: `${quantity}x ${product.productName} aggiunto al carrello!` }
      }

      return res
        .header("HX-Trigger", JSON.stringify(triggerEvents))
        .send() 

    } catch (error) {
      return res.status(500).send("Errore durante l'aggiunta al carrello")
    }
  })

  const editProfileSchema = z.object({
    nome: z.string().min(1, "Il nome è obbligatorio"),
    cognome: z.string().min(1, "Il cognome è obbligatorio"),
    username: z.string().min(4, "Username deve essere di almeno 4 caratteri"),
  })

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
    cardNumber: string
    expiry: string
  }
  

  server.post("/updateCartQuantity/:cartId", async (req, res) => {
    const { cartId } = req.params as { cartId: string }
    const { quantity } = req.body as { quantity: string }
    
    const newQty = parseInt(quantity, 10)
    if (isNaN(newQty) || newQty < 1) return res.status(400).send("Quantità non valida")

    try {
        // 1. Aggiorna la quantità nel DB
        await db.update(cart)
          .set({ quantity: newQty })
          .where(eq(cart.id, parseInt(cartId, 10)))

        // 2. Prendi la sessione corrente
        const session = req.session

        // 3. Renderizza di nuovo l'intera View del carrello passandogli la sessione.
        // HTMX riceverà questo HTML e sostituirà il vecchio body con questo aggiornato.
        return res.status(200).html(<Cart session={session} />)

    } catch (error) {
        console.error("Errore durante l'aggiornamento della quantità:", error)
        return res.status(500).send("Errore interno del server")
    }
  })



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


type checkOutBody = {
      fullName : string
      city : string
      cap : string
      address : string
  }

server.get("/checkout/validate", async (req, res) => {
  const { fullName, city, cap, address } = req.query as checkOutBody

  const errors: Record<string, string> = {}
  if (!fullName?.trim()) errors.fullName = "Nome obbligatorio"
  if (!address?.trim()) errors.address = "Indirizzo obbligatorio"
  if (!city?.trim()) errors.city = "Città obbligatoria"
  if (!cap?.trim()) errors.cap = "CAP obbligatorio"

  if (Object.keys(errors).length > 0) {
    return res.html(
      Object.entries(errors).map(([field, msg]) => `
        <style hx-swap-oob="beforeend:head">
          [name='${field}'] { border-color: rgb(239 68 68) !important; }
        </style>
        <div hx-swap-oob="innerHTML:#error-${field}">
          <p class="text-red-500 text-xs mt-1">${msg}</p>
        </div>
      `).join('')
    )
  }

  return res.header('HX-Redirect', '/checkout/payment').send()
})


  server.post("/sell-product", async (req, res) => {
    if (!req.session.username) {
      return res.status(401).send("Non autorizzato")
    }

    const uploadDir = path.join(process.cwd(), "public", "images")
    
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
    } catch (dirError: any) {}

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
          if (part.fieldname === "coverIndex") coverIndex = parseInt(part.value as string, 10) || 0
        }
      }

      if (!productName || price <= 0 || stock < 1) {
        return res
          .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Errore: Campi non compilati correttamente." } }))
          .send()
      }

      res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Richiesta ricevuta. Il prodotto è in fase di elaborazione." } }))
        .header("HX-Redirect", `/profile?username=${user.userName}`)
        .send()

      setImmediate(async () => {
        try {
          const messageContent: any[] = [
            {
              text: `Analizza questo prodotto in vendita:\n${JSON.stringify({ productName, category, description, price })}`
            }
          ]

          for (const url of imageUrls) {
            const absolutePath = path.join(process.cwd(), "public", url)
            
            if (fs.existsSync(absolutePath)) {
              const ext = path.extname(absolutePath).toLowerCase()
              let format: "jpeg" | "png" | "gif" | "webp" | null = null

              if (ext === ".jpg" || ext === ".jpeg") format = "jpeg"
              else if (ext === ".png") format = "png"
              else if (ext === ".gif") format = "gif"
              else if (ext === ".webp") format = "webp"

              if (format) {
                const imageBuffer = fs.readFileSync(absolutePath)
                messageContent.push({
                  image: {
                    format: format,
                    source: {
                      bytes: new Uint8Array(imageBuffer)
                    }
                  }
                })
              }
            }
          }

          const command = new ConverseCommand({
            modelId: process.env.BEDROCK_MODEL_ID || "eu.anthropic.claude-sonnet-4-6",
            messages: [
              {
                role: "user",
                content: messageContent
              }
            ],
            system: [
              {
                text: `You are an automated moderation agent for an e-commerce marketplace. Your sole job is to evaluate new product listings submitted by sellers and return a single decimal score between 0.00 and 1.00. You must never return anything other than this number — no explanations, no comments, no punctuation, no text.

SCORING SCALE:
0.00 - ILLEGAL ITEM

0.80-1 - ITEMS WHICH ARE NOT SCUMMY OR SUSPICIOUS IN ANY WAY, OR FOR WHICH THERE IS NOT ENOUGH INFORMATION TO JUDGE (DEFAULT TO APPROVAL)

YOUR DEFAULT ASSUMPTION IS APPROVAL.
Unless you can point to a specific concrete problem, score 0.90 or above.
Doubt = approve. Uncertainty = approve. Missing info = approve.
Never use the manual review band as a fallback for vagueness.

ELECTRONICS & BRANDED GOODS:
Smartphones, laptops, tablets, and other consumer electronics listed under a real brand name (Apple, Samsung, Sony, etc.) are among the most commonly resold items on any marketplace. Listing an iPhone, Galaxy, MacBook, or similar at any reasonable second-hand price is completely normal. Score these 0.90–1.00 by default.

WHAT "SUSPICIOUS PRICE" ACTUALLY MEANS:
A price is only suspicious if it is more than 90% below the known retail price with zero explanation. Examples:
- iPhone 15 Pro listed at 850€ → completely normal → 0.95
- iPhone 15 Pro listed at 600€ → used/discounted, totally fine → 0.93
- iPhone 15 Pro listed at 50€ → suspicious → 0.60
- iPhone 15 Pro listed at 5€ → obvious scam → 0.10
A price that simply seems "low" or "cheap" for a new item is NOT a flag. Second-hand electronics are routinely sold at 30–60% below retail.

HARD REJECTION — 0.00 to 0.45 — only for:
- Explicitly illegal products (controlled substances, illegal weapons, CSAM, stolen goods explicitly stated)
- Word "replica", "fake", "clone", "copy of" in the listing
- Price more than 90% below retail with no condition explanation
- Product that has no legitimate civilian use

MANUAL REVIEW — 0.50 to 0.79 — only for:
- Dual-use items commonly misused (certain chemicals, surveillance devices, lock-picking sets)
- Prescription-only or heavily regulated items
- Images explicitly contradict the text description
- Price is 70–90% below retail with no condition explanation

APPROVE — 0.80 to 1.00 — everything else, including:
- All standard consumer electronics, new or used
- Branded goods at any reasonable price
- Items with short or vague descriptions
- Budget or low-cost items
- Second-hand goods in any stated condition

OUTPUT FORMAT:
A single decimal number only. Nothing else.`
              }
            ],
            inferenceConfig: {
              temperature: 0.1,
              maxTokens: 300
            }
          })

          const bedrockResponse = await bedrockClient.send(command)
          const responseText = bedrockResponse.output?.message?.content?.[0]?.text || "0.0"

          let score = 0.0
          try {
            const cleanText = responseText.replace(/```json|```/g, "").trim()
            const parsed = JSON.parse(cleanText)
            if (typeof parsed === "number") {
              score = parsed
            } else if (parsed && typeof parsed.score === "number") {
              score = parsed.score
            } else {
              score = parseFloat(cleanText) || 0.0
            }
          } catch (parseError) {
            score = parseFloat(responseText.trim()) || 0.0
          }

          let status: string
          if (score < 0.50) {
            status = "rejected"
          } else if (score < 0.80) {
            status = "pending"
          } else {
            status = "approved"
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
            userId: user.id,
            status,
            reliability: score
          })

          server.log.info(`Prodotto salvato con successo via background worker. Status: ${status}`)

        } catch (bgError) {
          server.log.error(bgError)
        }
      })

    } catch (error: any) {
      console.error(error)
      server.log.error(error)
      
      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Errore interno durante la moderazione del prodotto." } }))
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
      return res.status(500).send("Impossibile eliminare il prodotto")
    }
  })
}