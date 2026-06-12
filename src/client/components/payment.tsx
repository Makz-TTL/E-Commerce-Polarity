import { Session } from "fastify"

type paymentProps = {

    session?: Session
    cart: {

        id: number
        userId: number
        productId: number
        quantity: number

    }[]
    totalPrice: number


}

export default function Payment({session, cart, totalPrice} : paymentProps){

    return(

        <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div id="formData" class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4 w-full max-w-md">
                <div class="flex items-center gap-2 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7 text-indigo-600">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <h1 class="text-2xl font-bold text-gray-900">Ultimo step</h1>
                </div>

                {/* Numero carta */}
                <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Numero carta</label>
                <input
                    name = "cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxlength="19"
                    oninput="this.value = this.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim()"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div id="error-cardNumber"></div>
                </div>

                {/* Nome sulla carta */}
                <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome sulla carta</label>
                <input
                    name = "nameOnTheCart"
                    type="text"
                    placeholder="Mario Rossi"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div id="error-nameOnTheCart"></div>
                </div>

                {/* Scadenza e CVV */}
                <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scadenza</label>
                    <input
                    name = "expiry"
                    type="text"
                    placeholder="MM/AA"
                    maxlength="5"
                    oninput="this.value = this.value.replace(/[^0-9]/g,'').replace(/^(.{2})(.+)$/,'$1/$2')"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <div id="error-expiry"></div>
                </div>
                <div class="flex flex-col gap-1 w-24">
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">CVV</label>
                    <input
                    name = "cvv"
                    type="password"
                    placeholder="•••"
                    maxlength="3"
                    oninput="this.value = this.value.replace(/[^0-9]/g,'')"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <div id="error-cvv"></div>
                </div>
                </div>

                {/* Totale */}
                <div class="border-t border-gray-100 pt-4 flex justify-between items-center">
                <span class="text-sm font-semibold text-gray-500">Totale da pagare</span>
                <span class="text-xl font-extrabold text-indigo-600">
                    ${totalPrice.toLocaleString("it-IT")}
                </span>
                </div>

                {/* Bottoni */}
                <div class="flex gap-3 mt-1">
                <a href="/checkout" class="flex-1">
                    <button class="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                    Annulla
                    </button>
                </a>
                <button
                    hx-post="/payment/confirm"
                    hx-swap="none"
                    hx-include="#formData [name]"
                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
                >
                    Acquista
                </button>
                </div>

                <div class="flex items-start gap-2 mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-gray-400 mt-0.5 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <p class="text-xs text-gray-400 leading-relaxed">
                        I tuoi dati di pagamento sono protetti e non vengono memorizzati. Utilizzando questo servizio accetti la nostra{" "}
                        <a href="#" class="text-indigo-500 hover:underline">Privacy Policy</a>.
                    </p>
                </div>

            </div>
            </div>

    );

}