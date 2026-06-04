import { ZodFastifyInstance } from "../../types/index"
import ConfirmLogoutModal from "../components/ConfirmLogoutModal"
import LoginForm from "../components/LoginForm"
import Modal from "../components/Modal"

export default (server: ZodFastifyInstance) => {

  server.get("/modal", (_req, reply) => {
    return reply.html(
      <Modal
        isOpen
        centered
        title={<h2 class="text-xl font-bold">Titolo del modale</h2>}
      >
        Questo è un modale di test, puoi chiuderlo cliccando sulla "X" in alto a destra o cliccando fuori dal modale.
      </Modal>
    )
  })

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

  server.get("/cart-preview", (_req, reply) => {
    return reply.html(
      <div class="p-4 text-sm text-gray-600">Il carrello è vuoto.</div>
    )
  })
}
