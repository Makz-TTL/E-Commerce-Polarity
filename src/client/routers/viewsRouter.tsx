import { FastifyReply, FastifyRequest } from "fastify"
import { ZodFastifyInstance } from "../../types/index"
import Marketplace from "../components/marketplace"
import MainLayout from "../layouts/MainLayout"
import SignUpForm from "../components/SignUpForm"
import Cart from "../components/cart"
import PorfilePage from "../components/ProfilePage"

export default (server: ZodFastifyInstance) => {
  const renderMarketplace = async (
    req: FastifyRequest<{ Querystring: { category?: string } }>,
    reply: FastifyReply
  ) => {
    const query = req.query
    
    const searchParams = {
      category: typeof query.category === "string" ? query.category : undefined,
    }
    const isHtmx = req.headers["hx-request"] === "true"

    if (isHtmx) {
      const htmlContent = await Marketplace({ searchParams, partial: true })
      return reply.html(htmlContent)
    }

    const marketplaceContent = await Marketplace({ searchParams, session: req.session })
    return reply.html(
      <MainLayout>
        {marketplaceContent}
      </MainLayout>
    )
  }

  server.get("/signUp", async (req, res) => {
    return res.html(
      <MainLayout>
        <SignUpForm values={{ nome: "", cognome: "", username: "", email: "", password: "" }} />
      </MainLayout>
    )
  })


  server.get("/cart", async (req, res) => {
    console.log("Session in /cart route:", req.session.username) // Debug log per verificare la sessione.
    return res.html(
      <MainLayout>
        <Cart session={req.session} />
      </MainLayout>
    )
  })


  server.get("/profile", async (req, res) => {
    if(!req.session.username){
      return res.redirect("/")
    }

    const content = await PorfilePage({ username: req.session.username })
    return res.html(
      <MainLayout>
        {content}
      </MainLayout>
    )
  })

  server.get("/", renderMarketplace)
  server.get("/marketplace", renderMarketplace)
}