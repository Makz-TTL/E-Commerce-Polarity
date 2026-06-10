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
                <h2 class="text-lg font-bold text-gray-700">Pagamento</h2>

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
                </div>

                {/* Nome sulla carta */}
                <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome sulla carta</label>
                <input
                    type="text"
                    placeholder="Mario Rossi"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                </div>

                {/* Scadenza e CVV */}
                <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scadenza</label>
                    <input
                    type="text"
                    name = "expiry"
                    placeholder="MM/AA"
                    maxlength="5"
                    oninput="this.value = this.value.replace(/[^0-9]/g,'').replace(/^(.{2})(.+)$/,'$1/$2')"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
                <div class="flex flex-col gap-1 w-24">
                    <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">CVV</label>
                    <input
                    type="password"
                    placeholder="•••"
                    maxlength="3"
                    oninput="this.value = this.value.replace(/[^0-9]/g,'')"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
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
                    hx-include="#formData"
                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
                >
                    Paga
                </button>
                </div>

            </div>
            </div>

    );

}