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
                    {userProducts.map(product => (
                        <div class="flex items-center justify-between py-3 gap-4">
                            <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                                src={product.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'}
                                alt={product.productName}
                                class="w-full h-full object-cover"
                            />
                            </div>
                            <div class="flex-1">
                            <p class="font-medium text-gray-800">{product.productName}</p>
                            <p class="text-xs text-gray-400">{product.category} · Stock: {product.stock}</p>
                            </div>
                            <span class="text-indigo-600 font-bold">${product.price}</span>
                        </div>
                    ))}
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
                    {userOrders.map(order => (
                        <div class="flex items-center justify-between py-3 gap-4">
                            <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                                src={order.product?.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'}
                                alt={order.product?.productName || "Prodotto"}
                                class="w-full h-full object-cover"
                            />
                            </div>
                            <div class="flex-1">
                            <p class="font-medium text-gray-800">{order.product?.productName ?? "Prodotto eliminato"}</p>
                            <p class="text-xs text-gray-400">Quantità: {order.quantity}</p>
                            </div>
                            <span class="text-indigo-600 font-bold">${order.totalPrice}</span>
                        </div>
                    ))}
                    </div>
                )}
                </div>

            </div>
            <div id="modal"></div>
            <ConfirmLogoutModal />
        </div>
    )
}