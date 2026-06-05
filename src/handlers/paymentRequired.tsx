import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"

// Keep your standard 404 handler attached to setNotFoundHandler
export default (server: any) => {
  server.setPaymentRequiredHandler(renderPaymentRequired)
}

export function renderPaymentRequired(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(402).html(
    <MainLayout title="402 - Payment Required">
      <div class="container">
        <h1>402</h1>
        <p>Payment required.</p>
        <a href="/">Back to homepage</a>
      </div>
    </MainLayout>
  )
}
