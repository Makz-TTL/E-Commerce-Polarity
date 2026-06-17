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

const AVATAR_TAILWIND_COLORS = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
]
export function avatarColorClass(i: number) {
  return AVATAR_TAILWIND_COLORS[i % AVATAR_TAILWIND_COLORS.length]
}

const moderationBadge: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  approved: { label: "Approvato",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending:  { label: "In attesa",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  rejected: { label: "Rifiutato",   bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
}

const statusBadge: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: "In attesa",  bg: "bg-amber-50",  text: "text-amber-800" },
  shipped:   { label: "Spedito",    bg: "bg-emerald-50", text: "text-emerald-800" },
  delivered: { label: "Consegnato", bg: "bg-teal-50",    text: "text-teal-800" },
  cancelled: { label: "Annullato",  bg: "bg-red-50",     text: "text-red-800" },
}

  type Props = {
    activeTab?: string
    allUsers: User[]
    allProducts: Product[]
    allOrders: Order[]
    ordersWithDetails: OrderWithDetails[]
    totalRevenue: number
    pendingOrders: number
  }

  export default function AdminDashboard({
    activeTab = "users",
    allUsers,
    allProducts,
    allOrders,
    ordersWithDetails,
    totalRevenue,
    pendingOrders,
  }: Props) {
    const isUsers    = activeTab === "users"
    const isProducts = activeTab === "products"
    const isOrders   = activeTab === "orders"

    const activeBtnClass   = "text-indigo-600 border-indigo-600 font-semibold"
    const inactiveBtnClass = "text-gray-400 border-transparent hover:text-gray-600"
  
  return (
    <>
      {/* FIX: Outer container acts as the target for HTMX swaps */}
      <div id="admin-dashboard-wrapper" class="antialiased text-gray-900 font-sans p-6 max-w-6xl mx-auto space-y-6">

        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <a href="/"><div class="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">TechStore</div></a>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Admin dashboard</h1>
          </div>
        </div>

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
            <div id="pending-count" class={`text-2xl font-bold tracking-tight ${pendingOrders > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {pendingOrders}
            </div>
          </div>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div class="text-xs font-medium text-gray-400 mb-1">Utenti registrati</div>
            <div class="text-2xl font-bold tracking-tight text-gray-900">{allUsers.length}</div>
          </div>
        </div>

        {/* FIX: Handled tabs purely via HTMX attributes */}
        <div class="flex gap-2 border-b border-gray-200">
          <button 
            id="tab-btn-users" 
            hx-get="/dashboard?tab=users"
            hx-target="#admin-dashboard-wrapper"
            hx-swap="outerHTML"
            hx-push-url="true"
            class={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${isUsers ? activeBtnClass : inactiveBtnClass}`}
          >
            Utenti
          </button>
          <button 
            id="tab-btn-products" 
            hx-get="/dashboard?tab=products"
            hx-target="#admin-dashboard-wrapper"
            hx-swap="outerHTML"
            hx-push-url="true"
            class={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${isProducts ? activeBtnClass : inactiveBtnClass}`}
          >
            Prodotti
          </button>
          <button 
            id="tab-btn-orders" 
            hx-get="/dashboard?tab=orders"
            hx-target="#admin-dashboard-wrapper"
            hx-swap="outerHTML"
            hx-push-url="true"
            class={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${isOrders ? activeBtnClass : inactiveBtnClass}`}
          >
            Ordini
          </button>
        </div>

        <div id="admin-tab-users" class={`tab-section animate-fade-in ${isUsers ? "block" : "hidden"}`}>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[18px] font-bold text-dark-grey tracking-wider bg-gray-50/20">
                    <th class="p-4">Stato</th>
                    <th class="p-4">Utente</th>
                    <th class="p-4">Email</th>
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
                          <div class="flex items-center gap-2">
                            <span class={`w-2.5 h-2.5 rounded-full ${isBanned ? "bg-red-600" : isActive ? "bg-emerald-600" : "bg-red-600"}`} />
                            <span class={`text-xs font-medium ${isBanned ? "text-red-600" : isActive ? "text-emerald-700" : "text-red-700"}`}>
                              {isBanned ? "Bannato" : isActive ? "Attivo" : "Non verificato"}
                            </span>
                          </div>
                        </td>
                        
                        <td class="p-4">
                          <div class="flex items-center gap-3">
                            <div class={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${avatar.bg} ${avatar.text}`}>
                              {initials(user.name, user.lastName)}
                            </div>
                            <div>
                              <div class="font-medium text-gray-900">
                                {user.name} {user.lastName}
                              </div>
                              <div class="text-xs text-gray-400">@{user.userName}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td class="p-4 text-gray-500 font-normal">{user.eMail}</td>
                        
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

        <div id="admin-tab-products" class={`tab-section ${isProducts ? "block" : "hidden"}`}>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <span class="text-[12px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md mr-auto">{allProducts.length} articoli</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[18px] font-bold text-black tracking-wider bg-gray-50/20">
                    <th class="p-4">Moderazione</th>
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
                    const mod = moderationBadge[product.status ?? "pending"] ?? moderationBadge["pending"]
                    const score = product.reliability != null ? Number(product.reliability) : null
                    return (
                      <tr class="hover:bg-gray-50/50 transition-colors">
                        <td class="p-4">
                          <div class="flex items-center gap-2">
                            <span class={`w-2.5 h-2.5 rounded-full ${mod.dot}`}></span>
                            <span class={`text-xs font-medium ${mod.text}`}>{mod.label}</span>
                          </div>
                        </td>
                        <td class="p-4 text-[14px] text-grey font-semibold">{product.productName}</td>
                        <td class="p-4 text-gray-900">${product.price.toLocaleString("it-IT")}</td>
                        <td class="p-4 text-gray-400 text-xs font-medium bg-grey">{product.category}</td>
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
                              class="px-3 py-1.5 text-xs font-medium rounded-xl text-indigo-700 border border-indigo-200 bg-white hover:bg-indigo-50 shadow-sm transition-all"
                              hx-get={`/dashboard/products/${product.id}/status-modal`}
                              hx-target="#order-modal-container"
                              hx-swap="innerHTML"
                            >
                              Moderazione
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

        <div id="admin-tab-orders" class={`tab-section ${isOrders ? "block" : "hidden"}`}>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[18px] font-bold text-black tracking-wider bg-gray-50/20">
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
                          id={`status-${order.id}`}
                          hx-post={`/admin/orders/${order.id}/status`}
                          hx-trigger="change"
                          hx-swap="none"
                          hx-include={`#status-${order.id}`}  // include se stesso
                          name="status"  // il name è fondamentale!
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

        <div id="order-modal-container"></div>
      </div>

      <script>{`
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
