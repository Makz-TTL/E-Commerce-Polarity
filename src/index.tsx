import env from "./utils/env"
import path, { join } from "path"
import { buildSync } from "esbuild"
import { execSync } from "child_process"
import Fastify from "fastify"
import fastifyHtml from "@kitajs/fastify-html-plugin"
import { validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod"
import fastifySession from "@fastify/session"
import fastifyCookie from "@fastify/cookie"
import fastifyMultipart from "@fastify/multipart"
import fastifyFormbody from "@fastify/formbody"
import { drizzle } from "drizzle-orm/node-postgres"
import { eq, and, gt } from "drizzle-orm"

import { sessions } from "./db/schema"
import viewsRouter from "./client/routers/viewsRouter"
import partialsRouter from "./client/routers/partialsRouter"
import actionsRouter from "./client/routers/actionsRouter"
import notFoundHandler from "./handlers/notFound"
import registerGlobalErrorHandler from "./handlers/globalErrorHandler"

import { users } from "./db/schema"

type UserSelect = typeof users.$inferSelect

declare module "@fastify/session" {
  interface FastifySessionObject {
    sessionToken?: string
    username?: string
    isAdmin: boolean
    tempUserData?: {
      name: string
      lastName: string
      userName: string
      eMail: string
      passwordHash: string
      code: string
  
    }
  }
}

declare module "fastify" {
  interface FastifyRequest {
    currentUser?: UserSelect
  }
}

export const db = drizzle({
  connection: {
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    host: "localhost",
    port: 5432
  }
})

export const sessionStore = {
  get: async (sid: string, cb: Function) => {
    try {
      const result = await db
        .select({ sess: sessions.sess })
        .from(sessions)
        .where(
          and(
            eq(sessions.sid, sid),
            gt(sessions.expire, new Date())
          )
        )
      cb(null, result[0]?.sess ?? null)
    } catch (e) {
      cb(e)
    }
  },

  set: async (sid: string, session: any, cb: Function) => {
    try {
      const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      
      await db
        .insert(sessions)
        .values({
          sid: sid,
          sess: session,
          expire: expire,
        })
        .onConflictDoUpdate({
          target: sessions.sid,
          set: { 
            sess: session, 
            expire: expire 
          },
        })
        
      cb(null)
    } catch (e) {
      cb(e)
    }
  },

  destroy: async (sid: string, cb: Function) => {
    try {
      await db.delete(sessions).where(eq(sessions.sid, sid))
      cb(null)
    } catch (e) {
      cb(e)
    }
  },
}

const server = Fastify({ allowErrorHandlerOverride: false })
  .withTypeProvider<ZodTypeProvider>()
  .setValidatorCompiler(validatorCompiler)

server.register(fastifyCookie)
server.register(fastifySession, {
  secret: env.SESSION_SECRET,
  cookie: { 
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 
  },
  store: sessionStore as any,
})
server.register(fastifyHtml)
server.register(fastifyMultipart)
server.register(fastifyFormbody)

await server.register(import("@fastify/static"), {
  root: path.join(process.cwd(), "public"),
  prefix: "/",
})

viewsRouter(server)
partialsRouter(server)
actionsRouter(server)

notFoundHandler(server)
registerGlobalErrorHandler(server)

server.get("/live-script", (_req, reply) => {
  const result = buildSync({
    entryPoints: [join(import.meta.dirname, "client", "scripts", "index.ts")],
    bundle: true,
    minify: true,
    write: false,
    format: "esm",
  })
  return reply.type("application/javascript").send(result.outputFiles[0].text)
})

server.get("/live-style", (_req, reply) => {
  const input = join(import.meta.dirname, "client", "styles", "index.css")
  const bin = join(import.meta.dirname, "..", "node_modules", ".bin", "tailwindcss")
  const css = execSync(`"${bin}" -i "${input}" --content "./src/**/*.{ts,tsx}" --minify`, {
    encoding: "utf-8",
    cwd: join(import.meta.dirname, "..", ".."),
  })
  return reply.type("text/css").send(css)
})

server.listen({ port: +env.PORT, host: "0.0.0.0" })
console.log(`\nApp is listening on port ${env.PORT}\nTry http://localhost:${env.PORT}\n`)