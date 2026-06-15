import { Session } from "fastify"

type CheckoutProps = {
  session?: Session
  cart: {
    id: number
    userId: number
    productId: number
    quantity: number
    cartItem?: {         
      productName: string
      category: string
      price: number | string
      imageUrl?: string | null
    } | null
  }[]
  user?: { name: string; lastName: string } | null
}

export default function Checkout({ session, cart, user }: CheckoutProps) {

  const totalPrice = cart.reduce((sum, item) => {
    const price = item.cartItem?.price ? Number(item.cartItem?.price) : 0;
    const quantity = item.quantity ? Number(item.quantity) : 1;
    return sum + (price * quantity);
  }, 0);

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
        
        <div class="flex flex-col lg:flex-row gap-8">

          {/* Colonna sinistra - Riepilogo ordine */}
          <div class="flex-1 flex flex-col gap-4">
            <h2 class="text-[28px] font-bold text-gray-700">Riepilogo ordine</h2>

            {cart.map((order) => {
              // --- LOGICA DI PARSING PER L'IMMAGINE ---
              let productCover = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80";
              const rawImageUrl = order.cartItem?.imageUrl;

              if (rawImageUrl) {
                try {
                  const images = JSON.parse(rawImageUrl);
                  if (Array.isArray(images) && images.length > 0) {
                    productCover = images[0];
                  }
                } catch (e) {
                  // Fallback se la stringa contiene apici spuri o non è un JSON valido
                  productCover = rawImageUrl.replace(/^['"]|['"]$/g, '');
                }
              }

              return (
                <div class="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                  <img
                    src={productCover} // <-- Ora usa la stringa pulita estratta dal JSON
                    alt={order.cartItem?.productName}
                    class="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-bold text-gray-900 truncate">{order.cartItem?.productName}</h3>
                    <span class="inline-block mt-1 bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {order.cartItem?.category}
                    </span>
                  </div>
                  <div class="flex flex-col items-center gap-0.5">
                    <span class="text-xs text-gray-400">Qtà</span>
                    <span class="text-sm font-bold text-gray-800">{order.quantity}</span>
                  </div>
                  <div class="flex flex-col items-end gap-0.5 min-w-[70px]">
                    <span class="text-xs text-gray-400">Totale</span>
                    <span class="text-[16px] font-bold text-black-600">
                      €{((Number(order.cartItem?.price) || 0) * (Number(order.quantity) || 1)).toLocaleString("it-IT")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Colonna destra - Form + totale */}
          <div class="lg:w-96 flex flex-col gap-6">

            {/* Indirizzo di spedizione */}
            <div id="checkout-section" class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
              <h2 class="text-lg font-bold text-gray-700">Indirizzo di spedizione</h2>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome completo *</label>
                <input
                    type="text"
                    value={user ? `${user.name} ${user.lastName}` : ""}
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                    name="fullName"
                    oninput="this.style.borderColor=''"
                />
                <div id="error-fullName"></div>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Indirizzo *</label>
                <input
                  type="text"
                  placeholder="Via Roma 1"
                  class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                  name="address"
                  oninput="this.style.borderColor=''"
                />
                <div id="error-address"></div>
              </div>

              <div class="flex gap-3">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Città *</label>
                  <input
                    type="text"
                    placeholder="Milano"
                    class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                    name="city"
                    oninput="this.style.borderColor=''"
                  />
                  <div id="error-city"></div>
                </div>
                <div class="flex flex-col gap-1 w-24">
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">CAP *</label>
                  <input
                      type="text"
                      placeholder="20100"
                      maxlength={5}
                      inputmode="numeric"
                      pattern="[0-9]*"
                      class="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      required
                      name="cap"
                      oninput={`
                          this.style.borderColor='';
                          this.value = this.value.replace(/[^0-9]/g, '');
                      `}
                      onkeydown={`
                          if (['e','E','+','-','.',','].includes(event.key)) event.preventDefault();
                      `}
                  />
                  <div id="error-cap"></div>
                </div>
              </div>
            </div>

            {/* Totale e CTA */}
            <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">

              <div class="flex flex-col gap-2 text-sm text-gray-600">
                <div class="flex justify-between">
                  <span>Prodotti ({cart.reduce((sum, o) => sum + o.quantity, 0)})</span>
                  <span class="font-semibold">€{totalPrice.toLocaleString("it-IT")}</span>
                </div>
                <div class="flex justify-between">
                  <span>Spedizione</span>
                  <span class="font-semibold text-green-600">Gratuita</span>
                </div>
                <div class="border-t border-gray-100 pt-2 flex justify-between text-base text-gray-900">
                  <span>Totale</span>
                  <span class="text-[22px] font-bold text-indigo-600">€{totalPrice.toLocaleString("it-IT")}</span>
                </div>
              </div>

              <button
                hx-get="/checkout/validate"
                hx-include="#checkout-section [name]"
                hx-swap="none"
                class="inline-flex items-center gap-2 justify-center w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-6 rounded-xl shadow-sm transition-colors cursor-pointer text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                Checkout
              </button>

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