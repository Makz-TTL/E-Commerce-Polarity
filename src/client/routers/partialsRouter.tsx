import { users } from "../../db/schema"
import { ZodFastifyInstance } from "../../types/index"
import ConfirmLogoutModal from "../components/ConfirmLogoutModal"
import LoginForm from "../components/LoginForm"
import Modal from "../components/Modal"
import OtpForm from "../components/OtpForm"
import SignUpForm from "../components/SignUpForm"
import { db } from "../../db"

export default (server: ZodFastifyInstance) => {



  server.get("/confirm-logout-modal", (_req, reply) => {
    return reply.html(
      <ConfirmLogoutModal />
    )
  })

  server.get("/login-modal", (_req, reply) => {
    return reply.html(
      <Modal
        id="login-modal"
        title={<h2 class="text-xl font-bold">Accedi</h2>}
      >
        <LoginForm values={{ username: "", password: "" }} />
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

  
}