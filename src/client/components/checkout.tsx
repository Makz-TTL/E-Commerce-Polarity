import { Session } from "fastify"

type CheckoutProps = {
  session?: Session
  orders: {
    id: number
    userId: number
    productId: number
    quantity: number
    totalPrice: number
    product?: {
      id: number
      userId: number
      productName: string
      description: string | null
      category: string
      imageUrl: string | null
      price: number
      stock: number
    } | null
  }[]
  user?: { name: string; lastName: string } | null
}

export default function Checkout({ session, orders, user }: CheckoutProps) {

  const grandTotal = orders.reduce((sum, o) => sum + o.totalPrice, 0)

  return (
    <div class="bg-gray-50 min-h-screen">

      {/* Navbar */}
      <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              TechStore
            </a>
            <span class="text-sm text-gray-500 font-medium">Checkout sicuro 🔒</span>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Checkout</h1>

        <div class="flex flex-col lg:flex-row gap-8">

          {/* Colonna sinistra - Riepilogo ordine */}
          <div class="flex-1 flex flex-col gap-4">
            <h2 class="text-lg font-bold text-gray-700">Riepilogo ordine</h2>

            {orders.map((order) => (
              <div class="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                <img
                  src={order.product?.imageUrl || "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80"}
                  alt={order.product?.productName}
                  class="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-bold text-gray-900 truncate">{order.product?.productName}</h3>
                  <span class="inline-block mt-1 bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {order.product?.category}
                  </span>
                </div>
                <div class="flex flex-col items-center gap-0.5">
                  <span class="text-xs text-gray-400">Qtà</span>
                  <span class="text-sm font-bold text-gray-800">{order.quantity}</span>
                </div>
                <div class="flex flex-col items-end gap-0.5 min-w-[70px]">
                  <span class="text-xs text-gray-400">Totale</span>
                  <span class="text-base font-extrabold text-indigo-600">${order.totalPrice}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Colonna destra - Form + totale */}
          <div class="lg:w-96 flex flex-col gap-6">

            {/* Indirizzo di spedizione */}
            <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <h2 class="text-lg font-bold text-gray-700">Indirizzo di spedizione</h2>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome completo</label>
                <input
                    type="text"
                    value={user ? `${user.name} ${user.lastName}` : ""}
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Indirizzo</label>
                <input
                  type="text"
                  placeholder="Via Roma 1"
                  class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Città</label>
                  <input
                    type="text"
                    placeholder="Milano"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div class="flex flex-col gap-1 w-24">
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">CAP</label>
                  <input
                    type="text"
                    placeholder="20100"
                    maxlength={5}
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Totale e CTA */}
            <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <h2 class="text-lg font-bold text-gray-700">Totale</h2>

              <div class="flex flex-col gap-2 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Prodotti ({orders.reduce((sum, o) => sum + o.quantity, 0)})</span>
                  <span class="font-semibold">${grandTotal}</span>
                </div>
                <div class="flex justify-between">
                  <span>Spedizione</span>
                  <span class="font-semibold text-green-600">Gratuita</span>
                </div>
                <div class="border-t border-gray-100 pt-2 flex justify-between text-base font-extrabold text-gray-900">
                  <span>Totale</span>
                  <span class="text-indigo-600">${grandTotal}</span>
                </div>
              </div>

              <a href="/payment">

                <button
                    class="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-colors cursor-pointer text-sm">
                    Conferma ordine
                </button>

              </a>

              <a href="/cart" class="text-center text-xs text-gray-400 hover:text-indigo-500 hover:underline transition-colors">
                ← Torna al carrello
              </a>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}