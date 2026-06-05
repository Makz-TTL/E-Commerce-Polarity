import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"
import { FastifyError } from "fastify"

export default (server: ZodFastifyInstance) => {
  
  server.setErrorHandler((error: FastifyError, _req, reply) => {
    console.error("[ERROR]", error.message)

    
    if (error.statusCode === 401) {
      return reply.status(401).html(
        <MainLayout title="Unauthorized">
          <div class="container">
            <h1>401</h1>
            <p>{error.message || "Unauthorized."}</p>
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
