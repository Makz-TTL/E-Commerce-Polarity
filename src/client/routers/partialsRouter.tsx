import { users } from "../../db/schema"
import { ZodFastifyInstance } from "../../types/index"
import ConfirmLogoutModal from "../components/ConfirmLogoutModal"
import LoginForm from "../components/LoginForm"
import Modal from "../components/Modal"
import OtpForm from "../components/OtpForm"
import OtpPasswordForm from "../components/OtpPasswordForm"
import EditPasswordForm from "../components/EditPassword"
import SignUpForm from "../components/SignUpForm"
import { db } from "../../db"
import { eq } from "drizzle-orm"
import * as argon2 from "argon2"
import { sendTemplateEmail } from "../../emails/index"

export default (server: ZodFastifyInstance) => {

  server.get("/confirm-logout-modal", (_req, reply) => {
    return reply.html(
      <ConfirmLogoutModal />
    )
  })

  server.get("/login-modal", async (req, res) => {
    const { redirect } = req.query as { redirect?: string }
    const currentRedirect = redirect || "/"

    // Avvolgiamo il LoginForm dentro il componente Modal per centrarlo a schermo
    return res.status(200).html(
      <Modal
        id="login-modal"
        title={<h2 class="text-xl font-bold text-gray-900">Accedi</h2>}
      >
        <LoginForm 
          redirectTo={currentRedirect} 
          values={{ username: "", password: "" }} 
        />
      </Modal>
    )
  })

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

  server.get("/cart-preview", (_req, reply) => {
    return reply.html(
      <div class="p-4 text-sm text-gray-600">Il carrello è vuoto.</div>
    )
  })

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

  server.get("/edit-profile-modal", async (req, res) => {
    if (!req.session.username) {
      return res.status(200).html(
        <div class="p-6 text-center">
          <p class="text-gray-600 mb-4">Devi essere autenticato per modificare il profilo.</p>
        </div>
      )
    }

    try {
      const rows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
      const currentUser = rows[0]

      if (!currentUser) {
        return res.status(404).send("Utente non trovato")
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
                onEditPasswordClick="alert('Gestione password non configurata')"
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
    return res.status(500).send("Errore nel caricamento dei dati del profilo")
  }
})  

  server.get("/editPassword-modal", async (req, res) => {
    if (!req.session.username) return res.status(401).send("Non autorizzato")
    return res.status(200).html(<EditPasswordForm />)
  })

  server.post("/editPassword", async (req, res) => {
    if (!req.session.username) return res.status(401).send("Non autorizzato")

    const { oldPassword, newPassword, confirmPassword } = req.body as {
      oldPassword: string
      newPassword: string
      confirmPassword: string
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).html(<EditPasswordForm error="Le password non coincidono." />)
    }

    const rows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
    const user = rows[0]

    if (!user || !(await argon2.verify(user.password, oldPassword))) {
      return res.status(200).html(<EditPasswordForm error="La vecchia password non è corretta." />)
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    req.session.tempPasswordData = {
      newPasswordHash: await argon2.hash(newPassword),
      code: verificationCode
    }
    
    await sendTemplateEmail({
      to: user.eMail,
      subject: "Conferma cambio password TechStore",
      template: "ChangePasswordEmail",
      payload: {
        name: user.name,
        code: verificationCode
      }
    })

    return res.status(200).html(<OtpPasswordForm email={user.eMail} />)
  })

  server.post("/verify-password-otp", async (req, res) => {
    if (!req.session.username) return res.status(401).send("Non autorizzato")

    const { otp } = req.body as { otp: string }
    const tempData = req.session.tempPasswordData

    if (!tempData) {
      return res.status(200).html(<OtpPasswordForm email="" error="Sessione scaduta. Riprova." />)
    }

    if (otp !== tempData.code) {
      const rows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
      return res.status(200).html(<OtpPasswordForm email={rows[0]?.eMail ?? ""} error="Codice non corretto." />)
    }

    await db.update(users)
      .set({ password: tempData.newPasswordHash })
      .where(eq(users.userName, req.session.username))

    req.session.tempPasswordData = undefined

    return res
      .header("HX-Trigger", JSON.stringify({ showSuccessToast: { message: "Password aggiornata con successo!" } }))
      .header("HX-Redirect", "/profile")
      .send()
  })
  
}