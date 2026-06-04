import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"
import { FastifyError } from "fastify"

export default (server: ZodFastifyInstance) => {
  server.setErrorHandler((error: FastifyError, _req, reply) => {
    console.error("[ERROR]", error.message)
    
    return reply.status(503).html(
      <MainLayout title="Service Unavailable">
        <div class="container">
          <h1>{error.statusCode ?? 503}</h1>
          <p>{error.message || "Service unavailable."}</p>
          <a href="/">Back to homepage</a>
        </div>
      </MainLayout>
    )
  })
}
