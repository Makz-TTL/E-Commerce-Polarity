import env from "./utils/env"
import { join } from "path"
import { buildSync } from "esbuild"
import { execSync } from "child_process"

/* Fastify plugins */
import Fastify from "fastify"
import fastifyHtml from "@kitajs/fastify-html-plugin"
import { validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod"
import fastifySession from "@fastify/session"
import fastifyCookie from "@fastify/cookie"
import fastifyMultipart from "@fastify/multipart"
import fastifyStatic from "@fastify/static"
import fastifyFormbody from "@fastify/formbody"

/* Router */
import viewsRouter from "./client/routers/viewsRouter"
import partialsRouter from "./client/routers/partialsRouter"
import actionsRouter from "./client/routers/actionsRouter"

/* Error/404 handlers */
import notFoundHandler from "./handlers/notFound"
import errorHandler from "./handlers/error"

const server = Fastify()
  .withTypeProvider<ZodTypeProvider>()
  .setValidatorCompiler(validatorCompiler)

/* Plugins registration */
server.register(fastifyCookie)
server.register(fastifySession, {
  secret: env.SESSION_SECRET,
  cookie: { secure: false },
})
server.register(fastifyHtml)
server.register(fastifyMultipart)
server.register(fastifyFormbody)
server.register(fastifyStatic, {
  root: join(import.meta.dirname, "..", "public"),
  prefix: "/public/",
})

notFoundHandler(server)
errorHandler(server)

/* Routes */
viewsRouter(server)
partialsRouter(server)
actionsRouter(server)

/**
 * Builds the client TypeScript on the fly with esbuild and serves it as JS.
 * In production, use the "build:client" script and serve the static file.
 */
server.get("/live-script", (_req, reply) => {
  const result = buildSync({
    entryPoints: [join(import.meta.dirname, "client", "scripts", "index.ts")],
    bundle: true,
    minify: true,
    write: false,
    format: "esm",
  })

  const script = result.outputFiles[0].text
  return reply.type("application/javascript").send(script)
})

/**
 * Builds Tailwind CSS on the fly by scanning project files.
 * In production, pre-build and serve as a static file.
 */
server.get("/live-style", (_req, reply) => {
  const input = join(import.meta.dirname, "client", "styles", "index.css")
  const bin = join(import.meta.dirname, "..", "node_modules", ".bin", "tailwindcss")
  const css = execSync(`${bin} -i ${input} --minify`, {
    encoding: "utf-8",
  })

  return reply.type("text/css").send(css)
})

server.listen({ port: +env.PORT, host: "0.0.0.0" })
console.log(`
App is listening on port ${env.PORT}
Try http://localhost:${env.PORT}
`)
