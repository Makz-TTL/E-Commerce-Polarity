import { orders } from "../../db/schema/orders"
import { users } from "../../db/schema/users"
import { products } from "../../db/schema/products"
import type { OrderWithDetails } from "./adminDashboard"



export const statusBadge: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "In attesa",  bg: "#FAEEDA", color: "#854F0B" },
  shipped:   { label: "Spedito",    bg: "#EAF3DE", color: "#3B6D11" },
  delivered: { label: "Consegnato", bg: "#E1F5EE", color: "#0F6E56" },
  cancelled: { label: "Annullato",  bg: "#FCEBEB", color: "#A32D2D" },
};


export async function OrderDetailModal({ order }: { order: OrderWithDetails }) {

  // Mappa lo status a badge leggibile
  const badge = statusBadge[order.status ?? "pending"] ?? statusBadge.pending

  return (
    <>
      {/*
        Overlay scuro — clic sull'overlay chiude il modal.
        hx-on:click rimuove il contenuto dell'#order-modal-container.
      */}
      <div
        id="order-modal-overlay"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:center;justify-content:center;"
        onclick="if(event.target===this) closeOrderModal()"
      >
        {/* Card modal — stoppa il clic per non chiudersi da sola */}
        <div
          style="background:#fff;border:0.5px solid #e5e5e3;border-radius:16px;width:100%;max-width:480px;overflow:hidden;margin:1rem;"
          onclick="event.stopPropagation()"
        >

          {/* ── Header ── */}
          <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.25rem 1rem;">
            <div>
              <div style="font-size:15px;font-weight:500;">
                Dettagli ordine <span style="color:#888;font-weight:400;">#{order.id}</span>
              </div>
            </div>
            {/* Pulsante X — chiama closeOrderModal() definita sotto */}
            <button
              style="width:28px;height:28px;border-radius:50%;border:0.5px solid #ccc;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#888;"
              onclick="closeOrderModal()"
              aria-label="Chiudi"
            >
              ✕
            </button>
          </div>

          <div style="height:0.5px;background:#e5e5e3;" />

          {/* ── Body ── */}
          <div style="padding:1.25rem;">

            {/* Sezione prodotto */}
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
                  ${(order.totalPrice / order.quantity).toLocaleString("it-IT")}
                </div>
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Quantità</div>
                <div style="font-size:13px;font-weight:500;">×{order.quantity}</div>
              </div>
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:2px;">Totale ordine</div>
                {/* Prezzo totale più grande per dare enfasi */}
                <div style="font-size:22px;font-weight:500;">
                  ${order.totalPrice?.toLocaleString("it-IT")}
                </div>
              </div>
            </div>

            {/* Sezione cliente */}
            <div style="font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              Cliente
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem;">
              <div>
                <div style="font-size:13px;font-weight:500;">{order.userName}</div>
              </div>
            </div>

            {/* Sezione spedizione — address e city vengono dallo schema orders.ts */}
            <div style="font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
              Spedizione
            </div>
            <div style="background:#f5f5f4;border-radius:8px;padding:12px;margin-bottom:1.25rem;display:flex;gap:10px;align-items:flex-start;">
              <span style="font-size:16px;margin-top:1px;">📍</span>
              <div style="font-size:13px;line-height:1.6;">
                {/* Fallback se l'utente non ha inserito indirizzo */}
                {order.address ?? <span style="color:#888;">Indirizzo non specificato</span>}
                <br />
                <span style="color:#888;">{order.city ?? ""}</span>
              </div>
            </div>

            {/* Stato attuale + select per aggiornarlo inline */}
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:11px;color:#888;margin-bottom:6px;">Stato attuale</div>
                <span
                  id={`badge-${order.id}`}
                  style={`display:inline-block;font-size:11px;padding:4px 10px;border-radius:999px;background:${badge.bg};color:${badge.color};`}
                >
                  {badge.label}
                </span>
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div style="padding:1rem 1.25rem;border-top:0.5px solid #e5e5e3;display:flex;gap:8px;justify-content:flex-end;">
            <button
              style="display:inline-flex;align-items:center;gap:5px;padding:7px 14px;font-size:13px;border-radius:8px;border:0.5px solid #ccc;background:none;cursor:pointer;"
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