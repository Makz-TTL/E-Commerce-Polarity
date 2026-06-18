import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"

export default (server: any) => {
  server.setNotFoundHandler(renderNotFound)
}

export function renderNotFound(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(404).html(
    <MainLayout title="404 - Not Found">
      <div class="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center bg-white antialiased font-sans">
        <h1 class="text-[120px] font-black text-indigo-600/15 leading-none select-none">404</h1>
        
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight -mt-4">
          Page not found
        </h2>
        
        <p class="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
          The page you are looking for doesn't exist or has been moved to another URL.
        </p>
        
        <a 
          href="/" 
          class="mt-8 inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm transition-all duration-150"
        >
          Back to homepage
        </a>
      </div>
    </MainLayout>
  )
}