import { db } from "../../db"
import { users } from "../../db/schema/users"
import { products } from "../../db/schema/products"
import { orders } from "../../db/schema/orders"

// ============================================================
// TYPES
// ============================================================
type User    = typeof users.$inferSelect
type Product = typeof products.$inferSelect
type Order   = typeof orders.$inferSelect

// Esportato così orderDetailModal.tsx può importarlo
export type OrderWithDetails = Order & {
  userName: string
  productName: string
}

// ============================================================
// HELPERS
// ============================================================

function stockColor(stock: number, max = 50): string {
  if (stock === 0)          return "#E24B4A"  // rosso — esaurito
  if (stock / max < 0.2)   return "#EF9F27"  // arancio — scorte basse
  return "#1D9E75"                            // verde — ok
}

function stockPct(stock: number, max = 50): number {
  return Math.min(100, Math.round((stock / max) * 100))
}

function initials(name: string, lastName: string): string {
  return `${name[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

const AVATAR_COLORS = [
  { bg: "#CECBF6", color: "#3C3489" },
  { bg: "#F5C4B3", color: "#993C1D" },
  { bg: "#C0DD97", color: "#3B6D11" },
  { bg: "#B5D4F4", color: "#0C447C" },
]
function avatarStyle(i: number) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length]
}

// ============================================================
// MODAL DETTAGLIO ORDINE
// Componente separato ma nello stesso file per condividere
// il tipo OrderWithDetails senza import extra.
// Viene renderizzato dalla rotta GET /admin/orders/:id/modal
// e iniettato da HTMX in #order-modal-container.
// ============================================================
export function OrderDetailModal({ order }: { order: OrderWithDetails }) {

  // Mappa status → colori badge
  const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: "In attesa",  bg: "#FAEEDA", color: "#854F0B" },
    shipped:   { label: "Spedito",    bg: "#EAF3DE", color: "#3B6D11" },
    delivered: { label: "Consegnato", bg: "#E1F5EE", color: "#0F6E56" },
    cancelled: { label: "Annullato",  bg: "#FCEBEB", color: "#A32D2D" },
  }
  const badge = statusBadge[order.status ?? "pending"] ?? statusBadge["pending"]

  return (
    <>
      {/*
        Overlay scuro a tutto schermo.
        position:fixed + inset:0 copre tutta la viewport.
        z-index:100 sta sopra tutto il resto della pagina.
        Click sull'overlay (non sul modal) chiama closeOrderModal().
      */}
      <div
        id="order-modal-overlay"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:center;justify-content:center;"
        onclick="if(event.target===this) closeOrderModal()"
      >
        {/*
          Card modal — stoppiamo la propagazione del click
          così cliccando dentro non si chiude l'overlay.
        */}
        <div
          style="background:#fff;border:0.5px solid #e5e5e3;border-radius:16px;width:100%;max-width:480px;margin:1rem;overflow:hidden;"
          onclick="event.stopPropagation()"
        >

          {/* ── Header ── */}
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.25rem 1rem;">
            <div>
              <div style="font-size:15px;font-weight:500;">
                Dettagli ordine{" "}
                <span style="color:#888;font-weight:400;">#{order.id}</span>
              </div>
            </div>
            <button
              style="width:28px;height:28px;border-radius:50%;border:0.5px solid #ccc;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#888;"
              onclick="closeOrderModal()"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          <div style="height:0.5px;background:#e5e5e3;" />

          {/* ── Body ── */}
          <div style="padding:1.25rem;">

            {/* Prodotto */}
            <div style="font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              Prodotto
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem;">
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Nome</div>
                <div style="font-size:13px;font-weight:500;">{order.productName}</div>
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Prezzo unitario</div>
                <div style="font-size:13px;font-weight:500;">
                  {/* Calcola prezzo unitario dividendo il totale per la quantità */}
                  ${((order.totalPrice ?? 0) / order.quantity).toLocaleString("it-IT")}
                </div>
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Quantità</div>
                <div style="font-size:13px;font-weight:500;">×{order.quantity}</div>
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Totale</div>
                {/* Totale più grande per dare enfasi visiva */}
                <div style="font-size:22px;font-weight:500;">
                  ${order.totalPrice?.toLocaleString("it-IT")}
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div style="font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              Cliente
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem;">
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Nome</div>
                <div style="font-size:13px;font-weight:500;">{order.userName}</div>
              </div>
            </div>

            {/* Spedizione — address e city vengono dallo schema orders.ts */}
            <div style="font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              Spedizione
            </div>
            <div style="background:#f5f5f4;border-radius:8px;padding:12px;margin-bottom:1.25rem;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:16px;margin-top:1px;">📍</span>
              <div style="font-size:13px;line-height:1.6;">
                {/* Fallback se l'utente non ha inserito indirizzo al checkout */}
                {order.address
                  ? <>{order.address}<br /><span style="color:#888;">{order.city ?? ""}</span></>
                  : <span style="color:#888;">Indirizzo non specificato</span>
                }
              </div>
            </div>

            {/* Stato attuale + select per aggiornarlo */}
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:6px;">Stato attuale</div>
                <span style={`display:inline-block;font-size:11px;padding:4px 10px;border-radius:999px;background:${badge.bg};color:${badge.color};`}>
                  {badge.label}
                </span>
              </div>
              {/*
                Select per cambiare stato inline.
                hx-trigger="change" parte automaticamente al cambio valore.
                hx-swap="none" non tocca il DOM — aggiorna solo il db.
              */}
              <select
                style="font-size:12px;border:0.5px solid #ccc;border-radius:8px;padding:5px 10px;background:#fff;cursor:pointer;"
                hx-patch={`/admin/orders/${order.id}/status`}
                hx-trigger="change"
                hx-vals="js:{status: this.value}"
                hx-swap="none"
              >
                <option value="pending"   selected={order.status === "pending"}>In attesa</option>
                <option value="shipped"   selected={order.status === "shipped"}>Spedito</option>
                <option value="delivered" selected={order.status === "delivered"}>Consegnato</option>
                <option value="cancelled" selected={order.status === "cancelled"}>Annullato</option>
              </select>
            </div>

          </div>

          {/* ── Footer ── */}
          <div style="padding:1rem 1.25rem;border-top:0.5px solid #e5e5e3;display:flex;justify-content:flex-end;">
            <button
              style="padding:7px 14px;font-size:13px;border-radius:8px;border:0.5px solid #ccc;background:none;cursor:pointer;"
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
// ADMIN DASHBOARD — componente principale
// ============================================================
export default async function AdminDashboard() {

  // Tutte e tre le query in parallelo per non aspettare in sequenza
  const [allUsers, allProducts, allOrders] = await Promise.all([
    db.select().from(users),
    db.select().from(products),
    db.select().from(orders),
  ])

  // Statistiche aggregate per le card in cima
  const totalRevenue  = allOrders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0)
  const pendingOrders = allOrders.filter(o => o.status === "pending").length

  // Arricchiamo ogni ordine con nome utente e nome prodotto
  // così la tabella mostra dati leggibili invece di ID numerici
  const ordersWithDetails: OrderWithDetails[] = allOrders.map(order => {
    const user    = allUsers.find(u => u.id === order.userId)
    const product = allProducts.find(p => p.id === order.productId)
    return {
      ...order,
      userName:    user    ? `${user.name} ${user.lastName}` : "Utente rimosso",
      productName: product?.productName ?? "Prodotto rimosso",
    }
  })

  return (
    <>
      <style>{`
        .admin-dash * { box-sizing: border-box; margin: 0; padding: 0; }
        .admin-dash { font-family: system-ui, sans-serif; padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
        .admin-dash .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .admin-dash .page-title { font-size: 20px; font-weight: 500; }
        .admin-dash .page-sub { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .admin-dash .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 1.5rem; }
        .admin-dash .stat-card { background: #f5f5f4; border-radius: 8px; padding: 1rem; }
        .admin-dash .stat-label { font-size: 12px; color: #888; margin-bottom: 4px; }
        .admin-dash .stat-value { font-size: 22px; font-weight: 500; }
        .admin-dash .stat-value.green { color: #1D9E75; }
        .admin-dash .stat-value.amber { color: #BA7517; }
        .admin-dash .tabs { display: flex; gap: 4px; border-bottom: 0.5px solid #e5e5e3; margin-bottom: 1.5rem; }
        .admin-dash .tab-btn { padding: 8px 16px; font-size: 14px; cursor: pointer; border: none; border-bottom: 2px solid transparent; background: none; color: #888; }
        .admin-dash .tab-btn.active { color: #111; border-bottom-color: #111; font-weight: 500; }
        .admin-dash .tab-section { display: none; }
        .admin-dash .tab-section.active { display: block; }
        .admin-dash .card { background: #fff; border: 0.5px solid #e5e5e3; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
        .admin-dash .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .admin-dash .card-title { font-size: 15px; font-weight: 500; }
        .admin-dash .card-count { font-size: 12px; color: #888; }
        .admin-dash table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        .admin-dash th { text-align: left; font-size: 11px; font-weight: 500; color: #888; padding: 0 8px 8px 0; border-bottom: 0.5px solid #e5e5e3; text-transform: uppercase; letter-spacing: 0.5px; }
        .admin-dash td { padding: 10px 8px 10px 0; border-bottom: 0.5px solid #e5e5e3; vertical-align: middle; }
        .admin-dash tr:last-child td { border-bottom: none; }
        .admin-dash .muted { color: #888; font-size: 12px; }
        .admin-dash .avatar { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500; flex-shrink: 0; }
        .admin-dash .user-row { display: flex; align-items: center; gap: 8px; }
        .admin-dash .btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; font-size: 12px; border-radius: 8px; border: 0.5px solid #ccc; background: none; cursor: pointer; color: #111; }
        .admin-dash .btn:hover { background: #f5f5f4; }
        .admin-dash .btn-danger { color: #A32D2D; border-color: #F7C1C1; }
        .admin-dash .btn-danger:hover { background: #FCEBEB; }
        .admin-dash .btn-ban { color: #854F0B; border-color: #FAC775; }
        .admin-dash .btn-ban:hover { background: #FAEEDA; }
        .admin-dash .actions { display: flex; gap: 6px; }
        .admin-dash .stock-wrap { display: flex; align-items: center; gap: 8px; }
        .admin-dash .stock-bar { height: 6px; border-radius: 3px; flex: 1; background: #e5e5e3; overflow: hidden; }
        .admin-dash .stock-fill { height: 100%; border-radius: 3px; }
        .admin-dash .stock-label { font-size: 12px; color: #888; min-width: 28px; text-align: right; }
        .admin-dash .status-select { font-size: 12px; border: 0.5px solid #ccc; border-radius: 8px; padding: 4px 8px; background: #fff; color: #111; cursor: pointer; }
        .admin-dash .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; }
        /* Riga ordine cliccabile */
        .admin-dash .order-row { cursor: pointer; }
        .admin-dash .order-row:hover td { background: #fafafa; }
      `}</style>

      <div class="admin-dash">

        {/* ── Header ── */}
        <div class="page-header">
          <div>
            <div class="page-sub">TechStore</div>
            <div class="page-title">Admin dashboard</div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Totale ricavi</div>
            <div class="stat-value green">${totalRevenue.toLocaleString("it-IT")}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Ordini totali</div>
            <div class="stat-value">{allOrders.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Ordini pendenti</div>
            <div class={`stat-value ${pendingOrders > 0 ? "amber" : "green"}`}>{pendingOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Utenti registrati</div>
            <div class="stat-value">{allUsers.length}</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div class="tabs">
          <button class="tab-btn active" onclick="adminShowTab('users')">Utenti</button>
          <button class="tab-btn" onclick="adminShowTab('products')">Prodotti</button>
          <button class="tab-btn" onclick="adminShowTab('orders')">Ordini</button>
        </div>

        {/* ══════════════════════════════
            TAB UTENTI
        ══════════════════════════════ */}
        <div id="admin-tab-users" class="tab-section active">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Gestione utenti</span>
              <span class="card-count">{allUsers.length} utenti</span>
            </div>
            <table>
              <colgroup>
                <col style="width:30%" />
                <col style="width:28%" />
                <col style="width:18%" />
                <col style="width:24%" />
              </colgroup>
              <thead>
                <tr>
                  <th>Utente</th>
                  <th>Email</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user, i) => {
                  const style    = avatarStyle(i)
                  const isActive = user.isVerified
                  return (
                    <tr>
                      <td>
                        <div class="user-row">
                          <div class="avatar" style={`background:${style.bg};color:${style.color}`}>
                            {initials(user.name, user.lastName)}
                          </div>
                          <div>
                            <div style="font-size:13px;font-weight:500;">{user.name} {user.lastName}</div>
                            <div class="muted">@{user.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td class="muted">{user.eMail}</td>
                      <td>
                        <span class="dot" style={`background:${isActive ? "#1D9E75" : "#E24B4A"}`} />
                        <span style={`font-size:12px;color:${isActive ? "#1D9E75" : "#A32D2D"}`}>
                          {isActive ? "Attivo" : "Non verificato"}
                        </span>
                      </td>
                      <td>
                        <div class="actions">
                          <button
                            class="btn btn-ban"
                            hx-post={`/admin/users/${user.id}/ban`}
                            hx-confirm={`Bannare ${user.name} ${user.lastName}?`}
                            hx-target="closest tr"
                            hx-swap="outerHTML"
                          >
                            Banna
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

        {/* ══════════════════════════════
            TAB PRODOTTI
        ══════════════════════════════ */}
        <div id="admin-tab-products" class="tab-section">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Catalogo prodotti</span>
              <span class="card-count">{allProducts.length} prodotti</span>
            </div>
            <table>
              <colgroup>
                <col style="width:25%" />
                <col style="width:12%" />
                <col style="width:14%" />
                <col style="width:28%" />
                <col style="width:21%" />
              </colgroup>
              <thead>
                <tr>
                  <th>Prodotto</th>
                  <th>Prezzo</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map(product => {
                  const pct      = stockPct(product.stock)
                  const color    = stockColor(product.stock)
                  const esaurito = product.stock === 0
                  return (
                    <tr>
                      <td style="font-size:13px;font-weight:500;">{product.productName}</td>
                      <td style="font-size:13px;font-weight:500;">${product.price.toLocaleString("it-IT")}</td>
                      <td class="muted">{product.category}</td>
                      <td>
                        <div class="stock-wrap">
                          <div class="stock-bar">
                            <div class="stock-fill" style={`width:${pct}%;background:${color}`} />
                          </div>
                          <span class="stock-label">
                            {esaurito
                              ? <span style="color:#A32D2D;font-weight:500;font-size:11px;">Esaurito</span>
                              : product.stock
                            }
                          </span>
                        </div>
                      </td>
                      <td>
                        <div class="actions">
                          <button
                            class="btn"
                            hx-get={`/admin/products/${product.id}/edit`}
                            hx-target="#order-modal-container"
                            hx-swap="innerHTML"
                          >
                            Modifica
                          </button>
                          <button
                            class="btn btn-danger"
                            hx-delete={`/admin/products/${product.id}`}
                            hx-confirm={`Eliminare "${product.productName}"?`}
                            hx-target="closest tr"
                            hx-swap="outerHTML"
                          >
                            🗑
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

        {/* ══════════════════════════════
            TAB ORDINI
        ══════════════════════════════ */}
        <div id="admin-tab-orders" class="tab-section">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Gestione ordini</span>
              <span class="card-count">{allOrders.length} ordini totali</span>
            </div>
            <table>
              <colgroup>
                <col style="width:8%" />
                <col style="width:20%" />
                <col style="width:22%" />
                <col style="width:14%" />
                <col style="width:8%" />
                <col style="width:28%" />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Prodotto</th>
                  <th>Totale</th>
                  <th>Qtà</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {ordersWithDetails.map(order => (
                  <tr
                    class="order-row"
                    hx-get={`/dashboard/orders/${order.id}/modal`}
                    hx-target="#order-modal-container"
                    hx-swap="innerHTML"
                  >
                    <td class="muted">#{order.id}</td>
                    <td style="font-size:13px;">{order.userName}</td>
                    <td style="font-size:13px;">{order.productName}</td>
                    <td style="font-size:13px;font-weight:500;">${order.totalPrice?.toLocaleString("it-IT")}</td>
                    <td class="muted">×{order.quantity}</td>
                    <td>
                      {/*
                        stopPropagation impedisce che il click sul select
                        triggeri anche il hx-get della riga
                      */}
                      <select
                        class="status-select"
                        onclick="event.stopPropagation()"
                        hx-patch={`/admin/orders/${order.id}/status`}
                        hx-trigger="change"
                        hx-vals="js:{status: this.value}"
                        hx-swap="none"
                      >
                        <option value="pending"   selected={order.status === "pending"}>⏳ In attesa</option>
                        <option value="shipped"   selected={order.status === "shipped"}>📦 Spedito</option>
                        <option value="delivered" selected={order.status === "delivered"}>✅ Consegnato</option>
                        <option value="cancelled" selected={order.status === "cancelled"}>❌ Annullato</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/*
          Container vuoto dove HTMX inietta il modal ordine.
          Quando è vuoto non occupa spazio (il modal usa position:fixed).
        */}
        <div id="order-modal-container"></div>

      </div>

      <script>{`
        /* Gestione tab */
        function adminShowTab(name) {
          document.querySelectorAll('.admin-dash .tab-btn').forEach(b => b.classList.remove('active'))
          document.querySelectorAll('.admin-dash .tab-section').forEach(s => s.classList.remove('active'))
          document.querySelector('[onclick="adminShowTab(\\'' + name + '\\')"]').classList.add('active')
          document.getElementById('admin-tab-' + name).classList.add('active')
        }

        /* Chiude il modal svuotando il container */
        function closeOrderModal() {
          document.getElementById('order-modal-container').innerHTML = ''
        }

        /* Chiudi con Escape */
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeOrderModal()
        })
      `}</script>
    </>
  )
}
