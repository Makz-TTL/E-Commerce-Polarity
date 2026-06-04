import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"
import { FastifyError } from "fastify"

export default (server: ZodFastifyInstance) => {
  server.setErrorHandler((error: FastifyError, _req, reply) => {
    console.error("[ERROR]", error.message)
    
    return reply.status(400).html(
      <MainLayout title="Payment Error">
        <div class="container">
          <h1>{error.statusCode ?? 400}</h1>
          <p>{error.message || "Payment not processed."}</p>
          <a href="/">Back to homepage</a>
        </div>
      </MainLayout>
    )
  })
}
