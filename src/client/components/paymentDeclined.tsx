export default function PaymentDeclined(){

    return(

        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-6 w-full max-w-md text-center">

                {/* Icona errore */}
                <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10 text-red-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                </div>

                {/* Testo */}
                <div class="flex flex-col gap-2">
                <h1 class="text-2xl font-extrabold text-gray-900">Pagamento rifiutato</h1>
                <p class="text-sm text-gray-500 leading-relaxed">
                    Si è verificato un problema con il tuo pagamento.<br/>
                    Verifica i dati della carta e riprova.
                </p>
                </div>

                {/* Bottoni */}
                <div class="flex flex-col gap-3 w-full">
                <a href="/checkout/payment" class="w-full">
                    <button class="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl text-sm shadow-sm transition-colors cursor-pointer">
                    Riprova
                    </button>
                </a>
                <a href="/" class="w-full">
                    <button class="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                    Torna al marketplace
                    </button>
                </a>
                </div>

            </div>
        </div>

    );

}