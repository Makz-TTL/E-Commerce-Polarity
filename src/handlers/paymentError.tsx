import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"

export default (server: any) => {
  server.setPaymentErrorHandler( renderPaymentError)
}

export function renderPaymentError(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(400).html(
    <MainLayout title="400 - Payment Error">
      <div class="container">
        <h1>400</h1>
        <p>Payment not processed .</p>
        <a href="/">Back to homepage</a>
      </div>
    </MainLayout>
  )
}