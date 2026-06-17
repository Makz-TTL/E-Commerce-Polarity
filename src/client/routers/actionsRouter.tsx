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
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime"
import EditProductModal from "../components/EditProductModal"
import { getCartCount } from "../helpers/cartCounter"
import crypto from "crypto"
import CartBadgeOOB from "../components/CartBadgeOOB"
import { OrderDetailModal } from "../components/orderDetailModal"
import { count } from "drizzle-orm";
import { statusBadge } from "../components/orderDetailModal";
import { OrderWithDetails, OrderRows, ProductRows, UserRows } from "../components/adminDashboard"
import { User } from "../../db/schema/users"

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

//Calcola numero di ordini pendenti nel db.
async function getPendingOrdersCount() {
  const result = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.status, "pending"));

  return result[0].count;
}

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
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  cognome: z.string().trim().min(1, "Il cognome è obbligatorio"),
  username: z.string().trim().min(4, "Username deve essere di almeno 4 caratteri"),
})

const IMAGE_FORMATS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"])

const MODERATION_SYSTEM_PROMPT = `You are an automated moderation agent for an e-commerce marketplace. Your sole job is to evaluate new product listings and return a single decimal score between 0.00 and 1.00. Never return anything other than this number.

SCORING SCALE:
0.00 – 0.49 → REJECTED
0.50 – 0.79 → MANUAL REVIEW
0.80 – 1.00 → APPROVED

---

ALWAYS REJECT (0.00 – 0.20):
- Illegal weapons, firearms, ammunition, explosives
- Controlled substances, drugs, narcotics
- Tobacco, cigarettes, e-cigarettes, vaping products, nicotine products
- Alcohol
- Prescription medications or pharmaceuticals
- Adult/pornographic content
- Counterfeit or replica branded goods ("fake", "replica", "clone", "inspired by")
- Stolen goods (explicitly stated)
- CSAM or anything involving minors
- Gambling items or services
- Anything with no legitimate physical product (scam listings, "send money", "I will give you...")

---

ALWAYS APPROVE (0.90 – 1.00):
- Consumer electronics (phones, laptops, tablets, headphones, cameras)
- Clothing, shoes, accessories
- Furniture and home goods
- Books, games, toys
- Sports equipment
- Kitchen and household items
- Cars, bikes, vehicles and their parts
- Musical instruments
- Art and handmade goods
- Second-hand or used versions of any of the above
- Branded goods (Apple, Samsung, Nike, etc.) at any reasonable market price

---

MANUAL REVIEW (0.50 – 0.79) — only when a specific flag exists:
- Dual-use items (certain chemicals, lock-picking tools, surveillance devices)
- Price is more than 80% below typical market value with no condition explanation
- Images explicitly contradict the description
- Regulated items that may require certification (children's safety gear, medical devices)

---

PRICE GUIDANCE:
A price is only suspicious if it exceeds 80% off retail with no explanation.
- iPhone 15 Pro at 850€ → 0.95
- iPhone 15 Pro at 500€ → 0.92 (used, normal)
- iPhone 15 Pro at 80€ → 0.55 (suspicious)
- iPhone 15 Pro at 5€ → 0.05 (scam)

---

DEFAULT RULE:
If the product is a real, tangible, legal consumer good not in the rejection list, approve it.
If you are unsure whether something is in the rejection list, send it to manual review, do not reject.

OUTPUT: A single decimal number only. Nothing else.`

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
  "/dashboard",
  "/admin"
])

function isProtectedRoute(url: string): boolean {
  const pathname = url.split("?")[0]
  return (
    PROTECTED_ROUTES.has(pathname) ||
    pathname.startsWith("/deleteFromCart/") ||
    pathname.startsWith("/updateCartQuantity/") ||
    pathname.startsWith("/edit-product/") ||
    pathname.startsWith("/edit-product-modal/") ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/admin/")
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

    const pathname = req.url.split("?")[0]

    // Se la rotta è admin, verifica che l'utente sia admin
    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin/")) && !user.isAdmin) {
      return res.redirect("/")
    }

    if (user.isBanned) {
      return res.redirect("/banned")
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
      req.session.userId = dbUser.id

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
      const existingUserToUpdate = existingUsername || existingEmail

      if (existingUserToUpdate) {
        await db.update(users).set({
          name: nome[0].toUpperCase() + nome.substring(1),
          lastName: cognome[0].toUpperCase() + cognome.substring(1),
          userName: username,
          eMail: email,
          password: passwordHash,
          verificationCode,
          isVerified: false,
        }).where(eq(users.id, existingUserToUpdate.id))
      } else {
        await db.insert(users).values({
          name: nome[0].toUpperCase() + nome.substring(1),
          lastName: cognome[0].toUpperCase() + cognome.substring(1),
          userName: username,
          eMail: email,
          password: passwordHash,
          verificationCode,
          isVerified: false,
        })
      }

      await sendTemplateEmail({
        to: email,
        subject: "Verifica il tuo account TechStore",
        template: "WelcomeEmail",
        payload: { name: nome[0].toUpperCase() + nome.substring(1), code: verificationCode },
      })

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

      // --- LOGICA DI AGGIORNAMENTO IN TEMPO REALE (HTMX OOB) ---

      // 1. Recupera tutti gli elementi aggiornati nel carrello dell'utente (con i dati del prodotto associato)
      const cartProducts = await db.query.cart.findMany({
        where: user ? { userId: user.id } : undefined,
        with: { cartItem: true },
      })
      

      // where: user ? { userId: user.id } : undefined,
      //   with: { cartItem: true },

      // 2. Calcola il nuovo prezzo totale globale del carrello
      const totalCart = cartProducts.reduce((sum, item) => {
        const price = item.cartItem?.price ? Number(item.cartItem.price) : 0
        const quantity = item.quantity ? Number(item.quantity) : 1
        return sum + price * quantity
      }, 0)

      // 3. Calcola il numero di elementi totali per il badge
      const cartCount = await getCartCount(user.userName)

      // 4. Rispondi impostando il Toast nell'header e i nodi OOB nel body dell'HTML
      res.header("HX-Trigger", JSON.stringify({ showAddedToCartToast: { message: `${quantity}x ${product.productName} aggiunto al carrello!` } }))
      res.header("Content-Type", "text/html")

      return res.status(200).send(
          <>
            {/* Aggiorna il contatore numerico sulla Navbar */}
            <CartBadgeOOB count={cartCount} />

            {/* Aggiorna la cifra totale del carrello (se l'utente si trova nella pagina del carrello) */}
            <span id="cart-total" class="text-[22px] font-bold" hx-swap-oob="true">
              ${totalCart.toLocaleString("it-IT")}
            </span>
          </>
      )
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
            <SignUpForm isEdit={true} values={{ ...(req.body as User), email: currentUser.eMail }} errors={{ username: "Username già in uso da un altro utente" }} />
          )
        }
      }

      await db.update(users).set({ name: nome, lastName: cognome, userName: username }).where(eq(users.id, currentUser.id))
      req.session.username = username
      req.session.userId = currentUser.id

      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Profilo aggiornato con successo!" } }))
        .header("HX-Redirect", `/profile?username=${username}`)
        .send()
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore interno durante il salvataggio.")
    }
  })




  //Aggiornamento quantità prodotto.
  server.post("/updateCartQuantity/:cartId", async (req, res) => {
    const { cartId } = req.params as { cartId: string }
    const newQty = parseInt((req.body as { quantity: string }).quantity, 10)

    if (isNaN(newQty) || newQty < 1) return res.status(400).send("Quantità non valida")

    try {
      // 1. Controlla se l'elemento appartiene all'utente
      const [item] = await db.select().from(cart)
        .where(and(eq(cart.id, parseInt(cartId, 10)), eq(cart.userId, req.currentUser!.id)))
        .limit(1)
        
      if (!item) return res.status(403).send("Non autorizzato")

      // 2. AGGIORNA LA QUANTITÀ NEL DATABASE (Questo mancava!)
      await db.update(cart)
        .set({ quantity: newQty })
        .where(eq(cart.id, parseInt(cartId, 10)))

      // 3. Recupera l'utente e i prodotti AGGIORNATI dal database
      const user = await db.query.users.findFirst({ where: { userName: req.session?.username } })

      const cartProducts = await db.query.cart.findMany({
        where: user ? { userId: user.id } : undefined,
        with: { cartItem: true },
      })

      // 4. Calcola il totale globale del carrello con i dati aggiornati
      const totalCart = cartProducts.reduce((sum, item) => {
        const price = item.cartItem?.price ? Number(item.cartItem.price) : 0
        const quantity = item.quantity ? Number(item.quantity) : 1
        return sum + price * quantity
      }, 0)

      // 5. Trova l'elemento corrente aggiornato per calcolare il suo totale parziale
      const updatedItem = cartProducts.find(p => p.id === parseInt(cartId, 10))
      const itemTotal = (Number(updatedItem?.cartItem?.price) || 0) * (Number(updatedItem?.quantity) || 1)

      const cartCount = await getCartCount(req.session?.username)

      // 6. Rispondi con i blocchi OOB (Out-of-Band) aggiornati
      return res.status(200).html(
        <>
          <span id={`item-total-${cartId}`} class="text-xl font-semibold text-black-600" hx-swap-oob="true">
            ${itemTotal.toLocaleString("it-IT")}
          </span>
          <span id="cart-total" class="text-[22px] font-bold" hx-swap-oob="true">
            ${totalCart.toLocaleString("it-IT")}
          </span>
          <CartBadgeOOB count={cartCount} />
        </>
      )
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore interno del server")
    }
  })





  //Conferma pagamento.
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

    const address = (req.session as any).userAddress.address;
    const city = (req.session as any).userAddress.city;
    console.log("indirizzo: ",address);

    for (const item of cartItems) {
      if (!item.cartItem) continue
      const itemTotal = (item.cartItem.price || 0) * item.quantity
      totalAmount += itemTotal

      await Promise.all([
        db.insert(orders).values({ userId: user.id, productId: item.productId, quantity: item.quantity, totalPrice: itemTotal, status: "not yet sent", address: address, city: city }),
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





  //Validazione checkout.
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

    const user = await db.query.users.findFirst({ where: { userName: req.session.username } })
    const cartItems = await db.query.cart.findMany({
      where: user ? { userId: user.id } : undefined,
      with: { cartItem: true },
    })

    const stockIssues = cartItems.filter(item => (item.quantity ?? 1) > (item.cartItem?.stock ?? 0))

    if (stockIssues.length > 0) {
      const message = stockIssues
        .map(item => `${item.cartItem?.productName}: richiesti ${item.quantity}, disponibili ${item.cartItem?.stock ?? 0}`)
        .join(" | ")

      return res
        .header("HX-Trigger", JSON.stringify({ showErrorToast: { message: `Stock insufficiente per alcuni prodotti: ${message}. Aggiorna il carrello.` } }))
        .send()
    }

    (req.session as any).userAddress = {
      address: address,
      city: city
    };

    return res.header("HX-Redirect", "/checkout/payment").send()
  })





  //Descrizione con l'AI
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
      server.log.error(error)
      return res.status(200).html(
        <textarea id="description" name="description" rows="3" maxlength="1000"
          placeholder="Descrivi brevemente le caratteristiche del prodotto (max 1000 caratteri)..."
          class={textareaClass("border-red-300 focus:ring-red-500")}
        >Si è verificato un errore durante la generazione automatica. Riprova.</textarea>
      )
    }
  })





  //Vendita prodotto.
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
          await db.update(users).set({ hasUnseenModeration: true }).where(eq(users.id, user.id))

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





  //End-point per il filtro della sezione ordini.
  server.get("/admin/orders/filter", async (request, reply) => {
    const { filter } = request.query as { filter?: string };

    const [allUsers, allProducts, allOrders] = await Promise.all([
      db.select().from(users),
      db.select().from(products),
      filter && filter !== "all"
        ? db.select().from(orders).where(eq(orders.status, filter))
        : db.select().from(orders),
    ]);

    const ordersWithDetails: OrderWithDetails[] = allOrders.map(order => {
      const user = allUsers.find(u => u.id === order.userId);
      const product = allProducts.find(p => p.id === order.productId);
      return {
        ...order,
        userName: user ? `${user.name} ${user.lastName}` : "Utente rimosso",
        productName: product?.productName ?? "Prodotto rimosso",
      };
    });

    reply.header("Content-Type", "text/html");
    return reply.send(await (<OrderRows orders={ordersWithDetails} />));
  });





  //End-point per il filtro della sezione utenti.
  server.get('/admin/products/filter', async (req, reply) => {
    // 1. Recupera i parametri di filtro inviati dal form HTMX
    const { status, sortPrice, sortStock } = req.query as { 
      status?: string; 
      sortPrice?: 'asc' | 'desc'; 
      sortStock?: 'asc' | 'desc';
    };

    // 2. Prendi i prodotti reali dal database (esegui la query asincrona)
    const dbProducts = await db.select().from(products); 
    // NOTA: Assicurati che "products" sia il riferimento corretto alla tabella del tuo schema db
    
    let filteredProducts = [...dbProducts];

    // 3. Logica di filtraggio dello stato
    if (status && status !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.status === status);
    }
    
    // 4. Logica di ordinamento del Prezzo
    if (sortPrice === 'asc') {
      filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortPrice === 'desc') {
      filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
    }
    
    // 5. Logica di ordinamento dello Stock
    if (sortStock === 'asc') {
      filteredProducts.sort((a, b) => Number(a.stock) - Number(b.stock));
    } else if (sortStock === 'desc') {
      filteredProducts.sort((a, b) => Number(b.stock) - Number(a.stock));
    }

    // 6. Imposta l'header corretto e rispondi con il componente compilato
    reply.header("Content-Type", "text/html");
    return reply.send(<ProductRows products={filteredProducts} />);
  });


  server.get('/admin/users/filter', async (req, reply) => {
    // 1. Recupera il parametro di stato inviato da HTMX
    const { status } = req.query as { status?: 'all' | 'active' | 'inactive' | 'banned' };

    // 2. Prendi gli utenti dal database usando la tua istanza db
    const dbUsers = await db.select().from(users); // Assicurati che "users" punti alla tabella corretta

    let filteredUsers = [...dbUsers];

    // 3. Logica di filtraggio
    if (status === 'active') {
      // Utenti verificati e NON bannati
      filteredUsers = filteredUsers.filter(u => u.isVerified && !u.isBanned);
    } else if (status === 'inactive') {
      // Utenti non verificati e NON bannati (corretto anche il pallino arancione nel front-end)
      filteredUsers = filteredUsers.filter(u => !u.isVerified && !u.isBanned);
    } else if (status === 'banned') {
      // Utenti bannati
      filteredUsers = filteredUsers.filter(u => u.isBanned);
    }

    // 4. Invia la risposta HTML parziale
    reply.header("Content-Type", "text/html");
    return reply.send(
        <UserRows user={filteredUsers} />
      );
  });


  //Modifica stato ordini.
  server.post("/admin/orders/:id/status", async (request, reply) => {
    const callerUserName = request.session.username

    if (!callerUserName) {
      return reply.status(401).send("Devi effettuare il login")
    }

    const callerUser = await db.query.users.findFirst({
      where: { userName: callerUserName }
    })

    if (!callerUser || !callerUser.isAdmin) {
      return reply.status(403).send("Non autorizzato")
    }

    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: "Stato non valido" });
    }

    await db.update(orders).set({ status }).where(eq(orders.id, Number(id)));

    const badge = statusBadge[status] ?? statusBadge["pending"];
    const pendingCount = await getPendingOrdersCount();

    reply.header("Content-Type", "text/html");
    return reply.send(`
      <span
        id="badge-${id}"
        class="${badge.bg} ${badge.label} inline-block text-xs px-2.5 py-1 rounded-full"
        hx-swap-oob="true"
      >
        ${badge.label}
      </span>
      <div
        id="pending-count"
        hx-swap-oob="true"
        class="text-2xl font-bold tracking-tight ${pendingCount > 0 ? "text-amber-600" : "text-emerald-600"}"
      >
        ${pendingCount}
      </div>
    `);
  });





  //Apertura modale per dettagli ordine.
  server.get("/dashboard/orders/:id/modal", async (req, reply) => {
    const { id } = req.params as { id: string }

    const [order] = await db.select().from(orders).where(eq(orders.id, Number(id)))
    const user = await db.select().from(users).where(eq(users.id, order.userId))
    const product = await db.select().from(products).where(eq(products.id, order.productId))

    const orderWithDetails = {
      ...order,
      userName: user[0] ? `${user[0].name} ${user[0].lastName}` : "Utente rimosso",
      productName: product[0]?.productName ?? "Prodotto rimosso",
    }

    return reply.html(<OrderDetailModal order={orderWithDetails} />)
  })





  //Eliminazione prodotto tramite l'id.
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





  //Apertura modale per modifica prodotto. 
  server.get("/edit-product-modal/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)
    const user = req.currentUser!

    const product = await db.query.products.findFirst({ where: { id: productId } })
    if (!product) return res.status(404).send("Prodotto non trovato")
    if (product.userId !== user.id) return res.status(403).send("Non autorizzato")

    return res.status(200).html(<EditProductModal product={product} />)
  })

  server.post("/edit-product/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)
    const user = req.currentUser!
    const resolvedUploadDir = path.join(process.cwd(), "public", "images")
    fs.mkdirSync(resolvedUploadDir, { recursive: true })

    const existingProduct = await db.query.products.findFirst({ where: { id: productId } })
    if (!existingProduct) return res.status(404).send("Prodotto non trovato")
    if (existingProduct.userId !== user.id) return res.status(403).send("Non autorizzato")

    try {
      const parts = req.parts()
      let productName = "", price = 0, stock = 0, category = "", description = "", coverImage = ""
      const keepImages: string[] = []
      const newImageUrls: string[] = []

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "images" && part.filename) {
          const ext = path.extname(part.filename).toLowerCase()
          if (!IMAGE_FORMATS.has(ext)) { part.file.resume(); continue }

          const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`
          const uploadPath = path.join(resolvedUploadDir, uniqueFilename)
          const optimizer = sharp({ failOn: "none" })
            .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80, progressive: true })

          await pipeline(part.file, optimizer, fs.createWriteStream(uploadPath))
          newImageUrls.push(`/images/${uniqueFilename}`)
        } else if (part.type === "field") {
          if (part.fieldname === "productName") productName = part.value as string
          if (part.fieldname === "price")       price = parseFloat(part.value as string) || 0
          if (part.fieldname === "stock")       stock = parseInt(part.value as string, 10) || 0
          if (part.fieldname === "category")    category = part.value as string
          if (part.fieldname === "description") description = part.value as string
          if (part.fieldname === "coverImage")  coverImage = part.value as string
          if (part.fieldname === "keepImages")  keepImages.push(part.value as string)
        }
      }

      if (!productName || price < 0.01 || stock < 1) {
        const product = await db.query.products.findFirst({ where: { id: productId } })
        return res.status(200).html(<EditProductModal product={product!} error="Campi non compilati correttamente." />)
      }

      let finalImages = [...keepImages, ...newImageUrls]

      if (coverImage && !coverImage.startsWith("new-") && keepImages.includes(coverImage)) {
        finalImages = [coverImage, ...finalImages.filter(u => u !== coverImage)]
      } else if (coverImage.startsWith("new-") && newImageUrls.length > 0) {
        finalImages = [...newImageUrls, ...keepImages]
      }

      await db.update(products)
        .set({ productName, price, stock, category, description, imageUrl: JSON.stringify(finalImages) })
        .where(eq(products.id, productId))

      const toast = encodeURIComponent("Modifiche ricevute. Il prodotto è in fase di revisione.")
      res.header("HX-Redirect", `/profile?username=${user.userName}&toast=${toast}`).send()

      setImmediate(async () => {
        try {
          const messageContent: any[] = [
            { text: `Analizza questo prodotto modificato:\n${JSON.stringify({ productName, category, description, price })}` }
          ]

          for (const url of newImageUrls) {
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

          await db.update(products)
            .set({ status, reliability: score })
            .where(eq(products.id, productId))

          await db.update(users)
            .set({ hasUnseenModeration: true })
            .where(eq(users.id, user.id))

          server.log.info(`Prodotto ${productId} moderato. Status: ${status}, Score: ${score}`)
        } catch (bgError) {
          server.log.error(bgError, "moderation background error")
        }
      })
    } catch (error) {
      server.log.error(error, "edit-product error")
      if (!res.sent) {
        res.status(500).send("Errore durante la modifica del prodotto")
      }
    }
  })



  
  //BACKEND LOGIC FOR ADMIN




  //Modifica dello stato del prodotto.
  server.patch("/admin/products/:id/status", async (req, res) => {
    const callerUserName = req.session.username
      
    if (!callerUserName) {
      return res.status(401).send("NO")
    }

    const callerUser= await db.query.users.findFirst({
      where: {
        userName: callerUserName
      }
    })

    if (!callerUser || !callerUser.isAdmin) {
      return res.status(403).send("NO MA SEI LOGGATO")
    }


    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    const allowed = ["approved", "pending", "rejected"]
    if (!allowed.includes(status)) return res.status(400).send("Stato non valido")
    
    await db.update(products).set({ status }).where(eq(products.id, parseInt(id, 10)))
    
  
    const currentUrlHeader = req.headers["hx-current-url"] as string
    let redirectUrl = "/dashboard?tab=products" 
    
    if (currentUrlHeader) {
      const parsedUrl = new URL(currentUrlHeader)
      
    
      parsedUrl.searchParams.set("toast", "Lo stato del prodotto e' stato cambiato")
      parsedUrl.searchParams.set("toastType", "success")
      
      
      if (!parsedUrl.searchParams.has("tab")) {
        parsedUrl.searchParams.set("tab", "products")
      }
      
      redirectUrl = parsedUrl.pathname + parsedUrl.search
    } else {
      const message = encodeURIComponent("Lo stato del prodotto e' stato cambiato")
      redirectUrl = `/dashboard?tab=products&toast=${message}&toastType=success`
    }

    return res
      .header("HX-Redirect", redirectUrl)
      .send()
  })



server.post("/orders/:id/cancel", async (req, res) => {
  if (!req.session.username) return res.status(401).send("Non autorizzato")

  const params = req.params as { id: string }
  const orderId = Number(params.id)
  
  const [user] = await db.select().from(users).where(eq(users.userName, req.session.username))
  if (!user) return res.status(404).send("Utente non trovato")

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order || order.userId !== user.id || order.status !== "not yet sent") {
    return res.status(403).send("Azione non permessa")
  }

  const [product] = await db.select().from(products).where(eq(products.id, order.productId))
  if (product) {
    await db.update(products)
      .set({ stock: product.stock + order.quantity })
      .where(eq(products.id, product.id))
  }

  await db.delete(orders).where(eq(orders.id, orderId))

  return res.send("")
})



server.post("/orders/:id/mark-sent", async (req, res) => {
  if (!req.session.username) return res.status(401).send("Non autorizzato")

  const params = req.params as { id: string }
  const orderId = Number(params.id)
  
  const [user] = await db.select().from(users).where(eq(users.userName, req.session.username))
  
  const order = await db.query.orders.findFirst({
    where: { id: orderId },
    with: { product: true }
  })

  if (!order || order.product?.userId !== user.id || order.status !== "not yet sent") {
    return res.status(403).send("Azione non permessa")
  }

   await db.update(orders).set({ status: "sent" }).where(eq(orders.id, orderId))

    const productLink = order.product ? `/product/${order.product.id}` : "#"

  return res.html(
    <div
      id={`sold-order-${order.id}`}
      onclick={`window.location.href='${productLink}'`}
      class="flex items-center justify-between py-3 gap-4 hover:bg-gray-50/80 px-2 -mx-2 rounded-xl cursor-pointer transition-colors"
    >
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-800 truncate">{order.product?.productName ?? "Prodotto eliminato"}</p>
        <div class="flex items-center gap-2 mt-0.5" onclick="event.stopPropagation()">
          <p class="text-xs text-gray-400">Quantità: {order.quantity}</p>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
            Spedito
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3" onclick="event.stopPropagation()">
        <span class="text-emerald-600 font-bold">+${order.totalPrice.toLocaleString("it-IT")}</span>
      </div>
    </div>
  )
})

server.post("/orders/:id/mark-delivered", async (req, res) => {
  if (!req.session.username) return res.status(401).send("Non autorizzato")

  const params = req.params as { id: string }
  const orderId = Number(params.id)
  
  const [user] = await db.select().from(users).where(eq(users.userName, req.session.username))
  
  const order = await db.query.orders.findFirst({
    where: { id: orderId },
    with: { product: true }
  })

  if (!order || order.userId !== user.id || order.status !== "sent") {
    return res.status(403).send("Azione non permessa")
  }

  await db.update(orders).set({ status: "delivered" }).where(eq(orders.id, orderId))

  let orderCoverImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80"
  if (order.product?.imageUrl) {
    try {
      const images = JSON.parse(order.product.imageUrl)
      if (Array.isArray(images) && images.length > 0) orderCoverImage = images[0]
    } catch { 
      orderCoverImage = order.product.imageUrl
    } 
  }

  const productLink = order.product ? `/product/${order.product.id}` : "#"

  return res.html(
    <div
      id={`user-order-${order.id}`}
      onclick={`window.location.href='${productLink}'`}
      class="flex items-center justify-between py-3 gap-4 hover:bg-gray-50/80 px-2 -mx-2 rounded-xl cursor-pointer transition-colors"
    >
      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        <img src={orderCoverImage} alt={order.product?.productName || "Prodotto"} class="w-full h-full object-cover" />
      </div>
      <div class="flex-1">
        <p class="font-medium text-gray-800">{order.product?.productName ?? "Prodotto eliminato"}</p>
        <div class="flex items-center gap-2 mt-0.5" onclick="event.stopPropagation()">
          <p class="text-xs text-gray-400">Quantità: {order.quantity}</p>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
            Consegnato
          </span>
        </div>
      </div>
      <div class="flex items-center gap-3" onclick="event.stopPropagation()">
        <span class="text-gray-900 font-bold">${order.totalPrice.toLocaleString("it-IT")}</span>
      </div>
    </div>
  )
})


  
}