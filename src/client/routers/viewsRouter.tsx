import { ZodFastifyInstance } from "../../types/index"
import Marketplace from "../components/marketplace"
import MainLayout from "../layouts/MainLayout"
import SignUpForm from "../components/SignUpForm"

export default (server: ZodFastifyInstance) => {
  const renderHome = async (_req: unknown, reply: { html: (content: JSX.Element) => unknown }) =>
    reply.html(
      <MainLayout>
        <Marketplace />
      </MainLayout>
    )
    

  server.get("/", renderHome)
  server.get("/marketplace", renderHome)

  server.get("/signUp", async (req, res) => {
    return res.html(
      <MainLayout>
        <SignUpForm values = {{ nome: "", cognome: "", username: "", email: "", password: "" }}/>
      </MainLayout>
    )
  })
}
