import { db } from "../../db"
import { users } from "../../db/schema/users"
import { products } from "../../db/schema/products"
import { orders } from "../../db/schema/orders"

type User    = typeof users.$inferSelect
type Product = typeof products.$inferSelect
type Order   = typeof orders.$inferSelect

export type OrderWithDetails = Order & {
  userName: string
  productName: string
}

// ============================================================
// HELPERS GRAFICI (Utilizzano classi Tailwind)
// ============================================================

function stockColorClass(stock: number, max = 50): string {
  if (stock === 0) return "bg-red-500"
  if (stock / max < 0.2) return "bg-amber-500"
  return "bg-emerald-500"
}

function stockPct(stock: number, max = 50): number {
  return Math.min(100, Math.round((stock / max) * 100))
}

export function initials(name: string, lastName: string): string {
  return `${name[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

// Array di combinazioni Tailwind [Sfondo, Testo] per gli avatar
const AVATAR_TAILWIND_COLORS = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
]
export function avatarColorClass(i: number) {
  return AVATAR_TAILWIND_COLORS[i % AVATAR_TAILWIND_COLORS.length]
}

// Mappa degli stati con classi Tailwind
const statusBadge: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: "In attesa",  bg: "bg-amber-50",  text: "text-amber-800" },
  shipped:   { label: "Spedito",    bg: "bg-emerald-50", text: "text-emerald-800" },
  delivered: { label: "Consegnato", bg: "bg-teal-50",    text: "text-teal-800" },
  cancelled: { label: "Annullato",  bg: "bg-red-50",     text: "text-red-800" },
}

// ============================================================
// MODAL DETTAGLIO ORDINE (Iniettato da HTMX)
// ============================================================
export function OrderDetailModal({ order }: { order: OrderWithDetails }) {
  const badge = statusBadge[order.status ?? "pending"] ?? statusBadge["pending"]

  return (
    <>
      {/* Overlay Scuro */}
      <div
        id="order-modal-overlay"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
        onclick="if(event.target===this) closeOrderModal()"
      >
        {/* Card Modal */}
        <div
          class="bg-white border border-gray-100 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden transform transition-all"
          onclick="event.stopPropagation()"
        >
          {/* Header */}
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 class="text-base font-semibold text-gray-900">
                Dettagli ordine <span class="text-gray-400 font-normal">#{order.id}</span>
              </h3>
            </div>
            <button
              class="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
              onclick="closeOrderModal()"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div class="p-6 space-y-6">
            {/* Sezione Prodotto */}
            <div>
              <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Prodotto</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-gray-400 mb-0.5">Nome</div>
                  <div class="text-sm font-medium text-gray-900">{order.productName}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400 mb-0.5">Prezzo unitario</div>
                  <div class="text-sm font-medium text-gray-900">
                    ${((order.totalPrice ?? 0) / order.quantity).toLocaleString("it-IT")}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-gray-400 mb-0.5">Quantità</div>
                  <div class="text-sm font-medium text-gray-900">×{order.quantity}</div>
                </div>
                <div>
                  <div class="text-xs text-gray-400 mb-0.5">Totale</div>
                  <div class="text-2xl font-bold text-gray-900">
                    ${order.totalPrice?.toLocaleString("it-IT")}
                  </div>
                </div>
              </div>
            </div>

            {/* Sezione Cliente */}
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</h4>
              <div>
                <div class="text-xs text-gray-400 mb-0.5">Nome completo</div>
                <div class="text-sm font-medium text-gray-900">{order.userName}</div>
              </div>
            </div>

            {/* Sezione Spedizione */}
            <div class="border-t border-gray-100 pt-4">
              <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Spedizione</h4>
              <div class="bg-gray-50 rounded-xl p-4 flex gap-3 items-start border border-gray-100">
                <span class="text-base mt-0.5">📍</span>
                <div class="text-sm text-gray-700 url-spaced leading-relaxed">
                  {order.address ? (
                    <>
                      <span class="font-medium">{order.address}</span>
                      <br />
                      <span class="text-gray-400 text-xs">{order.city ?? ""}</span>
                    </>
                  ) : (
                    <span class="text-gray-400 italic">Indirizzo non specificato</span>
                  )}
                </div>
              </div>
            </div>

            {/* Gestione Stato */}
            <div class="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-400 mb-1.5">Stato attuale</div>
                <span class={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
              <select
                class="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white font-medium text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                hx-patch={`/admin/orders/${order.id}/status`}
                hx-trigger="change"
                hx-vals="js:{status: this.value}"
                hx-swap="none"
              >
                <option value="pending" selected={order.status === "pending"}>In attesa</option>
                <option value="shipped" selected={order.status === "shipped"}>Spedito</option>
                <option value="delivered" selected={order.status === "delivered"}>Consegnato</option>
                <option value="cancelled" selected={order.status === "cancelled"}>Annullato</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
              class="px-4 py-2 text-xs font-medium border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
              onclick="closeOrderModal()"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================
// ADMIN DASHBOARD — COMPONENTE PRINCIPALE
// ============================================================
export default async function AdminDashboard() {
  const [allUsers, allProducts, allOrders] = await Promise.all([
    db.select().from(users),
    db.select().from(products),
    db.select().from(orders),
  ])

  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0)
  const pendingOrders = allOrders.filter(o => o.status === "pending").length

  const ordersWithDetails: OrderWithDetails[] = allOrders.map(order => {
    const user = allUsers.find(u => u.id === order.userId)
    const product = allProducts.find(p => p.id === order.productId)
    return {
      ...order,
      userName: user ? `${user.name} ${user.lastName}` : "Utente rimosso",
      productName: product?.productName ?? "Prodotto rimosso",
    }
  })

  return (
    <>
      <div class="antialiased text-gray-900 font-sans p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <div class="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">TechStore</div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Admin dashboard</h1>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div class="text-xs font-medium text-gray-400 mb-1">Totale ricavi</div>
            <div class="text-2xl font-bold tracking-tight text-emerald-600">${totalRevenue.toLocaleString("it-IT")}</div>
          </div>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div class="text-xs font-medium text-gray-400 mb-1">Ordini totali</div>
            <div class="text-2xl font-bold tracking-tight text-gray-900">{allOrders.length}</div>
          </div>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div class="text-xs font-medium text-gray-400 mb-1">Ordini pendenti</div>
            <div class={`text-2xl font-bold tracking-tight ${pendingOrders > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {pendingOrders}
            </div>
          </div>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div class="text-xs font-medium text-gray-400 mb-1">Utenti registrati</div>
            <div class="text-2xl font-bold tracking-tight text-gray-900">{allUsers.length}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div class="flex gap-2 border-b border-gray-200">
          <button id="tab-btn-users" class="px-4 py-2.5 text-sm font-medium border-b-2 border-indigo-600 text-indigo-600 transition-all" onclick="adminShowTab('users')">Utenti</button>
          <button id="tab-btn-products" class="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-all" onclick="adminShowTab('products')">Prodotti</button>
          <button id="tab-btn-orders" class="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-all" onclick="adminShowTab('orders')">Ordini</button>
        </div>

        {/* ============================================================
            TAB UTENTI
           ============================================================ */}
        <div id="admin-tab-users" class="block tab-section animate-fade-in">
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-800">Gestione utenti</h2>
              <span class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{allUsers.length} totali</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/20">
                    <th class="p-4">Utente</th>
                    <th class="p-4">Email</th>
                    <th class="p-4">Stato</th>
                    <th class="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {allUsers.map((user, i) => {
                    const avatar = avatarColorClass(i);
                    const isActive = user.isVerified;
                    const isBanned = user.isBanned; // Recuperiamo lo stato dal DB

                    return (
                      <tr class={`transition-colors ${isBanned ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50/50"}`}>
                        <td class="p-4">
                          <div class="flex items-center gap-3">
                            <div class={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${avatar.bg} ${avatar.text}`}>
                              {initials(user.name, user.lastName)}
                            </div>
                            <div>
                              <div class="font-medium text-gray-900">
                                {user.name} {user.lastName}
                                {isBanned && (
                                  <span class="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-100 text-red-700">
                                    Bannato
                                  </span>
                                )}
                              </div>
                              <div class="text-xs text-gray-400">@{user.userName}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td class="p-4 text-gray-500 font-normal">{user.eMail}</td>
                        
                        <td class="p-4">
                          <div class="flex items-center gap-2">
                            <span class={`w-2 h-2 rounded-full ${isBanned ? "bg-red-600" : isActive ? "bg-emerald-500" : "bg-red-400"}`} />
                            <span class={`text-xs font-medium ${isBanned ? "text-red-600" : isActive ? "text-emerald-700" : "text-red-700"}`}>
                              {isBanned ? "Bannato" : isActive ? "Attivo" : "Non verificato"}
                            </span>
                          </div>
                        </td>
                        
                        <td class="p-4 text-right">
                          <button
                            class={`px-3 py-1.5 text-xs font-medium rounded-xl shadow-sm transition-all border ${
                              isBanned
                                ? "text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50"
                                : "text-amber-700 border-amber-200 bg-white hover:bg-amber-50"
                            }`}
                            hx-post={`/admin/users/${user.id}/toggle-ban`}
                            hx-confirm={
                              isBanned 
                                ? `Sbloccare l'utente ${user.name} ${user.lastName}?` 
                                : `Bannare l'utente ${user.name} ${user.lastName}?`
                            }
                            hx-target="closest tr"
                            hx-swap="outerHTML"
                          >
                            {isBanned ? "Sbanna" : "Banna"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================================
            TAB PRODOTTI
           ============================================================ */}
        <div id="admin-tab-products" class="hidden tab-section">
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-800">Catalogo prodotti</h2>
              <span class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{allProducts.length} articoli</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/20">
                    <th class="p-4">Prodotto</th>
                    <th class="p-4">Prezzo</th>
                    <th class="p-4">Categoria</th>
                    <th class="p-4 w-1/4">Stock</th>
                    <th class="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {allProducts.map(product => {
                    const pct = stockPct(product.stock)
                    const color = stockColorClass(product.stock)
                    const esaurito = product.stock === 0
                    return (
                      <tr class="hover:bg-gray-50/50 transition-colors">
                        <td class="p-4 font-medium text-gray-900">{product.productName}</td>
                        <td class="p-4 font-semibold text-gray-900">${product.price.toLocaleString("it-IT")}</td>
                        <td class="p-4 text-gray-400 text-xs font-medium">{product.category}</td>
                        <td class="p-4">
                          <div class="flex items-center gap-3 w-full">
                            <div class="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                              <div class={`h-full rounded-full ${color}`} style={`width: ${pct}%`} />
                            </div>
                            <span class={`text-xs font-semibold ${esaurito ? "text-red-600 bg-red-50 px-1.5 py-0.5 rounded" : "text-gray-500"}`}>
                              {esaurito ? "Esaurito" : product.stock}
                            </span>
                          </div>
                        </td>
                        <td class="p-4 text-right">
                          <div class="flex gap-2 justify-end">
                            <button
                              class="px-3 py-1.5 text-xs font-medium rounded-xl text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-all"
                              hx-get={`/admin/products/${product.id}/edit`}
                              hx-target="#order-modal-container"
                              hx-swap="innerHTML"
                            >
                              Modifica
                            </button>
                            <button
                              class="w-8 h-8 flex items-center justify-center text-xs font-medium rounded-xl text-red-600 border border-red-100 bg-white hover:bg-red-50 shadow-sm transition-all"
                              hx-delete={`/admin/products/${product.id}`}
                              hx-confirm={`Eliminare "${product.productName}" definitivamente dal catalogo?`}
                              hx-target="closest tr"
                              hx-swap="outerHTML"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================================
            TAB ORDINI
           ============================================================ */}
        <div id="admin-tab-orders" class="hidden tab-section">
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-800">Gestione ordini</h2>
              <span class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{allOrders.length} processati</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/20">
                    <th class="p-4 w-12">#</th>
                    <th class="p-4">Cliente</th>
                    <th class="p-4">Prodotto</th>
                    <th class="p-4">Totale</th>
                    <th class="p-4 w-16">Qtà</th>
                    <th class="p-4 text-right">Stato</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {ordersWithDetails.map(order => (
                    <tr
                      class="hover:bg-gray-50/80 cursor-pointer transition-all group"
                      hx-get={`/dashboard/orders/${order.id}/modal`}
                      hx-target="#order-modal-container"
                      hx-swap="innerHTML"
                    >
                      <td class="p-4 text-gray-400 text-xs font-medium">#{order.id}</td>
                      <td class="p-4 font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{order.userName}</td>
                      <td class="p-4 text-gray-600">{order.productName}</td>
                      <td class="p-4 font-semibold text-gray-900">${order.totalPrice?.toLocaleString("it-IT")}</td>
                      <td class="p-4 text-gray-400">×{order.quantity}</td>
                      <td class="p-4 text-right" onclick="event.stopPropagation()">
                        <select
                          class="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white font-medium text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          hx-patch={`/admin/orders/${order.id}/status`}
                          hx-trigger="change"
                          hx-vals="js:{status: this.value}"
                          hx-swap="none"
                        >
                          <option value="pending" selected={order.status === "pending"}>In attesa</option>
                          <option value="shipped" selected={order.status === "shipped"}>Spedito</option>
                          <option value="delivered" selected={order.status === "delivered"}>Consegnato</option>
                          <option value="cancelled" selected={order.status === "cancelled"}>Annullato</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Container Modal HTMX */}
        <div id="order-modal-container"></div>
      </div>

      {/* Script vanilla ottimizzati per sincronia tab e modal */}
      <script>{`
        function adminShowTab(name) {
          // Reset e aggiornamento bottoni tab
          const tabs = ['users', 'products', 'orders'];
          tabs.forEach(t => {
            const btn = document.getElementById('tab-btn-' + t);
            const section = document.getElementById('admin-tab-' + t);
            if (t === name) {
              btn.classList.remove('text-gray-400', 'border-transparent');
              btn.classList.add('text-indigo-600', 'border-indigo-600', 'font-semibold');
              section.classList.remove('hidden');
              section.classList.add('block');
            } else {
              btn.classList.remove('text-indigo-600', 'border-indigo-600', 'font-semibold');
              btn.classList.add('text-gray-400', 'border-transparent');
              section.classList.remove('block');
              section.classList.add('hidden');
            }
          });
        }

        function closeOrderModal() {
          const container = document.getElementById('order-modal-container');
          if(container) container.innerHTML = '';
        }

        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeOrderModal();
        });
      `}</script>
    </>
  )
}
