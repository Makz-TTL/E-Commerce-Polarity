import { env } from "process"
import z from "zod"
import { ZodFastifyInstance } from "../../types/index"
import Counter from "../components/Counter"
import ProfileSection from "../components/ProfileSection"
import LoginForm from "../components/LoginForm"


let count = 0

export default (server: ZodFastifyInstance) => {

  server.post("/count", (_req, reply) => {
    count++
    return reply.html(<Counter count={count} />)
  })

  server.post(
    "/login",
    {
      schema: {
        body: z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        }),
      },
    },
    (req, reply) => {
      const { username, password } = req.body

      if (password !== env.COMMON_PASSWORD) {
        return reply
          .html(
            <LoginForm
              values={{
                username,
                password,
              }}
              error={{
                password: "Password errata",
              }}
            />
          )
      }

      req.session.username = username
      return reply
        .headers({
          "HX-Reswap": "outerHTML",
          "HX-Retarget": "#profile-section",
          "HX-Trigger": JSON.stringify({ showSuccessToast: { message: "Ti sei loggato con successo" } }),
        })
        .html(<ProfileSection session={req.session} />)
    },
  )

  server.post("/logout", async (req, reply) => {
    await req.session.destroy()
    return reply.html(<ProfileSection session={req.session} />)
  })
}
