export default function PaymentAccepted(){

    return(

        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-6 w-full max-w-md text-center">

                {/* Icona successo */}
                <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-10 h-10 text-green-500">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                </div>

                {/* Testo */}
                <div class="flex flex-col gap-2">
                <h1 class="text-2xl font-extrabold text-gray-900">Pagamento accettato!</h1>
                <p>
                    Ti abbiamo inviato una mail di conferma ordine.</p>
                <p  class="text-sm text-gray-500 leading-relaxed">
                    Grazie per aver acquistato da TechStore.
                </p>
                </div>

                {/* Bottone */}
                <a href="/" class="w-full">
                <button class="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl text-sm shadow-sm transition-colors cursor-pointer">
                    Torna al marketplace
                </button>
                </a>

            </div>
        </div>

    );

}