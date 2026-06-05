import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"
import { FastifyError } from "fastify"

export default (server: ZodFastifyInstance) => {
  server.setForbiddenHandler((error: FastifyError, _req, reply) => {
    console.error("[ERROR]", error.message)
    
    return reply.status(403).html(
      <MainLayout title="Forbidden">
        <div class="container">
          <h1>{error.statusCode ?? 403}</h1>
          <p>{error.message || "Forbidden."}</p>
          <a href="/">Back to homepage</a>
        </div>
      </MainLayout>
    )
  })
}
