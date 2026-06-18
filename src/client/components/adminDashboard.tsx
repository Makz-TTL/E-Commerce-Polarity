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

export function OrderRows({ orders }: { orders: OrderWithDetails[] }) {
  return (
    <>
      {orders.map(order => (
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
          <td class="p-4 text-gray-400 mr-auto">×{order.quantity}</td>
          <td class="p-4 text-right">
            {order.status === 'pending' && (
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                In attesa
              </span>
            )}
            
            {order.status === 'shipped' && (
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Spedito
              </span>
            )}
            
            {order.status === 'delivered' && (
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Consegnato
              </span>
            )}
            
            {order.status === 'cancelled' && (
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                Annullato
              </span>
            )}
          </td>
        </tr>
      ))}
    </>
  )
}

export function ProductRows({ products }: { products: Product[] }) {
  if (!products || products.length === 0) {
    return (
      <tr>
        <td colspan="6" class="p-8 text-center text-sm text-gray-400">
          Nessun prodotto trovato con i filtri selezionati.
        </td>
      </tr>
    );
  }

  return (
    <>
      {products.map(product => {
        const pct = stockPct(product.stock);
        const color = stockColorClass(product.stock);
        const esaurito = product.stock === 0;
        const mod = moderationBadge[product.status ?? "pending"] ?? moderationBadge["pending"];

        return (
          <tr 
            class="hover:bg-gray-50/50 cursor-pointer transition-all group"
            hx-get={`/product/${product.id}`}
            hx-trigger="click"
            hx-target="body"
            hx-push-url="true"
          >
            <td class="p-4">
              <div class="flex items-center gap-2">
                <span class={`w-2.5 h-2.5 rounded-full ${mod.dot}`}></span>
                <span class={`text-xs font-medium ${mod.text}`}>{mod.label}</span>
              </div>
            </td>
            <td class="p-4 text-[14px] text-gray-700 font-semibold group-hover:text-indigo-600 transition-colors">
              {product.productName}
            </td>
            <td class="p-4 text-gray-900">${product.price.toLocaleString("it-IT")}</td>
            <td class="p-4">
              <span class="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded-lg">
                {product.category}
              </span>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-3 w-full">
                <div class="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <div class={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
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
                  hx-on:click="event.stopPropagation()"
                >
                  Moderazione
                </button>
                <button
                  class="w-8 h-8 flex items-center justify-center text-xs font-medium rounded-xl text-red-600 border border-red-100 bg-white hover:bg-red-50 shadow-sm transition-all"
                  hx-delete={`/admin/products/${product.id}`}
                  hx-confirm={`Eliminare "${product.productName}" definitivamente dal catalogo?`}
                  hx-target="closest tr"
                  hx-swap="outerHTML"
                  hx-on:click="event.stopPropagation()"
                >
                  ✕
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function UserRows({ user }: { user: User[] }) {
  if (!user || user.length === 0) {
    return (
      <tr>
        <td colspan="4" class="p-8 text-center text-sm text-gray-400">
          Nessun utente trovato con questo filtro.
        </td>
      </tr>
    );
  }

  return (
    <>
      {user.map((user, i) => {
        const avatar = avatarColorClass(i);
        const isActive = user.isVerified;
        const isBanned = user.isBanned;

        return (
          <tr class={`transition-colors ${isBanned ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-gray-50/50"}`}>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <span class={`w-2.5 h-2.5 rounded-full ${isBanned ? "bg-red-600" : isActive ? "bg-emerald-600" : "bg-amber-500"}`} />
                <span class={`text-xs font-medium ${isBanned ? "text-red-600" : isActive ? "text-emerald-700" : "text-amber-700"}`}>
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
                hx-post={isBanned ? `/admin/users/${user.id}/unban` : `/admin/users/${user.id}/ban`}
                hx-confirm={isBanned ? `Sbloccare ${user.name}?` : `Bannare ${user.name}?`}
                hx-target="closest tr"
                hx-swap="outerHTML"
                class={`w-24 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors duration-150 text-center ${
                  isBanned
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                }`}
              >
                {isBanned ? "Pardon" : "Ban"}
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
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
      <div id="admin-dashboard-wrapper" class="antialiased text-gray-900 font-sans p-6 max-w-6xl mx-auto space-y-6">
        
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <a href="/"><div class="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-0.5">TechStore</div></a>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Admin dashboard</h1>
          </div>
          
          <a href="/" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Torna alla home
          </a>
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
            <div class="text-xs font-medium text-gray-400 mb-1">Articoli totali</div>
            <div id="pending-count" class="text-2xl font-bold tracking-tight">
              {allProducts.length}
            </div>
          </div>
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <div class="text-xs font-medium text-gray-400 mb-1">Utenti registrati</div>
            <div class="text-2xl font-bold tracking-tight text-gray-900">{allUsers.length}</div>
          </div>
        </div>

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
          
          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">

            <form 
              hx-get="/admin/users/filter" 
              hx-trigger="change" 
              hx-target="#users-tbody" 
              hx-swap="innerHTML"
              class="relative w-44"
            >
              <select
                name="status"
                class="w-full appearance-none bg-white pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all"
              >
                <option value="all">Tutti gli utenti</option>
                <option value="active">Attivi (Verificati)</option>
                <option value="inactive">Non attivi</option>
                <option value="banned">Bannati</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </div>
            </form>
          </div>
          
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[14px] font-bold text-gray-500 tracking-wider bg-gray-50/20">
                    <th class="p-4">Stato</th>
                    <th class="p-4">Utente</th>
                    <th class="p-4">Email</th>
                    <th class="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody id="users-tbody" class="divide-y divide-gray-100">
                  <UserRows 
                    user={allUsers} 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div id="admin-tab-products" class={`tab-section ${isProducts ? "block" : "hidden"}`}>

          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mr-auto">

              <form 
                hx-get="/admin/products/filter" 
                hx-trigger="change" 
                hx-target="#products-tbody" 
                hx-swap="innerHTML"
                class="flex flex-wrap items-center gap-3"
              >
                <div class="relative w-44">
                  <select
                    name="status"
                    class="w-full appearance-none bg-white pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="approved">Approvato</option>
                    <option value="pending">In attesa</option>
                    <option value="rejected">Rifiutato</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div class="relative w-44">
                  <select
                    name="sortPrice"
                    class="w-full appearance-none bg-white pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all"
                  >
                    <option value="">Prezzo</option>
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div class="relative w-44">
                  <select
                    name="sortStock"
                    class="w-full appearance-none bg-white pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-all"
                  >
                    <option value="">Stock</option>
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </form>
            </div>

          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="border-b border-gray-100 text-[14px] font-bold text-gray-500 tracking-wider bg-gray-50/20">
                    <th class="p-4">Moderazione</th>
                    <th class="p-4">Prodotto</th>
                    <th class="p-4">Prezzo</th>
                    <th class="p-4">Categoria</th>
                    <th class="p-4 w-1/4">Stock</th>
                    <th class="p-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody id="products-tbody" class="divide-y divide-gray-100">
                  <ProductRows 
                    products={allProducts} 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div id="admin-tab-orders" class={`tab-section ${isOrders ? "block" : "hidden"}`}>
          
          <div class="mb-4 flex items-center gap-3 relative inline-block text-left">
            
            <button
              id="dropdownBtn"
              type="button"
              onclick="document.getElementById('dropdownMenu').classList.toggle('hidden')"
              class="bg-white px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium flex items-center gap-2 shadow-sm w-48 justify-between text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
            >
              <span id="selectedValue">Tutti</span>
              <svg class="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>

            <div
              id="dropdownMenu"
              class="hidden absolute z-50 top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 space-y-0.5 animate-in fade-in duration-100"
            >
              <button type="button" onclick="selectFilter('all', 'Tutti')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Tutti</button>
              <button type="button" onclick="selectFilter('pending', 'In attesa')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">In attesa</button>
              <button type="button" onclick="selectFilter('shipped', 'Spedito')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Spedito</button>
              <button type="button" onclick="selectFilter('delivered', 'Consegnato')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Consegnato</button>
              <button type="button" onclick="selectFilter('cancelled', 'Annullato')" class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Annullato</button>
            </div>
          </div>
          
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
                <tbody id="orders-tbody">
                  <OrderRows orders={ordersWithDetails} />
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

        function selectFilter(value, label) {
          document.getElementById('dropdownMenu').classList.add('hidden');
          document.getElementById('selectedValue').innerText = label;
          
          htmx.ajax('GET', '/admin/orders/filter', {
            values: { filter: value },
            target: '#orders-tbody',
            swap: 'innerHTML'
          });
        }

        window.addEventListener('click', function(e) {
          const btn = document.getElementById('dropdownBtn');
          const menu = document.getElementById('dropdownMenu');
          if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
          }
        });
      `}</script>
    </>
  )
}