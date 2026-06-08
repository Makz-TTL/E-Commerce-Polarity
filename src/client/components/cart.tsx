import { db } from "../../db"
import { Session } from "fastify"


type cartProps = {
  session?: Session
}

export default async function Cart({ session } : cartProps) {

    const user = await db.query.users.findFirst({
        where: { userName: session?.username }
    })

    const orders = await db.query.orders.findMany({
        where: user ? { userId: user.id } : undefined,
        with: {
            product: true,
        }
    })

    return (

        <div class="container mx-auto p-4">

            <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16 items-center">

                    <div class="flex-shrink-0 flex items-center">
                    <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        TechStore
                    </a>
                    </div>

                    <div class="flex items-center gap-4">
                    <button hx-get="/cart-preview" hx-target="#cart-drawer" hx-swap="innerHTML" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                    </button>

                    <span class="h-6 w-px bg-gray-200"></span>

                    <div id="profile-section">
                        {session?.username ? (
                        <div class="flex items-center gap-3">
                            <span class="text-sm font-medium text-gray-700">
                            Ciao, <strong class="text-indigo-600">{session.username}</strong>
                            </span>
                            <button
                            class="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                            onclick="document.getElementById('confirm-logout-modal').classList.remove('hidden')"
                            >
                            Disconnetti
                            </button>
                        </div>
                        ) : (
                        <div class="flex items-center gap-2">
                            <button hx-get="/login-modal" hx-target="#modal" hx-swap="innerHTML" class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer">
                            Log In
                            </button>
                            <button hx-get="/signup-modal" hx-target="#modal" hx-swap="innerHTML" class="inline-flex items-center justify-center text-sm font-semibold py-2.5 px-6 rounded-xl border-2 border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer">
                            Sign Up
                            </button>
                        </div>
                        )}
                    </div>
                    </div>

                </div>
                </div>
            </nav>

            <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 px-6 pt-8 max-w-7xl mx-auto">
                Carrello di {session?.username ? session.username : "utente"}
            </h1>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 flex flex-col gap-4">

                <div class="flex flex-col gap-4 mt-3">
                {orders.map((order) => (
                    <div class="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">

                        {/* Info prodotto */}
                        <div class="flex-1 min-w-0">
                            <h2 class="text-lg font-bold text-gray-900 truncate">{order.product?.productName}</h2>
                            <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">{order.product?.description}</p>
                            <span class="inline-block mt-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {order.product?.category}
                            </span>
                        </div>

                        {/* Quantità */}
                        <div class="flex flex-col items-center gap-1">
                            <span class="text-xs text-gray-400 font-medium">Quantità</span>
                            <span class="text-lg font-bold text-gray-800">{order.quantity}</span>
                        </div>

                        {/* Prezzo */}
                        <div class="flex flex-col items-end gap-1 min-w-[80px]">
                            <span class="text-xs text-gray-400 font-medium">Totale</span>
                            <span class="text-xl font-extrabold text-indigo-600">${order.totalPrice}</span>
                        </div>

                        {/* Rimuovi */}
                        <button
                            hx-post={`/deleteFromCart/${order.id}`}
                            hx-swap="outerHTML"
                            hx-target="closest div.flex.items-center"
                            class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>

                    </div>
                ))}

                {orders.length === 0 && (
                    <div class="text-center py-20 text-gray-400">
                    <p class="text-xl font-semibold">Il carrello è vuoto</p>
                    <a href="/" class="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium">
                        Torna al marketplace
                    </a>
                    </div>
                )}
                </div>

            </div>

            
            

        </div>

    );


}