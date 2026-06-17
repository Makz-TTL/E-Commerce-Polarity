import { FastifyReply, FastifyRequest } from "fastify"
import { ZodFastifyInstance } from "../../types/index"
import Marketplace from "../components/marketplace"
import MainLayout from "../layouts/MainLayout"
import SignUpForm from "../components/SignUpForm"
import Cart from "../components/cart"
import ProfilePage from "../components/ProfilePage"
import { orders, products, users } from "../../db/schema"
import { db } from "../../db"
import LoginForm from "../components/LoginForm"
import { eq } from "drizzle-orm"
import Checkout from "../components/checkout"
import Payment from "../components/payment"
import ProductInfoPage from "../components/ProductInfoPage"
import PaymentAccepted from "../components/paymentAccepted"
import PaymentDeclined from "../components/paymentDeclined"
import AdminDashboard, { OrderWithDetails } from "../components/adminDashboard"
import BannedPage from "../components/bannedPage"

export default (server: ZodFastifyInstance) => {

  server.addHook("preHandler", async (request, reply) => {
    const url = request.raw.url || "";

    if (
      url.startsWith("/banned") ||
      url.startsWith("/admin") ||
      url.startsWith("/public")
    ) {
      return;
    }

    const token = request.session?.sessionToken;
    if (!token) return;

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.session, token))
      .limit(1);

    if (dbUser?.isBanned) {
      if (request.headers["hx-request"]) {
        reply.header("HX-Redirect", "/banned");
        return reply.code(200).send();
      }
      return reply.redirect("/banned");
    }
  });


  const renderMarketplace = async (
    req: FastifyRequest<{ Querystring: { category?: string; search?: string } }>,
    reply: FastifyReply
  ) => {
    const { category, search } = req.query
    const searchParams = {
      category: typeof category === "string" ? category : undefined,
      search: typeof search === "string" ? search : undefined,
    }

    const isHtmx = req.headers["hx-request"] === "true"

    if (isHtmx) {
      return reply.html(await Marketplace({ searchParams, partial: true, session: req.session }))
    }

    return reply.html(
      <MainLayout>
        {await Marketplace({ searchParams, session: req.session })}
      </MainLayout>
    )
  }

  server.get("/", renderMarketplace)
  server.get("/marketplace", renderMarketplace)

  server.get("/signUp", async (_req, res) => {
    return res.html(
      <MainLayout>
        <SignUpForm values={{ nome: "", cognome: "", username: "", email: "", password: "" }} />
      </MainLayout>
    )
  })

  server.get("/cart", async (req, res) => {
    if (!req.session.username) return res.redirect("/")

    return res.html(
      <MainLayout>
        <Cart session={req.session} />
      </MainLayout>
    )
  })



server.get("/dashboard", async (req, res) => {
  if (!req.session.username) return res.redirect("/")

  const callerUserName = req.session.username
  
  if (!callerUserName){
    return res.status(401).send("Devi effettuare il login")
  }
  
  const callerUser = await db.query.users.findFirst({
    where: { userName: callerUserName }
  })
  
  if (!callerUser || !callerUser.isAdmin){
    return res.status(403).send("Non autorizzato")
  }

  const query = req.query as { tab?: string }
  const activeTab = query.tab || "users"

  const [allUsers, allProducts, allOrders] = await Promise.all([
    db.select().from(users),
    db.select().from(products),
    db.select().from(orders),
  ])

  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0)
  const pendingOrders = allOrders.filter(o => o.status === "pending").length

  const ordersWithDetails: OrderWithDetails[] = allOrders.map(order => {
    const user    = allUsers.find(u => u.id === order.userId)
    const product = allProducts.find(p => p.id === order.productId)
    return {
      ...order,
      userName:    user    ? `${user.name} ${user.lastName}` : "Utente rimosso",
      productName: product?.productName ?? "Prodotto rimosso",
    }
  })

  const html = (
    <MainLayout>
      <AdminDashboard
        activeTab={activeTab}
        allUsers={allUsers}
        allProducts={allProducts}
        allOrders={allOrders}
        ordersWithDetails={ordersWithDetails}
        totalRevenue={totalRevenue}
        pendingOrders={pendingOrders}
      />
    </MainLayout>
  )
  return res.type("text/html").send(html)
})



  server.get("/banned", async (req, reply) => {
    return reply.html(
    
    <MainLayout>

        <BannedPage />

    </MainLayout>
  )
  })


  server.get("/profile", async (req, res) => {
    if (!req.session.username) return res.redirect("/")

    const query = req.query as { tab?: string }
    const activeTab = query.tab || "products"

    if (req.session.sessionToken) {
      const [user] = await db.select().from(users).where(eq(users.session, req.session.sessionToken)).limit(1)
      if (user?.hasUnseenModeration) {
        await db.update(users).set({ hasUnseenModeration: false }).where(eq(users.id, user.id))
      }

    const isHtmx = req.headers["hx-request"] === "true"

    if (isHtmx) {
      return res.html(
        await ProfilePage({ username: req.session.username, sessionUsername: req.session.username, activeTab })
      )
    }

    return res.html(
      <MainLayout>
        {await ProfilePage({ username: req.session.username, sessionUsername: req.session.username, activeTab })}
      </MainLayout>
    )
    }
  })

  server.get("/checkout", async (req, res) => {
    if (!req.session.username) return res.redirect("/")

    const user = await db.query.users.findFirst({ where: { userName: req.session.username } })
    const cart = await db.query.cart.findMany({
      where: user ? { userId: user.id } : undefined,
      with: { cartItem: true },
    })

    return res.html(
      <MainLayout>
        <Checkout session={req.session} cart={cart} user={user} />
      </MainLayout>
    )
  })


  // routes/admin/orders.ts (o dove hai gli action routes)
  server.patch("/admin/orders/:id/status", async (request, reply) => {
    const callerUserName = request.session.username
    
    if (!callerUserName){
      return reply.status(401).send("Devi effettuare il login")
    }
    
    const callerUser = await db.query.users.findFirst({
      where: { userName: callerUserName }
    })
    
    if (!callerUser || !callerUser.isAdmin){
      return reply.status(403).send("Non autorizzato")
    }
    
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: "Stato non valido" });
    }

    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, Number(id)));

    // hx-swap="none" quindi non serve ritornare HTML
    return reply.status(200).send();
  });

  server.get("/checkout/payment", async (req, res) => {
    if (!req.session.username) return res.redirect("/")

    const user = await db.query.users.findFirst({ where: { userName: req.session.username } })
    const cartItems = await db.query.cart.findMany({
      where: user ? { userId: user.id } : undefined,
      with: { cartItem: true },
    })

    const totalAmountOrders = cartItems.reduce((acc, item) => {
      return acc + (item.cartItem?.price || 0) * (item.quantity || 1)
    }, 0)

    return res.html(
      <MainLayout>
        <Payment session={req.session} cart={cartItems} totalPrice={totalAmountOrders} />
      </MainLayout>
    )
  })

  server.get("/payment/accepted", async (_req, res) => {
    return res.html(
      <MainLayout>
        <PaymentAccepted />
      </MainLayout>
    )
  })

  server.get("/payment/declined", async (_req, res) => {
    return res.html(
      <MainLayout>
        <PaymentDeclined />
      </MainLayout>
    )
  })

  server.get("/product/:id", async (req, res) => {
    const { id } = req.params as { id: string }
    const productId = parseInt(id, 10)

    if (isNaN(productId)) return res.status(400).send("ID Prodotto non valido")

    try {
      const productRows = await db
        .select()
        .from(products)
        .leftJoin(users, eq(products.userId, users.id))
        .where(eq(products.id, productId))
        .limit(1)

      const result = productRows[0]
      if (!result) return res.status(404).send("Prodotto non trovato o non più disponibile")

      const product = {
        ...result.products,
        seller: result.users ? {
          userName: result.users.userName,
          name: result.users.name,
          lastName: result.users.lastName,
        } : undefined,
      }

      return res.status(200).html(
        <MainLayout>
          <ProductInfoPage product={product} session={req.session} />
        </MainLayout>
      )
    } catch (error) {
      server.log.error(error)
      return res.status(500).send("Errore interno durante il caricamento dei dettagli del prodotto")
    }
  })
}