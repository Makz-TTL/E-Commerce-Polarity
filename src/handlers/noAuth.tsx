import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"


export default (server: any) => {
  server.setNoAuthHandler(renderNoAuth)
}


export function renderNoAuth(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(401).html(
    <MainLayout title="401 - Unauthorized">
      <div class="container">
        <h1>401</h1>
        <p>Unauthorized.</p>
        <a href="/">Back to homepage</a>
      </div>
    </MainLayout>
  )
}
