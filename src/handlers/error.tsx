import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"

export default (server: any) => {
  server.setrenderError(renderError)
}

export function renderError(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(500).html(
    <MainLayout title="500 - Internal Server Error">
      <div class="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center bg-white antialiased font-sans">
        <h1 class="text-[120px] font-black text-indigo-600/15 leading-none select-none">500</h1>
        
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight -mt-4">
          Internal server error
        </h2>
        
        <p class="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
          Something went wrong on our end. We are looking into it and will have it fixed shortly.
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