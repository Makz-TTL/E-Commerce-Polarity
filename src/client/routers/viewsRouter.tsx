import { FastifyReply, FastifyRequest } from "fastify"
import { ZodFastifyInstance } from "../../types/index"
import Marketplace from "../components/marketplace"
import MainLayout from "../layouts/MainLayout"
import SignUpForm from "../components/SignUpForm"

export default (server: ZodFastifyInstance) => {
  const renderMarketplace = async (
    req: FastifyRequest<{ Querystring: { category?: string } }>, // Rimosso search che non usi più
    reply: FastifyReply
  ) => {
    const query = req.query
    
    // Prepariamo l'oggetto esattamente come se lo aspetta MarketplaceProps
    const searchParams = {
      category: typeof query.category === "string" ? query.category : undefined,
    }
    const isHtmx = req.headers["hx-request"] === "true"

    if (isHtmx) {
      const htmlContent = await Marketplace({ searchParams, partial: true })
      return reply.html(htmlContent)
    }

    // CORREZIONE: Eseguiamo l'await anche all'interno del Layout per la pagina intera
    const marketplaceContent = await Marketplace({ searchParams })
    return reply.html(
      <MainLayout>
        {marketplaceContent}
      </MainLayout>
    )
  }


  server.get("/signUp", async (req, res) => {
    return res.html(
      <MainLayout>
        <SignUpForm values = {{ nome: "", cognome: "", username: "", email: "", password: "" }}/>
      </MainLayout>
    )
  })

  server.get("/", renderMarketplace)
  server.get("/marketplace", renderMarketplace)
}
