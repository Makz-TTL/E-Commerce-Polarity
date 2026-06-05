import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"
import { FastifyError } from "fastify"

export default (server: ZodFastifyInstance) => {
  server.setNoAuthHandler((error: FastifyError, _req, reply) => {
    console.error("[ERROR]", error.message)
    
    return reply.status(401).html(
      <MainLayout title="Unauthorized">
        <div class="container">
          <h1>{error.statusCode ?? 401}</h1>
          <p>{error.message || "Unauthorized."}</p>
          <a href="/">Back to homepage</a>
        </div>
      </MainLayout>
    )
  })
}
