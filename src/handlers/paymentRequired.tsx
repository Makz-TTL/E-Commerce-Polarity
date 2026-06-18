import { FastifyRequest, FastifyReply } from "fastify"
import MainLayout from "../client/layouts/MainLayout"

export default (server: any) => {
  server.setPaymentRequiredHandler(renderPaymentRequired)
}

export function renderPaymentRequired(_req: FastifyRequest, reply: FastifyReply) {
  return reply.status(402).html(
    <MainLayout title="402 - Payment Required">
      <div class="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center bg-white antialiased font-sans">
        <h1 class="text-[120px] font-black text-indigo-600/15 leading-none select-none">402</h1>
        
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight -mt-4">
          Payment required
        </h2>
        
        <p class="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
          This content or feature requires an active subscription or a completed payment to be accessed.
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