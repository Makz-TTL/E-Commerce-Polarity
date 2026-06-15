import { db } from "../../db"
import { Session } from "fastify"
import { products } from "../../db/schema"

type cartProps = {
  session?: Session
}

export default async function Cart({ session } : cartProps) {

    const user = await db.query.users.findFirst({
        where: { userName: session?.username }
    })

    const cartProducts = await db.query.cart.findMany({
        where: user ? { userId: user.id } : undefined,
        with: {
            cartItem: true,
        }
    })


    // FUNZIONE PER IL CALCOLO DEL TOTALE
    const totalCart = cartProducts.reduce((sum, item) => {
    // 1. Estrai il prezzo del prodotto (fallo diventare un numero per sicurezza)
    const price = item.cartItem?.price ? Number(item.cartItem.price) : 0;
    
    // 2. Estrai la quantità dal carrello (se non esiste, di base è 1)
    const quantity = item.quantity ? Number(item.quantity) : 1;
    
    // 3. Moltiplica prezzo per quantità e aggiungilo al totale parziale
    return sum + (price * quantity);
    }, 0);

    return (
        <div class="bg-gray-50/50 min-h-screen pb-12">

            {/* Navbar a tutta larghezza identica al Marketplace */}
            <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16 items-center">

                        <div class="flex-shrink-0 flex items-center">
                            <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                TechStore
                            </a>
                        </div>

                        <div class="flex items-center gap-4">
                            <button onclick="window.location.href='/cart'" class="relative p-2.5 text-indigo-600 bg-gray-50 rounded-xl transition-all group">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 scale-105">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                            </button>

                            <div id="profile-section">
                                {session?.username ? (
                                    <div class="flex items-center gap-3">
                                        <span class="text-sm font-medium text-gray-700">
                                            Ciao, <strong class="text-indigo-600">{session.username}</strong>
                                        </span>
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

                            <span class="h-6 w-px bg-gray-200"></span>

                            {session?.username && (
                                <button onclick="window.location.href='/profile'" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </nav>

            {/* Contenuto della pagina allineato alla griglia del Marketplace */}
            <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 px-6 pt-8 max-w-7xl mx-auto">
                Il tuo carrello
            </h1>
            
            <div class="max-w-7xl mx-auto px-6 flex flex-col gap-4">
                <div class="flex flex-col gap-4 mt-3">
                    {cartProducts.map((order) => {
                        // Estrazione sicura della prima immagine del prodotto
                        let productCover = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                        if (order.cartItem?.imageUrl) {
                            try {
                                const images = JSON.parse(order.cartItem.imageUrl);
                                if (Array.isArray(images) && images.length > 0) {
                                    productCover = images[0];
                                }
                            } catch (e) {
                                productCover = order.cartItem.imageUrl;
                            }
                        }

                        return (
                            <div class="order-item-card flex items-center gap-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow">

                                {/* IMMAGINE PRODOTTO: Cliccabile, reindirizza alle info del prodotto */}
                                <div 
                                    onclick={`window.location.href='/product/${order.cartItem?.id}'`}
                                    class="w-20 h-20 bg-gray-50 overflow-hidden rounded-xl cursor-pointer shrink-0 group border border-gray-100"
                                >
                                    <img 
                                        src={productCover} 
                                        alt={order.cartItem?.productName} 
                                        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>

                                {/* INFO PRODOTTO: Titolo cliccabile, descrizione rimossa */}
                                <div class="flex-1 min-w-0">
                                    <h2 
                                        onclick={`window.location.href='/product/${order.cartItem?.id}'`}
                                        class="text-lg font-bold text-gray-900 truncate hover:text-indigo-600 cursor-pointer transition-colors"
                                    >
                                        {order.cartItem?.productName}
                                    </h2>
                                    <span class="inline-block mt-1 bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                                        {order.cartItem?.category}
                                    </span>
                                </div>

                                {/* SELETTORE QUANTITÀ: Input numerico diretto per scegliere quanti acquistarne */}
                                <div class="flex flex-col items-center gap-1.5">
                                    <span class="text-xs text-gray-400 font-medium">Quantità</span>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={order.quantity.toString()}
                                        min="1"
                                        max={order.cartItem?.stock || 99}
                                        hx-include="this"
                                        hx-post={`/updateCartQuantity/${order.id}`}
                                        hx-trigger="change, keyup delay:500ms changed"
                                        hx-target="this"
                                        hx-swap="none"
                                        oninput={`
                                            const max = parseInt(this.max);
                                            if (this.value !== '' && parseInt(this.value) > max) this.value = max;
                                        `}
                                        onblur={`
                                            if (this.value === '' || parseInt(this.value) < 1) this.value = '1';
                                        `}
                                        class="w-16 text-center border border-gray-200 rounded-xl bg-gray-50 py-1.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                                    />
                                </div>

                                <div class="flex flex-col items-end gap-1 min-w-[80px]">
                                    <span class="text-xs text-gray-400 font-medium">Totale item</span>
                                    <span id={`item-total-${order.id}`} class="text-xl font-semibold text-black-600">${((Number(order.cartItem?.price) || 0) * (Number(order.quantity) || 1)).toLocaleString("it-IT")}</span>
                                </div>

                                <button
                                    hx-post={`/deleteFromCart/${order.id}`}
                                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        )
                    })}

                    {cartProducts.length === 0 && (
                        <div class="flex flex-col items-center justify-center py-20 text-center">
                            <div class="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-5 relative">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-10 h-10 text-indigo-400">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                </svg>
                                <span class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-indigo-100 flex items-center justify-center text-indigo-400 text-sm font-bold">?</span>
                            </div>

                            <h2 class="text-lg font-bold text-gray-900 mb-1">Il carrello è vuoto</h2>
                            <p class="text-sm text-gray-400 mb-6">Non hai ancora aggiunto nessun prodotto</p>

                            <a href="/marketplace">
                                <button class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                                Vai al marketplace
                                </button>
                            </a>
                        </div>
                    )}

                    {cartProducts.length > 0 && (
                        <div class="flex justify-start mt-2">
                            <a href="/checkout" class="block w-fit">
                                <button class="inline-flex items-center gap-2 justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer">
                                    Procedi all'ordine
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                            </a>
                            <p class="ml-auto text-[18px] font-medium text-gray-700">Totale carrello: <span id="cart-total" class="text-[22px] font-bold">${totalCart.toLocaleString("it-IT")}</span></p>
                        </div>
                    )}
                </div>
            </div>

            <div id="modal"></div>
        </div>
    )
}