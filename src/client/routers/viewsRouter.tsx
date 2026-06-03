import { ZodFastifyInstance } from "../../types/index"
import Counter from "../components/Counter"
import ProfileSection from "../components/ProfileSection"
import MainLayout from "../layouts/MainLayout"


let count = 0

export default (server: ZodFastifyInstance) => {
  server.get("/", (req, reply) => {
    return reply.html(
      <MainLayout>
        <div class="max-w-3xl mx-auto p-8">
          <h1 class="text-3xl font-bold mb-6">Homepage</h1>

          <div class="flex items-center gap-4">
            <Counter count={count} />
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800"
              hx-post="/count"
              hx-target="#counter"
              hx-swap="outerHTML"
            >
              +1
            </button>
          </div>

          <hr class="my-8" />

          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800"
            hx-get="/modal"
            hx-target="#modal"
            hx-swap="innerHTML"
          >
            Apri modale
          </button>

          <hr class="my-8" />

          <ProfileSection session={req.session} />
        </div>
      </MainLayout>,
    )
  })
}
