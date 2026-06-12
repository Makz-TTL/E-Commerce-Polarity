import { db } from "../../db"
import { eq } from "drizzle-orm"
import { users, products, orders } from "../../db/schema"
import ConfirmLogoutModal from "./ConfirmLogoutModal"

type Props = {
    username: string
}

export default async function PorfilePage({ username }: Props) {
    const [user] = await db.select().from(users).where(eq(users.userName, username))

    const userProducts = await db.select().from(products).where(eq(products.userId, user.id))

    const userOrders = await db.query.orders.findMany({
        where: {
            userId: user.id
        },
        with: {
            product: true
        }
    })

    return(
        <div class="bg-gray-50 min-h-screen pb-12">

            {/* Header profilo */}
            <div class="bg-white border-b border-gray-100 shadow-sm">
                <a href="/" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors px-6 pt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Torna alla home
                </a>
                <div class="max-w-5xl mx-auto px-6 py-8 flex items-center gap-6">
                <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                    {user.name[0].toUpperCase()}
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">{user.name} {user.lastName}</h1>
                    <p class="text-gray-500 text-sm">@{user.userName}</p>
                    <p class="text-gray-400 text-xs mt-1">{user.eMail}</p>
                </div>
                <div class="ml-auto flex items-center gap-3">
                    <button
                    hx-get="/edit-profile-modal"
                    hx-target="#modal"
                    hx-swap="innerHTML"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-semibold transition-colors"
                    >
                    Modifica profilo
                    </button>
                    <button
                      class="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                      onclick="document.getElementById('confirm-logout-modal').classList.remove('hidden')"
                    >
                      Logout
                    </button>
                </div>
                </div>
            </div>

            <div class="max-w-5xl mx-auto px-6 mt-8 space-y-8">

                {/* I miei prodotti */}
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center justify-between mb-5">
                    <h2 class="text-lg font-bold text-gray-800">I miei prodotti</h2>
                        <button
                        hx-get="/sell-product-modal"
                        hx-target="#modal"
                        hx-swap="innerHTML"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                        + Vendi prodotto
                        </button>
                </div>

                {userProducts.length === 0 ? (
                    <p class="text-gray-400 text-sm text-center py-6">Non hai ancora messo nessun prodotto in vendita.</p>
                ) : (
                    <div class="divide-y divide-gray-100">
                    {userProducts.map(product => {
                        // Parsing sicuro del JSON per estrarre la copertina all'indice 0
                        let coverImage = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                        if (product.imageUrl) {
                            try {
                                const images = JSON.parse(product.imageUrl);
                                if (Array.isArray(images) && images.length > 0) {
                                    coverImage = images[0];
                                }
                            } catch (e) {
                                coverImage = product.imageUrl; // fallback stringa nativa
                            }
                        }

                        // Gestione dinamica dello stato (Approvato, In revisione, In attesa, Rifiutato)
                        let statusColorClass = "bg-amber-400 ring-amber-50"
                        let statusText = "In attesa"

                        if (product.status === "reviewing") {
                            statusColorClass = "bg-blue-500 ring-blue-50 animate-pulse"
                            statusText = "In revisione"
                        } else if (product.status === "approved") {
                            statusColorClass = "bg-emerald-500 ring-emerald-50"
                            statusText = "Approvato"
                        } else if (product.status === "rejected") {
                            statusColorClass = "bg-red-500 ring-red-50"
                            statusText = "Rifiutato"
                        }

                        return (
                            <div class="flex items-center justify-between py-3 gap-4 product-item-row">
                                <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                <img
                                    src={coverImage}
                                    alt={product.productName}
                                    class="w-full h-full object-cover"
                                />
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <p class="font-medium text-gray-800">{product.productName}</p>
                                        
                                        {/* Indicatore di Stato con Tooltip su Hover */}
                                        <div class="relative group flex items-center cursor-help select-none">
                                            <span class={`w-2 h-2 rounded-full ${statusColorClass}`}></span>
                                            
                                            {/* Bolla del Tooltip */}
                                            <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap z-30 pointer-events-none transition-all">
                                                {statusText}
                                            </span>
                                        </div>
                                    </div>
                                    <p class="text-xs text-gray-400">{product.category} · Stock: {product.stock}</p>
                                </div>
                                
                                {/* Container Prezzo + Azioni di eliminazione */}
                                <div class="flex items-center gap-4">
                                    <span class="text-indigo-600 font-bold">${product.price}</span>

                                    {/* Bottone modifica */}
                                    <button
                                        hx-get={`/edit-product-modal/${product.id}`}
                                        hx-target="#modal"
                                        hx-swap="innerHTML"
                                        class="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                                        title="Modifica prodotto"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                                        </svg>
                                    </button>
                                    
                                    {/* Bottone elimina già esistente */}
                                    <button
                                        hx-delete={`/product/${product.id}`}
                                        hx-confirm="Sei sicuro di voler eliminare definitivamente questo annuncio?"
                                        hx-target="closest .product-item-row"
                                        hx-swap="delete"
                                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                        title="Elimina annuncio"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                )}
                </div>

                {/* I miei ordini */}
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 class="text-lg font-bold text-gray-800 mb-5">I miei ordini</h2>

                {userOrders.length === 0 ? (
                    <p class="text-gray-400 text-sm text-center py-6">Non hai ancora effettuato nessun ordine.</p>
                ) : (
                    <div class="divide-y divide-gray-100">
                    {userOrders.map(order => {
                        let orderCoverImage = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                        if (order.product?.imageUrl) {
                            try {
                                const images = JSON.parse(order.product.imageUrl);
                                if (Array.isArray(images) && images.length > 0) {
                                    orderCoverImage = images[0];
                                }
                            } catch (e) {
                                orderCoverImage = order.product.imageUrl;
                            }
                        }

                        // Gestione grafica del badge di stato dell'ordine
                        let orderStatusText = "In lavorazione"
                        let orderStatusClass = "bg-gray-100 text-gray-600 border-gray-200"

                        if (order.status === "not yet sent") {
                            orderStatusText = "Non ancora spedito"
                            orderStatusClass = "bg-amber-50 text-amber-700 border-amber-200"
                        } else if (order.status === "sent") {
                            orderStatusText = "Spedito"
                            orderStatusClass = "bg-blue-50 text-blue-700 border-blue-200"
                        } else if (order.status === "delivered") {
                            orderStatusText = "Consegnato"
                            orderStatusClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }

                        return (
                            <div class="flex items-center justify-between py-3 gap-4">
                                <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                <img
                                    src={orderCoverImage}
                                    alt={order.product?.productName || "Prodotto"}
                                    class="w-full h-full object-cover"
                                />
                                </div>
                                <div class="flex-1">
                                    <p class="font-medium text-gray-800">{order.product?.productName ?? "Prodotto eliminato"}</p>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <p class="text-xs text-gray-400">Quantità: {order.quantity}</p>
                                        <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${orderStatusClass}`}>
                                            {orderStatusText}
                                        </span>
                                    </div>
                                </div>
                                <span class="text-[#000000] font-bold">${order.totalPrice.toLocaleString("it-IT")}</span>
                            </div>
                        )
                    })}
                    </div>
                )}
                </div>

            </div>
            <div id="modal"></div>
            <ConfirmLogoutModal />
        </div>
    )
}