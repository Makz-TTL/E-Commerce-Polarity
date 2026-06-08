import { FastifyReply, FastifyRequest } from "fastify"
import { ZodFastifyInstance } from "../../types/index"
import Marketplace from "../components/marketplace"
import MainLayout from "../layouts/MainLayout"
import SignUpForm from "../components/SignUpForm"
import Cart from "../components/cart"
import PorfilePage from "../components/ProfilePage"
import { users } from "../../db/schema"
import { db } from "../../db"
import LoginForm from "../components/LoginForm"
import { eq } from "drizzle-orm"
import Checkout from "../components/checkout"
import Payment from "../components/payment"

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
    console.log("Session in /cart route:", req.session.username) 
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


  server.get("/checkout", async (req, res) => {
    const user = await db.query.users.findFirst({
      where: { userName: req.session.username }
    })

    const orders = await db.query.orders.findMany({
      where: user ? { userId: user.id } : undefined,
      with: { product: true }
    })

    return res.html(
      <MainLayout>
        <Checkout session={req.session} orders={orders} user={user}/>
      </MainLayout>
    )
  })


  server.get("/payment", async (req, res) => {

    const orders = await db.query.orders.findMany({})

    return res.html(
      <MainLayout>
        <Payment session={req.session} orders={orders}/>
      </MainLayout>
    )
  })

  server.get("/editProfile", async (req, res) => {
      if (!req.session.username) {
        return res.status(200).html(
          <LoginForm
            values={{ username: "", password: "" }}
            error={{ password: "Devi essere autenticato per modificare il profilo" }}
          />
        )
      }
  
      try {
        
        const rows = await db.select().from(users).where(eq(users.userName, req.session.username)).limit(1)
        const currentUser = rows[0]
  
        if (!currentUser) {
          return res.status(404).send("Utente non trovato")
        }
  
        
        return res.status(200).html(
          <SignUpForm
            isEdit={true}
            onEditPasswordClick="alert('Pulsante cliccato! Endpoint password non configurato come da istruzioni.')"
            values={{
              nome: currentUser.name || "",       
              cognome: currentUser.lastName || "", 
              username: currentUser.userName || "",
              email: currentUser.eMail || "",
            }}
          />
        )
      } catch (error) {
        server.log.error(error)
        return res.status(500).send("Errore nel caricamento del profilo")
      }
    })
  

  server.get("/", renderMarketplace)
  server.get("/marketplace", renderMarketplace)
}