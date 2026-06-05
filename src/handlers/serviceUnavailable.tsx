import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"

// Keep your standard 404 handler attached to setNotFoundHandler
export default (server: any) => {
  <server className="set"></server>(renderServiceUnavailable)
}

export function renderServiceUnavailable(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(502).html(
    <MainLayout title="502 - Service Unavailable">
      <div class="container">
        <h1>502</h1>
        <p>Service unavailable.</p>
        <a href="/">Back to homepage</a>
      </div>
    </MainLayout>
  )
}