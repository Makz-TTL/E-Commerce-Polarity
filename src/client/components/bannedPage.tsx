export default function BannedPage() {
  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div class="text-center max-w-sm">

        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" class="text-red-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 class="text-xl font-semibold text-gray-900 mb-2">Account sospeso</h1>
        <p class="text-sm text-blue-500 leading-relaxed mb-8">
          Il tuo account è stato sospeso dall'amministrazione.<br />
          Se pensi che si tratti di un errore, contatta il supporto.
        </p>
        <a
        
          href="https://www.youtube.com/watch?v=fhb69IVXy6E"
          target="_blank"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Fai qualcos'altro
        </a>
        <br />
        <br />
        <a
        
          href="/marketplace"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Vai alla home, sempre se ti hanno sbloccato.
        </a>

      </div>
    </div>
  )
}