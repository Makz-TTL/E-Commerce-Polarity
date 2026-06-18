import { orders, products, users } from "../../db/schema"
import { ZodFastifyInstance } from "../../types/index"
import ConfirmLogoutModal from "../components/ConfirmLogoutModal"
import LoginForm from "../components/LoginForm"
import Modal from "../components/Modal"
import OtpForm from "../components/OtpForm"
import EditPasswordForm from "../components/EditPassword"
import SignUpForm from "../components/SignUpForm"
import { db } from "../../db"
import { count, eq, inArray } from "drizzle-orm"
import * as argon2 from "argon2"
import { sendTemplateEmail } from "../../emails/index"
import ForgotPasswordForm from "../components/ForgotPasswordForm"
import ResetPasswordForm from "../components/ResetPasswordForm"
import * as crypto from "crypto"
import SellProductModal from "../components/SellProductModal"
import { z } from "zod"
import { ProductStatusModal } from "../components/ProductStatusModal"
import TransactionListModal from "../components/TransactionsListModal"
import { UserRows } from "../components/adminDashboard"

export default (server: ZodFastifyInstance) => {

  server.get("/confirm-logout-modal", (_req, reply) => {
    return reply.html(<ConfirmLogoutModal />)
  })





  //Modale Log In.
  server.get("/login-modal", async (req, res) => {
    const { redirect } = req.query as { redirect?: string }
    const currentRedirect = redirect || "/"

    return res.status(200).html(
      <Modal
        id="login-modal"
        title={<h2 class="text-xl font-bold text-gray-900">Accedi</h2>}
      >
        <LoginForm redirectTo={currentRedirect} values={{ username: "", password: "" }} />
      </Modal>
    )
  })





  //End-point per ban utenti.
  server.post("/admin/users/:id/ban", async (request, reply) => {
    const { id } = request.params as { id: string };

    const token = request.session.sessionToken;
     if (!token) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return reply.send(error)
}

    const callerUser = await db.select().from(users).where(eq(users.session, token)).limit(1);
    if (!callerUser[0]?.isAdmin)  {
    const error = new Error("Non autorizzato") as any
    error.statusCode = 403
    return reply.send(error)
}

    await db.update(users).set({ isBanned: true }).where(eq(users.id, Number(id)));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, Number(id)));

    reply.type("text/html");
    return reply.send(await (<UserRows user={[updatedUser]} />));
  });





  //End-point per unban utenti.
  server.post("/admin/users/:id/unban", async (request, reply) => {
    const { id } = request.params as { id: string };

    const token = request.session.sessionToken;
      if (!token) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return reply.send(error)
}

    const callerUser = await db.select().from(users).where(eq(users.session, token)).limit(1);
    if (!callerUser[0]?.isAdmin){
      const error = new Error("Non autorizzato") as any
      error.statusCode = 403
      return reply.send(error)
}

    await db.update(users).set({ isBanned: false }).where(eq(users.id, Number(id)));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, Number(id)));

    reply.type("text/html");
    return reply.send(await (<UserRows user={[updatedUser]} />));
  }); 
 
  



  //Modale Sign Up
  server.get("/signup-modal", (_req, reply) => {
    return reply.html(
      <Modal
        id="signup-modal"
        title={<h2 class="text-xl font-bold">Registrati</h2>}
      >
        <SignUpForm values={{}} errors={{}} />
      </Modal>
    )
  })





  //Preview cart.
  server.get("/cart-preview", (_req, reply) => {
    return reply.html(
      <div class="p-4 text-sm text-gray-600">Il carrello è vuoto.</div>
    )
  })





  //Verifica otp.
  server.post("/verify-otp", async (req, res) => {
    const { otp, email } = req.body as { otp: string; email: string }

    if (!email) {
      return res.status(200).html(
        <p class="text-red-500 text-sm font-semibold p-4 text-center">
          Sessione scaduta. Per favore, ricarica la pagina e riprova.
        </p>
      )
    }

    const [user] = await db.select().from(users).where(eq(users.eMail, email)).limit(1)

    if (!user) {
      return res.status(200).html(<OtpForm email={email} error="Utente non trovato. Riprova la registrazione." />)
    }

    if (otp !== user.verificationCode) {
      return res.status(200).html(<OtpForm email={email} error="Codice non valido o scaduto." />)
    }

    try {
      const sessionToken = crypto.randomBytes(32).toString("hex")

      await db.update(users)
        .set({ isVerified: true, session: sessionToken, verificationCode: null })
        .where(eq(users.id, user.id))

      req.session.sessionToken = sessionToken
      req.session.username = user.userName
      req.session.userId = user.id

      if (typeof req.session.save === "function") {
        await req.session.save()
      }

      return res
        .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Account verificato con successo!" } }))
        .header("HX-Redirect", "/")
        .send()
    } catch (error) {
      server.log.error(error)
      return res.status(200).html(<OtpForm email={email} error="Errore di sistema salvando l'utente." />)
    }
  })





  //Aggiornamento contatore automaticamente.
  server.get("/admin/stats/total-products", async (req, res) => {
     if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}

    try {
      // Conta i prodotti attuali nel DB
      const [result] = await db.select({ count: count() }).from(products)
      const totalProducts = result?.count ?? 0

      // Restituisci lo stesso identico pezzetto di HTML/JSX con il numero aggiornato
      return res.send(`
        <div 
          id="total-products-counter"
          hx-get="/admin/stats/total-products"
          hx-trigger="productDeleted from:body"
          hx-swap="outerHTML"
        >
          <div class="bg-white p-6 rounded-xl shadow-sm ...">
            <span class="text-gray-400 text-sm font-medium">Articoli totali</span>
            <div class="text-3xl font-bold text-gray-900 mt-2">${totalProducts}</div>
          </div>
        </div>
      `)
    } catch(error) {
      server.log.error(error)
      return res.send(error)
    }
  })




  
  //Modale per l'edit del profilo.
  server.get("/edit-profile-modal", async (req, res) => {
    if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}

    try {
      const [currentUser] = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)

      if (!currentUser) {
        const error = new Error("Utente non trovato") as any
        error.statusCode = 404
        throw error
        }

      return res.status(200).html(
        <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" id="editProfileModalContainer" onclick="if(event.target === this) this.remove()">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onclick="document.getElementById('editProfileModalContainer').remove()"
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="p-2 pt-6">
              <h2 class="text-xl font-bold text-gray-900 px-6">Modifica Profilo</h2>
              <SignUpForm
                isEdit={true}
                values={{
                  nome: currentUser.name || "",
                  cognome: currentUser.lastName || "",
                  username: currentUser.userName || "",
                  email: currentUser.eMail || "",
                }}
              />
            </div>
          </div>
        </div>
      )
    } catch (error) {
      server.log.error(error)
      server.log.error(error)
      return res.send(error)
    }
  })





  //Modale per l'edit della password.
  server.get("/editPassword-modal", async (req, res) => {
     if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}
    return res.status(200).html(<EditPasswordForm />)
  })

  const editPasswordSchema = z.object({
    oldPassword: z.string().min(1, "Inserisci la vecchia password"),
    newPassword: z.string().trim().min(8, "La nuova password deve essere di almeno 8 caratteri"),
    confirmPassword: z.string().trim().min(1),
  })





  //Modifica effettiva della password.
  server.post("/editPassword", async (req, res) => {
     if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}

    const result = editPasswordSchema.safeParse(req.body)

    if (!result.success) {
      const error = result.error.flatten().fieldErrors
      const message = error.oldPassword?.[0] || error.newPassword?.[0] || "Dati non validi."
      return res.status(200).html(<EditPasswordForm error={message} />)
    }

    const { oldPassword, newPassword, confirmPassword } = result.data

    if (newPassword !== confirmPassword) {
      return res.status(200).html(<EditPasswordForm error="Le password non coincidono." />)
    }

    const [user] = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)

    if (!user || !(await argon2.verify(user.password, oldPassword))) {
      return res.status(200).html(<EditPasswordForm error="La vecchia password non è corretta." />)
    }

    await db.update(users)
      .set({ password: await argon2.hash(newPassword) })
      .where(eq(users.userName, req.session.username))

    return res
      .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Password aggiornata con successo!" } }))
      .header("HX-Redirect", "/profile")
      .send()
  })





  //Modale per password dimenticata.
  server.get("/forgot-password-modal", async (_req, res) => {
    return res.status(200).html(<ForgotPasswordForm />)
  })




  //Effettivo reimpost della password.
  server.post("/forgot-password", async (req, res) => {
    const { email } = req.body as { email: string }

    const [user] = await db.select().from(users).where(eq(users.eMail, email)).limit(1)

    if (!user) {
      return res.status(200).html(
        <ForgotPasswordForm success="Se l'email è registrata, riceverai il codice a breve." />
      )
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await db.update(users)
      .set({ resetToken: resetCode, resetTokenExpiry: expiry })
      .where(eq(users.id, user.id))

    await sendTemplateEmail({
      to: user.eMail,
      subject: "Reimposta la tua password TechStore",
      template: "ChangePasswordEmail",
      payload: { name: user.name, code: resetCode },
    })

    return res.status(200).html(<ResetPasswordForm email={email} />)
  })

  const resetPasswordSchema = z.object({
    email: z.string().trim().email("Email non valida"),
    otp: z.string().trim().length(6, "Il codice deve essere di 6 caratteri"),
    newPassword: z.string().trim().min(8, "La password deve essere di almeno 8 caratteri"),
    confirmPassword: z.string().trim().min(1),
  })





  //Reset password.
  server.post("/reset-password", async (req, res) => {
    const result = resetPasswordSchema.safeParse(req.body)

    if (!result.success) {
      const error = result.error.flatten().fieldErrors
      const message = error.newPassword?.[0] || error.otp?.[0] || "Dati non validi."
      const email = (req.body as any).email || ""
      return res.status(200).html(<ResetPasswordForm email={email} error={message} />)
    }

    const { email, otp, newPassword, confirmPassword } = result.data

    if (newPassword !== confirmPassword) {
      return res.status(200).html(<ResetPasswordForm email={email} error="Le password non coincidono." />)
    }

    const [user] = await db.select().from(users).where(eq(users.eMail, email)).limit(1)

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(200).html(<ResetPasswordForm email={email} error="Codice non valido. Riprova." />)
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return res.status(200).html(<ResetPasswordForm email={email} error="Il codice è scaduto. Richiedine uno nuovo." />)
    }

    if (otp !== user.resetToken) {
      return res.status(200).html(<ResetPasswordForm email={email} error="Codice non corretto." />)
    }

    await db.update(users)
      .set({ password: await argon2.hash(newPassword), resetToken: null, resetTokenExpiry: null })
      .where(eq(users.id, user.id))

    return res
      .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Password reimpostata con successo!" } }))
      .header("HX-Redirect", "/")
      .send()
  })

  server.get("/sell-product-modal", async (req, res) => {
     if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}

    return res.status(200).html(<SellProductModal />)
  })

  server.get("/resend-verification", async (req, res) => {
     if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}

    const [user] = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
    if (!user) {
        const error = new Error("Utente non trovato") as any
        error.statusCode = 404
        return res.send(error)
        }
    if (user.isVerified){
  const error = new Error("Account gia' verificato") as any
  error.statusCode = 400
  return res.send(error)
}

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    await db.update(users)
      .set({ verificationCode })
      .where(eq(users.id, user.id))

    await sendTemplateEmail({
      to: user.eMail,
      subject: "Verifica il tuo account TechStore",
      template: "WelcomeEmail",
      payload: { name: user.name, code: verificationCode },
    })

    return res.status(200).send()
  })

server.get("/profile/transactions", async (req, res) => {
   if (!req.session.username) {
  const error = new Error("Devi effettuare il login") as any
  error.statusCode = 401
  return res.send(error)
}

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.userName, req.session.username))
    .limit(1)

  if (!user) {
        const error = new Error("Utente non trovato") as any
        error.statusCode = 404
        return res.send(error)
        }

  const userProducts = await db
    .select()
    .from(products)
    .where(eq(products.userId, user.id))

  if (userProducts.length === 0) {
    return res.status(200).html(<TransactionListModal soldOrders={[]} />)
  }

  const productIds = userProducts.map(p => p.id)

  const rows = await db
    .select({
      id: orders.id,
      quantity: orders.quantity,
      totalPrice: orders.totalPrice,
      status: orders.status,
      productName: products.productName,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(inArray(orders.productId, productIds))

  const soldOrders = rows.map(o => ({
    id: o.id,
    quantity: o.quantity ?? 0,
    totalPrice: o.totalPrice,
    status: o.status,
    product: o.productName ? { productName: o.productName } : null,
  }))

  return res.status(200).html(<TransactionListModal soldOrders={soldOrders} />)
})

    server.get("/dashboard/products/:id/status-modal", async (req, res) => {
    const { id } = req.params as { id: string }
    const product = await db.query.products.findFirst({ where: { id: parseInt(id, 10) } })
    if (!product) {
        const error = new Error("Prodotto non trovato") as any
        error.statusCode = 404
        return res.send(error)
        }
    return res.status(200).html(<ProductStatusModal product={product} />)
  })
  
}

function avatarColorClass(id: number) {
  throw new Error("Function not implemented.")
}
function initials(name: string, lastName: string) {
  throw new Error("Function not implemented.")
}

function UserRow(updatedUser: { id: number; name: string; lastName: string; eMail: string; userName: string; password: string; resetToken: string | null; resetTokenExpiry: string | null; session: string | null; isVerified: boolean; verificationCode: string | null; hasUnseenModeration: boolean; isAdmin: boolean; isBanned: boolean }, arg1: number): unknown {
  throw new Error("Function not implemented.")
}

