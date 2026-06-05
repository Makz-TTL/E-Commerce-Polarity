import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"


export default (server: any) => {
  server.setrenderError(renderError)
}


export function renderError(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(500).html(
    <MainLayout title="500 - Internal Server Error">
      <div class="container">
        <h1>500</h1>
        <p>Internal server error.</p>
        <a href="/">Back to homepage</a>
      </div>
    </MainLayout>
  )
}
