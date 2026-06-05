import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"


export default (server: any) => {
  server.setForbiddenHandler(renderForbidden)
}


export function renderForbidden(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(403).html(
    <MainLayout title="403 - Forbidden">
      <div class="container">
        <h1>403</h1>
        <p>Forbidden.</p>
        <a href="/">Back to homepage</a>
      </div>
    </MainLayout>
  )
}