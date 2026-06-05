import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"
import { FastifyError } from "fastify"

export default (server: ZodFastifyInstance) => {
  
  server.setErrorHandler((error: FastifyError, _req, reply) => {
    console.error("[ERROR]", error.message)

    
    if (error.statusCode === 403) {
      return reply.status(403).html(
        <MainLayout title="Forbidden">
          <div class="container">
            <h1>403</h1>
            <p>{error.message || "Forbidden."}</p>
            <a href="/">Back to homepage</a>
          </div>
        </MainLayout>
      )
    }


    return reply.status(error.statusCode ?? 500).send({
      statusCode: error.statusCode ?? 500,
      error: error.name,
      message: error.message
    })
  })
}
