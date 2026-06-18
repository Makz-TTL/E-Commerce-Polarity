import { db } from "../../db"
import { Session } from "fastify"
import { products } from "../../db/schema"
import { getCartCount } from "../helpers/cartCounter"
import Navbar from "./Navbar"

type cartProps = {
  session?: Session
}

export default async function Cart({ session } : cartProps) {

    const user = await db.query.users.findFirst({
        where: { userName: session?.username }
    })


    const rawCartProducts = await db.query.cart.findMany({
        where: user ? { userId: user.id } : undefined,
        with: {
            cartItem: true,
        }
    })

    // Filtra in JS: tieni solo gli elementi in cui il prodotto esiste E NON è disabilitato
    const cartProducts = rawCartProducts.filter((item) => {
        return item.cartItem && item.cartItem.isDisable === false;
    });

    const cartCount = await getCartCount(session?.username)
    
    // FUNZIONE PER IL CALCOLO DEL TOTALE
    const totalCart = cartProducts.reduce((sum, item) => {
    // Estrai il prezzo del prodotto (fallo diventare un numero per sicurezza)
    const price = item.cartItem?.price ? Number(item.cartItem.price) : 0;
    
    // Estrai la quantità dal carrello (se non esiste, di base è 1)
    const quantity = item.quantity ? Number(item.quantity) : 1;
    
    // Moltiplica prezzo per quantità e aggiungilo al totale parziale
    return sum + (price * quantity);
    }, 0);

    return (
        <div class="bg-gray-50/50 min-h-screen pb-12">

            {/* Navbar a tutta larghezza identica al Marketplace */}
            <Navbar currentUser={user} session={session} cartCount={cartCount} />

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
                        
                        const availableStock = order.cartItem?.stock ?? 0
                        const hasStockIssue = order.quantity > availableStock

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
                                        max={order.cartItem?.stock ?? 99}
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
                                    hx-target="closest .order-item-card"
                                    hx-swap="outerHTML swap:0.2s"
                                    class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0 cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 6H5m9.5 0V4.5A1.5 1.5 0 0 0 13 3h-2a1.5 1.5 0 0 0-1.5 1.5V6" />
                                        
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l1.24 13.64A2 2 0 0 0 9.23 21h5.54a2 2 0 0 0 1.99-1.36L18 6" />
                                        
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 11v6M14 11v6" />
                                    </svg>
                                </button>

                                {hasStockIssue && (
                                    <div class="flex items-center gap-2 text-amber-700 bg-amber-100 rounded-xl px-3 py-2 text-sm font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                        </svg>
                                        {availableStock === 0 ? (
                                            <span>Prodotto non più disponibile. Rimuovilo dal carrello.</span>
                                        ) : (
                                            <span>Disponibili solo {availableStock} pezzi (richiesti {order.quantity}). Riduci la quantità.</span>
                                        )}
                                    </div>
                                )}


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