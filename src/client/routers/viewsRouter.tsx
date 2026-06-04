import { ZodFastifyInstance } from "../../types/index"
import Marketplace from "../components/marketplace"
import MainLayout from "../layouts/MainLayout"

export default (server: ZodFastifyInstance) => {
  const renderHome = async (_req: unknown, reply: { html: (content: JSX.Element) => unknown }) =>
    reply.html(
      <MainLayout>
        <Marketplace />
      </MainLayout>
    )

  server.get("/", renderHome)
  server.get("/home", renderHome)
}
