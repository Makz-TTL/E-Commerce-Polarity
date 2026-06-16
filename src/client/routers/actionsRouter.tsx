import { ZodFastifyInstance } from "../../types/index"
import { db } from "../../db"
import { eq, and } from "drizzle-orm"
import * as argon2 from "argon2"
import { z } from "zod"
import fs from "fs"
import sharp from "sharp"
import { orders, users, products, cart } from "../../db/schema"
import LoginForm from "../components/LoginForm"
import OtpForm from "../components/OtpForm"
import SignUpForm from "../components/SignUpForm"
import { sendTemplateEmail } from "../../emails/index"
import path from "path"
import { pipeline } from "stream/promises"
import { fileURLToPath } from "url"
import Cart from "../components/cart"
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime"
import EditProductModal from "../components/EditProductModal"
import {getCartCount} from "../helpers/cartCounter"
import crypto from "crypto"
import CartBadgeOOB from "../components/CartBadgeOOB"


type PaymentBody = { cardNumber: string; expiry: string }
type CheckOutBody = { fullName?: string; city?: string; cap?: string; address?: string }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, "../../public/images")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "eu-central-1",
})

const loginSchema = z.object({
  username: z.string().trim().min(1, "Il nome utente è obbligatorio"),
  password: z.string().trim().min(1, "La password è obbligatoria"),
})

const signUpSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  cognome: z.string().trim().min(1, "Il cognome è obbligatorio"),
  username: z.string().trim().min(4, "Username deve essere di almeno 4 caratteri"),
  email: z.string().trim().email("Email non valida"),
  password: z.string().trim().min(8, "La password deve essere lunga almeno 8 caratteri"),
})

const editProfileSchema = z.object({
  nome: z.string().min(1, "Il nome è obbligatorio"),
  cognome: z.string().min(1, "Il cognome è obbligatorio"),
  username: z.string().min(4, "Username deve essere di almeno 4 caratteri"),
})

const IMAGE_FORMATS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"])

const MODERATION_SYSTEM_PROMPT = `You are an automated moderation agent for an e-commerce marketplace. Your sole job is to evaluate new product listings submitted by sellers and return a single decimal score between 0.00 and 1.00. You must never return anything other than this number — no explanations, no comments, no punctuation, no text.

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

function parseBedrockScore(text: string): number {
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(clean)
    if (typeof parsed === "number") return parsed
    if (typeof parsed?.score === "number") return parsed.score
    return parseFloat(clean) || 0.0
  } catch {
    return parseFloat(text.trim()) || 0.0
  }
}

async function imageToBedrockContent(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  const format = ext === ".jpg" ? "jpeg" : (ext.slice(1) as "png" | "gif" | "webp" | "jpeg")
  if (!IMAGE_FORMATS.has(ext)) return null
  const bytes = new Uint8Array(fs.readFileSync(filePath))
  return { image: { format, source: { bytes } } }
}

const PROTECTED_ROUTES = new Set([
  "/editProfile",
  "/deleteFromCart",
  "/updateCartQuantity",
  "/payment/confirm",
  "/checkout/validate",
  "/magic-description",
  "/sell-product",
  "/edit-product",
])

function isProtectedRoute(url: string): boolean {
  const pathname = url.split("?")[0]
  return (
    PROTECTED_ROUTES.has(pathname) ||
    pathname.startsWith("/deleteFromCart/") ||
    pathname.startsWith("/updateCartQuantity/") ||
    pathname.startsWith("/edit-product/") ||
    pathname.startsWith("/edit-product-modal/")
  )
}

export default (server: ZodFastifyInstance) => {

  server.addHook("preHandler", async (req, res) => {
    if (!isProtectedRoute(req.url)) return

    const token = req.session.sessionToken
    if (!token) return res.redirect("/")

    const [user] = await db.select().from(users).where(eq(users.session, token)).limit(1)
    if (!user) {
      await req.session.destroy()
      return res.redirect("/")
    }

    req.currentUser = user
  })

 server.post("/login", async (req, res) => {
  const { redirect } = req.query as { redirect?: string }
  const redirectTo = redirect || "/"
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    return res.status(200).html(
      <LoginForm redirectTo={redirectTo} values={req.body as any} error={{
        username: fieldErrors.username?.[0],
        password: fieldErrors.password?.[0],
      }} />
    )
  }

  const { username, password } = result.data

  try {
    const [dbUser] = await db.select().from(users).where(eq(users.userName, username)).limit(1)

    if (!dbUser || !(await argon2.verify(dbUser.password, password))) {
      return res.status(200).html(
        <LoginForm redirectTo={redirectTo} values={{ username, password }} error={{ password: "Username o password errati" }} />
      )
    }

    if (!dbUser.isVerified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      await db.update(users).set({ verificationCode }).where(eq(users.id, dbUser.id))

      await sendTemplateEmail({
        to: dbUser.eMail,
        subject: "Verifica il tuo account TechStore",
        template: "WelcomeEmail",
        payload: { name: dbUser.name, code: verificationCode },
      })

      return res.status(200).html(<OtpForm email={dbUser.eMail} />)
    }

    const sessionToken = crypto.randomBytes(32).toString("hex")
    await db.update(users).set({ session: sessionToken }).where(eq(users.id, dbUser.id))

    req.session.sessionToken = sessionToken
    req.session.username = dbUser.userName

    if (typeof req.session.save === "function") {
      await req.session.save()
    }

    return res
      .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Ti sei loggato con successo" } }))
      .header("HX-Redirect", redirectTo)
      .send()
  } catch (error) {
    server.log.error(error)
    return res.status(200).html(
      <LoginForm redirectTo={redirectTo} values={result.data} error={{ password: "Si è verificato un errore interno. Riprova più tardi." }} />
    )
  }
})
  server.post("/signUp", async (req, res) => {
    console.log("Here")
    const result = signUpSchema.safeParse(req.body)

    if (!result.success) {
      const errors = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
      )
      return res.status(200).html(<SignUpForm values={req.body as any} errors={errors} />)
    }

    const { nome, cognome, username, email, password } = result.data

  

    try {
      const [existingUsername] = await db.select().from(users).where(eq(users.userName, username)).limit(1)
      if (existingUsername && existingUsername.isVerified) {
        return res.status(200).html(<SignUpForm values={req.body as any} errors={{ username: "Username già in uso" }} />)
      }

      const [existingEmail] = await db.select().from(users).where(eq(users.eMail, email)).limit(1)
      if (existingEmail && existingEmail.isVerified) {
        return res.status(200).html(<SignUpForm values={req.body as any} errors={{ email: "Email già in uso" }} />)
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const passwordHash = await argon2.hash(password)

      const existingUserToUpdate = existingUsername || existingEmail;

      if (existingUserToUpdate) {
        
    console.log("fetching existingUserToUpdate")
        await db.update(users).set({
          name: (nome[0].toUpperCase())+(nome.substring(1)),
          lastName: (cognome[0].toUpperCase())+(cognome.substring(1)),
          userName: username,
          eMail: email,
          password: passwordHash,
          verificationCode,
          isVerified: false,
        }).where(eq(users.id, existingUserToUpdate.id))
        console.log("fetching done")
      } else {
       console.log("fetching not existingUserToUpdate")
        await db.insert(users).values({
          name: (nome[0].toUpperCase())+(nome.substring(1)),
          lastName: (cognome[0].toUpperCase())+(cognome.substring(1)),
          userName: username,
          eMail: email,
          password: passwordHash,
          verificationCode,
          isVerified: false,
        })
      }

      console.log("sendin email")
      await sendTemplateEmail({
        to: email,
        subject: "Verifica il tuo account TechStore",
        template: "WelcomeEmail",
        payload: { name: (nome[0].toUpperCase())+(nome.substring(1)), code: verificationCode },
      })
      console.log("fetching done")

      return res.status(200).html(<OtpForm email={email} />)
    } catch (error) {
      server.log.error(error)
      return res.status(200).html(<SignUpForm values={req.body as any} errors={{ email: "Si è verificato un errore interno." }} />)
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

    if (isNaN(cartID)) return res.status(400).send("ID non valido")

    try {
      const [item] = await db.select().from(cart).where(and(eq(cart.id, cartID), eq(cart.userId, req.currentUser!.id))).limit(1)
      if (!item) return res.status(403).send("Non autorizzato")

      await db.delete(cart).where(eq(cart.id, cartID))
      return res.header("HX-Redirect", "/cart").send()
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore durante l'eliminazione")
    }
  })

  server.get("/addToCart/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)
    const quantity = parseInt((req.query as { quantity?: string }).quantity || "1", 10)

    if (isNaN(productId)) return res.status(400).send("ID Prodotto non valido")
    if (isNaN(quantity) || quantity < 1) return res.status(400).send("Quantità non valida")

    if (!req.session.sessionToken) {
      return res
        .header("HX-Trigger", JSON.stringify({ showErrorToast: { message: "Devi essere loggato per aggiungere prodotti al carrello" } }))
        .send()
    }

    const [user] = await db.select().from(users).where(eq(users.session, req.session.sessionToken)).limit(1)
    if (!user) {
      return res
        .header("HX-Trigger", JSON.stringify({ showErrorToast: { message: "Devi essere loggato per aggiungere prodotti al carrello" } }))
        .send()
    }

    try {
      const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1)
      if (!product) return res.status(404).send("Prodotto non trovato")

      if (product.userId === user.id) {
        return res.header("HX-Trigger", JSON.stringify({ showErrorToast: { message: "Non puoi aggiungere al carrello un tuo prodotto!" } })).send()
      }

      if (product.stock < quantity) {
        return res.header("HX-Trigger", JSON.stringify({ showErrorToast: { message: `Stock insufficiente! Disponibili solo: ${product.stock}` } })).send()
      }

      const [existingItem] = await db.select().from(cart).where(and(eq(cart.userId, user.id), eq(cart.productId, productId))).limit(1)

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        if (product.stock < newQuantity) {
          return res.header("HX-Trigger", JSON.stringify({ showErrorToast: { message: `Hai già questo articolo nel carrello. Non puoi superare lo stock massimo di ${product.stock}!` } })).send()
        }
        await db.update(cart).set({ quantity: newQuantity }).where(eq(cart.id, existingItem.id))
      } else {
        await db.insert(cart).values({ userId: user.id, productId, quantity })
      }

      return res
        .header("HX-Trigger", JSON.stringify({ showAddedToCartToast: { message: `${quantity}x ${product.productName} aggiunto al carrello!` } }))
        .send()
    } catch (error) {
      return res.status(500).send("Errore durante l'aggiunta al carrello")
    }
  })

  server.post("/editProfile", async (req, res) => {
    const result = editProfileSchema.safeParse(req.body)
    const currentUser = req.currentUser!

    if (!result.success) {
      const errors = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
      )
      return res.status(200).html(<SignUpForm isEdit={true} values={{ ...(req.body as any), email: currentUser.eMail }} errors={errors} />)
    }

    const { nome, cognome, username } = result.data

    try {
      if (username !== currentUser.userName) {
        const [taken] = await db.select().from(users).where(eq(users.userName, username)).limit(1)
        if (taken) {
          return res.status(200).html(
            <SignUpForm isEdit={true} values={{ ...(req.body as any), email: currentUser.eMail }} errors={{ username: "Username già in uso da un altro utente" }} />
          )
        }
      }

      await db.update(users).set({ name: nome, lastName: cognome, userName: username }).where(eq(users.id, currentUser.id))
      req.session.username = username

      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Profilo aggiornato con successo!" } }))
        .header("HX-Redirect", `/profile?username=${username}`)
        .send()
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore interno durante il salvataggio.")
    }
  })

  server.post("/updateCartQuantity/:cartId", async (req, res) => {
    const { cartId } = req.params as { cartId: string }
    const newQty = parseInt((req.body as { quantity: string }).quantity, 10)

    if (isNaN(newQty) || newQty < 1) return res.status(400).send("Quantità non valida")

    try {
      const [item] = await db.select().from(cart).where(and(eq(cart.id, parseInt(cartId, 10)), eq(cart.userId, req.currentUser!.id))).limit(1)
      if (!item) return res.status(403).send("Non autorizzato")

        const user = await db.query.users.findFirst({
            where: { userName: req.session?.username }
        })

        const cartProducts = await db.query.cart.findMany({
            where: user ? { userId: user.id } : undefined,
            with: { cartItem: true }
        })

        const totalCart = cartProducts.reduce((sum, item) => {
            const price = item.cartItem?.price ? Number(item.cartItem.price) : 0
            const quantity = item.quantity ? Number(item.quantity) : 1
            return sum + (price * quantity)
        }, 0)

        const updatedItem = cartProducts.find(p => p.id === parseInt(cartId, 10))
        const itemTotal = ((Number(updatedItem?.cartItem?.price) || 0) * (Number(updatedItem?.quantity) || 1))

        const cartCount = await getCartCount(req.session?.username) //nuovo

        return res.status(200).html(
            <>
                <span id={`item-total-${cartId}`} class="text-xl font-semibold text-black-600" hx-swap-oob="true">
                    ${itemTotal.toLocaleString("it-IT")}
                </span>
                <span id="cart-total" class="text-[22px] font-bold" hx-swap-oob="true">
                    ${totalCart.toLocaleString("it-IT")}
                </span>
                <CartBadgeOOB count={cartCount} /> {/*nuovo */}
            </>
        )
   
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore interno del server")
    }
  })



  //Confirmed payment.
  server.post("/payment/confirm", async (req, res) => {
    const { cardNumber, expiry } = req.body as PaymentBody
    const [month, year] = expiry.split("/")
    const expiryMonth = parseInt(month)
    const expiryYear = parseInt("20" + year)
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const validExpiry =
      expiryMonth >= 1 && expiryMonth <= 12 &&
      (expiryYear > currentYear || (expiryYear === currentYear && expiryMonth >= currentMonth))

    if (cardNumber === "1234 5678 1234 5678" || !validExpiry) {
      return res.header("HX-Redirect", "/payment/declined").send()
    }

    const user = req.currentUser!
    const cartItems = await db.query.cart.findMany({ where: { userId: user.id }, with: { cartItem: true } })
    if (cartItems.length === 0) return res.header("HX-Redirect", "/cart").send()

    let totalAmount = 0

    for (const item of cartItems) {
      if (!item.cartItem) continue
      const itemTotal = (item.cartItem.price || 0) * item.quantity
      totalAmount += itemTotal

      await Promise.all([
        db.insert(orders).values({ userId: user.id, productId: item.productId, quantity: item.quantity, totalPrice: itemTotal, status: "not yet sent" }),
        db.update(products).set({ stock: item.cartItem.stock - item.quantity }).where(eq(products.id, item.productId)),
      ])
    }

    await db.delete(cart).where(eq(cart.userId, user.id))

    res.header("HX-Redirect", "/payment/accepted").send()

    setImmediate(async () => {
      try {
        await sendTemplateEmail({
          to: user.eMail,
          subject: "Conferma del tuo ordine TechStore",
          template: "OrderConfirmEmail",
          payload: { name: user.name, totalPrice: totalAmount.toFixed(2) },
        })
      } catch (emailError) {
        server.log.error(emailError)
      }
    })
  })

  server.get("/checkout/validate", async (req, res) => {
    const { fullName, city, cap, address } = req.query as CheckOutBody
    const errors: Record<string, string> = {}

    if (!fullName?.trim()) errors.fullName = "Nome obbligatorio"
    if (!address?.trim()) errors.address = "Indirizzo obbligatorio"
    if (!city?.trim()) errors.city = "Città obbligatoria"
    if (!cap?.trim()) errors.cap = "CAP obbligatorio"

    if (Object.keys(errors).length > 0) {
      return res.html(
        Object.entries(errors).map(([field, msg]) => `
          <style hx-swap-oob="beforeend:head">[name='${field}'] { border-color: rgb(239 68 68) !important; }</style>
          <div hx-swap-oob="innerHTML:#error-${field}"><p class="text-red-500 text-xs mt-1">${msg}</p></div>
        `).join("")
      )
    }

    //controllo stock prima di proseguire
    const user = await db.query.users.findFirst({
        where: { userName: req.session.username }
    })

    const cartItems = await db.query.cart.findMany({
        where: user ? { userId: user.id } : undefined,
        with: { cartItem: true }
    })

    const stockIssues = cartItems.filter(item => (item.quantity ?? 1) > (item.cartItem?.stock ?? 0))

    if (stockIssues.length > 0) {
        const message = stockIssues
            .map(item => `${item.cartItem?.productName}: richiesti ${item.quantity}, disponibili ${item.cartItem?.stock ?? 0}`)
            .join(" | ")

        return res
            .header("HX-Trigger", JSON.stringify({
                showErrorToast: { message: `Stock insufficiente per alcuni prodotti: ${message}. Aggiorna il carrello.` }
            }))
            .send()
    }

    return res.header("HX-Redirect", "/checkout/payment").send()
  })

  server.post("/magic-description", async (req, res) => {
    const textareaClass = (extra = "") =>
      `w-full border ${extra} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 text-gray-900 bg-white resize-none`

    try {
      const parts = req.parts()
      let productName = "", price = "", category = ""
      const messageContent: any[] = []

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "images" && part.filename) {
          const ext = path.extname(part.filename).toLowerCase()
          const format = ext === ".jpg" || ext === ".jpeg" ? "jpeg" : ext === ".png" ? "png" : ext === ".gif" ? "gif" : ext === ".webp" ? "webp" : null

          if (format) {
            const chunks: Buffer[] = []
            for await (const chunk of part.file) chunks.push(chunk)
            const optimized = await sharp(Buffer.concat(chunks), { failOn: "none" })
              .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 75 })
              .toBuffer()
            messageContent.push({ image: { format: "jpeg", source: { bytes: new Uint8Array(optimized) } } })
          } else {
            part.file.resume()
          }
        } else if (part.type === "field") {
          if (part.fieldname === "productName") productName = part.value as string
          else if (part.fieldname === "price") price = part.value as string
          else if (part.fieldname === "category") category = part.value as string
        }
      }

      messageContent.unshift({ text: `Genera una descrizione per questo prodotto:\n${JSON.stringify({ productName, category, price })}` })

      const command = new ConverseCommand({
        modelId: process.env.BEDROCK_MODEL_ID || "eu.anthropic.claude-sonnet-4-6",
        messages: [{ role: "user", content: messageContent }],
        system: [{ text: "Sei un copywriter esperto di e-commerce. Il tuo unico compito è scrivere una descrizione di prodotto accattivante, professionale e persuasiva in lingua italiana basandoti sui dati e sulle immagini fornite. Mantieni il testo sotto i 1000 caratteri. Restituisci ESCLUSIVAMENTE la descrizione finale come testo puro. Non includere saluti, introduzioni, titoli, virgolette o formattazioni markdown, il sito punta alle nuove generazioni, quindi matieni un tono fresco, directo e coinvolgente, rendi anche il testo bello visivamente usando emoji pertinenti al prodotto, ma senza esagerare. Se le immagini fornite mostrano un prodotto danneggiato o di bassa qualità, evidenzialo nella descrizione in modo sottile ma chiaro, in modo da evitare aspettative errate nei clienti." }],
        inferenceConfig: { temperature: 0.7, maxTokens: 400 },
      })

      const bedrockResponse = await bedrockClient.send(command)
      const generatedText = bedrockResponse.output?.message?.content?.[0]?.text || ""

      return res.status(200).html(
        <textarea id="description" name="description" rows="3" maxlength="1000"
          placeholder="Descrivi brevemente le caratteristiche del prodotto (max 1000 caratteri)..."
          class={textareaClass("border-gray-300 focus:ring-indigo-500")}
        >{generatedText.trim()}</textarea>
      )
    } catch (error) {
      console.log(error)
      server.log.error(error)
      return res.status(200).html(
        <textarea id="description" name="description" rows="3" maxlength="1000"
          placeholder="Descrivi brevemente le caratteristiche del prodotto (max 1000 caratteri)..."
          class={textareaClass("border-red-300 focus:ring-red-500")}
        >Si è verificato un errore durante la generazione automatica. Riprova.</textarea>
      )
    }
  })

  server.post("/sell-product", async (req, res) => {
    const user = req.currentUser!
    const uploadDir = path.join(process.cwd(), "public", "images")
    fs.mkdirSync(uploadDir, { recursive: true })

    try {
      const parts = req.parts()
      let productName = "", price = 0, stock = 0, category = "", description = "", coverIndex = 0
      const imageUrls: string[] = []

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "images" && part.filename) {
          const ext = path.extname(part.filename).toLowerCase()
          if (!IMAGE_FORMATS.has(ext)) { part.file.resume(); continue }

          const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
          const uploadPath = path.join(uploadDir, uniqueFilename)
          const optimizer = sharp({ failOn: "none" })
            .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })

          await pipeline(part.file, optimizer, fs.createWriteStream(uploadPath))
          imageUrls.push(`/images/${uniqueFilename}`)
        } else if (part.type === "field") {
          if (part.fieldname === "productName") productName = part.value as string
          else if (part.fieldname === "price") price = parseFloat(part.value as string) || 0
          else if (part.fieldname === "stock") stock = parseInt(part.value as string, 10) || 0
          else if (part.fieldname === "category") category = part.value as string
          else if (part.fieldname === "description") description = part.value as string
          else if (part.fieldname === "coverIndex") coverIndex = parseInt(part.value as string, 10) || 0
        }
      }

      if (!productName || price <= 0 || stock < 1) {
        return res
          .header("HX-Trigger", JSON.stringify({ showErrorToast: { message: "Errore: Campi non compilati correttamente." } }))
          .send()
      }

      const [product] = await db.insert(products).values({
        productName, price, stock, category, description,
        imageUrl: imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined,
        userId: user.id,
        status: "pending",
        reliability: null,
      }).returning()

      res
        .header("HX-Redirect", `/profile?username=${user.userName}&toast=Richiesta ricevuta. Il prodotto è in fase di elaborazione.`)
        .send()

      setImmediate(async () => {
        try {
          const messageContent: any[] = [
            { text: `Analizza questo prodotto in vendita:\n${JSON.stringify({ productName, category, description, price })}` }
          ]

          for (const url of imageUrls) {
            const absolutePath = path.join(process.cwd(), "public", url)
            const content = await imageToBedrockContent(absolutePath)
            if (content) messageContent.push(content)
          }

          const command = new ConverseCommand({
            modelId: process.env.BEDROCK_MODEL_ID || "eu.anthropic.claude-sonnet-4-6",
            messages: [{ role: "user", content: messageContent }],
            system: [{ text: MODERATION_SYSTEM_PROMPT }],
            inferenceConfig: { temperature: 0.1, maxTokens: 300 },
          })

          const bedrockResponse = await bedrockClient.send(command)
          const score = parseBedrockScore(bedrockResponse.output?.message?.content?.[0]?.text || "0.0")
          const status = score < 0.50 ? "rejected" : score < 0.80 ? "pending" : "approved"

          if (imageUrls.length > 0 && coverIndex >= 0 && coverIndex < imageUrls.length) {
            imageUrls.unshift(...imageUrls.splice(coverIndex, 1))
          }

          await db.update(products).set({ status, reliability: score }).where(eq(products.id, product.id))
          server.log.info(`Product saved. Status: ${status}`)
        } catch (bgError) {
          server.log.error(bgError)
        }
      })
    } catch (error) {
      server.log.error(error)
      return res
        .header("HX-Trigger", JSON.stringify({ showErrorToast: { message: "Errore interno durante la moderazione del prodotto." } }))
        .send()
    }
  })

  server.delete("/product/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)

    if (isNaN(productId)) return res.status(400).send("ID Prodotto non valido")
    if (!req.session.username) return res.status(401).send("Devi effettuare il login per completare questa azione")

    try {
      const [user] = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
      if (!user) return res.status(404).send("Utente non trovato")

      await db.delete(products).where(and(eq(products.id, productId), eq(products.userId, user.id)))

      const currentUrl = req.headers["hx-current-url"] as string || ""
      if (currentUrl.includes(`/product/${productId}`)) {
        return res.header("HX-Redirect", "/").status(200).send()
      }

      return res.status(200).send()
    } catch {
      return res.status(500).send("Impossibile eliminare il prodotto")
    }
  })

  server.get("/edit-product-modal/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)

    const product = await db.query.products.findFirst({ where: { id: productId } })
    if (!product) return res.status(404).send("Prodotto non trovato")

    return res.status(200).html(<EditProductModal product={product} />)
  })

  server.post("/edit-product/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)
    const user = req.currentUser!

    try {
      const parts = req.parts()
      let productName = "", price = 0, stock = 0, category = "", description = "", coverIndex = 0
      const imageUrls: string[] = []

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "images" && part.filename) {
          const ext = path.extname(part.filename).toLowerCase()
          if (!IMAGE_FORMATS.has(ext)) { part.file.resume(); continue }

          const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
          const uploadPath = path.join(uploadDir, uniqueFilename)
          const optimizer = sharp({ failOn: "none" })
            .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })

          await pipeline(part.file, optimizer, fs.createWriteStream(uploadPath))
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
        const product = await db.query.products.findFirst({ where: { id: productId } })
        return res.status(200).html(<EditProductModal product={product!} error="Campi non compilati correttamente." />)
      }

      res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Modifiche ricevute. Il prodotto è in fase di revisione." } }))
        .header("HX-Redirect", `/profile?username=${user.userName}`)
        .send()

      setImmediate(async () => {
        try {
          const messageContent: any[] = [
            { text: `Analizza questo prodotto modificato:\n${JSON.stringify({ productName, category, description, price })}` }
          ]

          for (const url of imageUrls) {
            const absolutePath = path.join(process.cwd(), "public", url)
            const content = await imageToBedrockContent(absolutePath)
            if (content) messageContent.push(content)
          }

          const command = new ConverseCommand({
            modelId: process.env.BEDROCK_MODEL_ID || "eu.anthropic.claude-sonnet-4-6",
            messages: [{ role: "user", content: messageContent }],
            system: [{ text: MODERATION_SYSTEM_PROMPT }],
            inferenceConfig: { temperature: 0.1, maxTokens: 300 },
          })

          const bedrockResponse = await bedrockClient.send(command)
          const score = parseBedrockScore(bedrockResponse.output?.message?.content?.[0]?.text || "0.0")
          const status = score < 0.50 ? "rejected" : score < 0.80 ? "pending" : "approved"

          const updateData: any = { productName, price, stock, category, description, status, reliability: score }

          if (imageUrls.length > 0) {
            if (coverIndex >= 0 && coverIndex < imageUrls.length) {
              const coverImage = imageUrls.splice(coverIndex, 1)[0]
              imageUrls.unshift(coverImage)
            }
            updateData.imageUrl = JSON.stringify(imageUrls)
          }

          await db.update(products).set(updateData).where(eq(products.id, productId))
          server.log.info(`Prodotto ${productId} aggiornato. Status: ${status}, Score: ${score}`)
        } catch (bgError) {
          server.log.error(bgError)
        }
      })
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore durante la modifica del prodotto")
    }
  })
}