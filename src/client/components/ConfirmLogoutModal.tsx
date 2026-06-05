import Modal from "./Modal"

export const confirmLogoutModalId = "confirm-logout-modal"

const ConfirmLogoutModal = () => {
  return (
    <div 
      id={confirmLogoutModalId} 
      class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop blur overlay */}
      <div 
        class="fixed inset-0 bg-gray-950/40 backdrop-blur-sm transition-opacity"
        onclick={`document.getElementById('${confirmLogoutModalId}').classList.add('hidden')`}
      ></div>

      {/* Modal Card */}
      <div class="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 transform transition-all scale-100 flex flex-col gap-4">
        
        {/* Header with Warning Icon */}
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </div>
          
          <div class="flex-1">
            <h3 class="text-lg font-bold text-gray-900 tracking-tight">
              Conferma logout
            </h3>
            <p class="text-sm text-gray-500 mt-1 leading-relaxed">
              Sei sicuro di voler effettuare il logout? Tutti i dati della sessione corrente andranno persi.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div class="flex items-center gap-3 justify-end mt-2">
          <button 
            type="button"
            class="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all cursor-pointer"
            onclick={`document.getElementById('${confirmLogoutModalId}').classList.add('hidden')`}
          >
            Annulla
          </button>
          <button 
            type="button"
            class="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-100 transition-all cursor-pointer"
            hx-post="/logout"
            onclick={`document.getElementById('${confirmLogoutModalId}').classList.add('hidden')`}
          >
            Conferma Logout
          </button>
        </div>

      </div>
    </div>
  )
}

export default ConfirmLogoutModal