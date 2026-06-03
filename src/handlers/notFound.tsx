import { ZodFastifyInstance } from "../types"
import MainLayout from "../client/layouts/MainLayout"

export default (server: ZodFastifyInstance) => {
  server.setNotFoundHandler((_req, reply) => {
    return reply.status(404).html(
      <MainLayout title="404 - Not Found">
        <div class="container">
          <h1>404</h1>
          <p>Page not found.</p>
          <a href="/">Back to homepage</a>
        </div>
      </MainLayout>
    )
  })
}
