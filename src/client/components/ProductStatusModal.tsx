import { db } from "../../db"
import { users } from "../../db/schema/users"
import { products } from "../../db/schema/products"
import { orders } from "../../db/schema/orders"

const moderationBadge: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  approved: { label: "Approvato",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending:  { label: "In attesa",   bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  rejected: { label: "Rifiutato",   bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
}

type Product = typeof products.$inferSelect

export function ProductStatusModal({ product }: { product: Product }) {

  const mod = moderationBadge[product.status ?? "pending"] ?? moderationBadge["pending"]
  const score = product.reliability != null ? Number(product.reliability) : null

  return (
    <div
      id="order-modal-overlay"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this) closeOrderModal()"
    >
      <div
        class="bg-white border border-gray-100 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
        onclick="event.stopPropagation()"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-900">
            Stato moderazione — <span class="text-gray-400 font-normal">{product.productName}</span>
          </h3>
          <button
            class="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            onclick="closeOrderModal()"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div class="flex items-center gap-3">
            <span class={`w-3 h-3 rounded-full ${mod.dot}`}></span>
            <span class={`text-sm font-semibold ${mod.text}`}>{mod.label}</span>
            {score != null && (
              <span class="ml-auto text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">
                Score AI: {score.toFixed(2)}
              </span>
            )}
          </div>

          {score != null && (
            <div>
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>0.00</span>
                <span>1.00</span>
              </div>
              <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  class={`h-full rounded-full transition-all ${score >= 0.8 ? "bg-emerald-500" : score >= 0.5 ? "bg-amber-400" : "bg-red-500"}`}
                  style={`width: ${Math.round(score * 100)}%`}
                />
              </div>
              <div class="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>Rifiutato</span>
                <span>Revisione</span>
                <span>Approvato</span>
              </div>
            </div>
          )}

          <div class="border-t border-gray-100 pt-4">
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cambia stato manualmente</div>
            <div class="flex gap-2">
              <button
                class="flex-1 py-2 text-xs font-semibold rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                hx-post={`/admin/products/${product.id}/status`}
                hx-vals='{"status": "approved"}'
                hx-swap="none"
                hx-on-htmx-after-request="closeOrderModal()"
              >
                Approva
              </button>
              <button
                class="flex-1 py-2 text-xs font-semibold rounded-xl border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                hx-post={`/admin/products/${product.id}/status`}
                hx-vals='{"status": "pending"}'
                hx-swap="none"
                hx-on-htmx-after-request="closeOrderModal()"
              >
                Metti in attesa
              </button>
              <button
                class="flex-1 py-2 text-xs font-semibold rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                hx-post={`/admin/products/${product.id}/status`}
                hx-vals='{"status": "rejected"}'
                hx-swap="none"
                hx-on-htmx-after-request="closeOrderModal()"
              >
                Rifiuta
              </button>
            </div>
          </div>
        </div>

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
  )
}