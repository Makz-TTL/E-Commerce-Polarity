import { db } from "../../db"
import { Session } from "fastify"
import ConfirmLogoutModal from "./ConfirmLogoutModal"
import { products as productsTable, users as usersTable, reviews as reviewsTable } from "../../db/schema" // 👈 Assicurati di importare tutte le tabelbe coinvolte
import { eq, gt, and, sql } from "drizzle-orm"

type MarketplaceProps = {
  searchParams?: { category?: string }
  partial?: boolean
  session?: Session
}

export default async function Marketplace({ searchParams, partial, session }: MarketplaceProps) {
  const category = searchParams?.category ? searchParams.category.trim() : ""


  const queryConditions = [gt(productsTable.stock, 0)]

  if (category) {
    queryConditions.push(eq(productsTable.category, category))
  }

  
  const rows = await db
    .select({
      id: productsTable.id,
      productName: productsTable.productName,
      price: productsTable.price,
      description: productsTable.description,
      stock: productsTable.stock,
      imageUrl: productsTable.imageUrl,
      category: productsTable.category,
      
      seller: {
        name: usersTable.name,
        lastName: usersTable.lastName,
      },
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.userId, usersTable.id)) 
    .where(and(...queryConditions))

  
  const products = rows.map(row => ({
    ...row,
    reviews: [] 
  }))

  // Define the master grid once
  const productsGrid = (
    <div id="products-grid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6 max-w-7xl mx-auto">
      {products.map((product: any) => (
        <div class="w-full rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between p-6 h-[420px]">
          
          <div class="w-full h-40 bg-gray-50 relative overflow-hidden rounded-xl mb-4">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'}
              alt={product.productName}
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div class="flex-1 flex flex-col justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-900 tracking-tight flex flex-col mb-1">
                {product.productName}
                <span class="text-xs text-indigo-500 font-normal mt-0.5">
                  Seller: {product.seller?.name} {product.seller?.lastName}
                </span>
              </h2>
              <div class="mb-2">
                <span class="text-xl font-extrabold text-indigo-600">${product.price}</span>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">{product.description}</p>
            </div>
            <div class="mb-2 mt-auto">

              <label class="text-sm font-medium text-gray-500">Stock disponibile: </label>
              <span class="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                {product.stock}
              </span>
            </div>
          </div>

          <div class="flex gap-3 mt-4">
            <button class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm text-center cursor-pointer">
              Info
            </button>



            {/* Popup modale */}
          <div
  id={`modal-${product.id}`}
  class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
  onclick="if(event.target === this) this.classList.add('hidden')"
>
  <div class="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
    <h3 class="text-lg font-bold text-gray-900">Aggiungi al carrello</h3>
    <p class="text-sm text-gray-500">
      {/* 1. AGGIUNTO L'ID AL BADGE DEL MODALE */}
      Disponibili: <span id={`modal-stock-${product.id}`} class="font-semibold text-indigo-600">{product.stock}</span>
    </p>

    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-gray-700">Quantità</label>
      <input
        id={`qty-${product.id}`}
        type="number"
        min="1"
        max={product.stock}
        value="1"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        oninput={`
          const val = parseInt(this.value);
          if (val > ${product.stock}) this.value = ${product.stock};
          if (val < 1 || isNaN(val)) this.value = 1;
        `}
      />
    </div>

    <div class="flex gap-2 mt-1">
      <button
        type="button"
        onclick={`document.getElementById('modal-${product.id}').classList.add('hidden')`}
        class="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Annulla
      </button>
      
      <button
        type="button"
        onclick={`
          const qtyInput = document.getElementById('qty-${product.id}');
          const qty = parseInt(qtyInput.value, 10);
          
          if (isNaN(qty) || qty < 1) return;

          // 2. Invia la richiesta ad HTMX
          htmx.ajax('GET', '/addToCart/${product.id}?quantity=' + qty, { swap: 'none' });
          
          // 3. Chiude il modale immediatamente
          document.getElementById('modal-${product.id}').classList.add('hidden');
          
          // 4. Calcola il nuovo livello di stock a schermo
          const stockBadge = document.getElementById('stock-badge-${product.id}');
          if (stockBadge) {
            const currentStock = parseInt(stockBadge.innerText, 10);
            const newStock = Math.max(0, currentStock - qty);
            
            // 5. SE LO STOCK SI AZZERA: Fai sparire la card del prodotto dal DOM
            if (newStock <= 0) {
              const productCard = document.getElementById('product-card-${product.id}');
              if (productCard) {
                productCard.style.transition = 'all 0.3s ease';
                productCard.style.opacity = '0';
                productCard.style.transform = 'scale(0.95)';
                setTimeout(() => productCard.remove(), 300);
              }
            } else {
              // 6. ALTRIMENTI: Aggiorna i contatori grafici normalmente
              stockBadge.innerText = newStock;
              const modalStockBadge = document.getElementById('modal-stock-${product.id}');
              if (modalStockBadge) modalStockBadge.innerText = newStock;
              
              qtyInput.max = newStock;
              qtyInput.value = "1";
            }
          }
        `}
        class="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
      >
        Conferma
      </button>
          </div>
            </div>
          </div>

          {/* Bottone che apre il modale */}
          <button
            onclick={`document.getElementById('modal-${product.id}').classList.remove('hidden')`}
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm text-center cursor-pointer"
          >
            Aggiungi
          </button>
          </div>

        </div>
      ))}
    </div>
  )

  // If HTMX requests just a category filter patch swap, return the raw grid segment
  if (partial) {
    return productsGrid
  }

  return (
    <div class="bg-gray-50/50 min-h-screen pb-12">
      {/* Navigation Header */}
      <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">

            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                TechStore
              </a>
            </div>

            <div class="flex items-center gap-4">
              <button hx-get="/cart-preview" hx-target="#cart-drawer" hx-swap="innerHTML" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </button>

              <span class="h-6 w-px bg-gray-200"></span>

              <div id="profile-section">
                {session?.username ? (
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium text-gray-700">
                      Ciao, <strong class="text-indigo-600">{session.username}</strong>
                    </span>
                    <button
                      class="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                      onclick="document.getElementById('confirm-logout-modal').classList.remove('hidden')"
                    >
                      Disconnetti
                    </button>
                  </div>
                ) : (
                  <div class="flex items-center gap-2">
                    <button hx-get="/login-modal" hx-target="#modal" hx-swap="innerHTML" class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer">
                      Log In
                    </button>
                    <button hx-get="/signup-modal" hx-target="#modal" hx-swap="innerHTML" class="inline-flex items-center justify-center text-sm font-semibold py-2.5 px-6 rounded-xl border-2 border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer">
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 px-6 pt-8 max-w-7xl mx-auto">
        Marketplace
      </h1>

      {/* Category Filter Controls */}
      <div class="flex gap-2 mt-4 mb-2 max-w-7xl mx-auto px-6 overflow-x-auto pb-2">
        {["", "Tech", "Toy", "Auto"].map((cat) => (
          <button 
            hx-get={cat === "" ? "/marketplace" : `/marketplace?category=${cat}`} 
            hx-target="#products-grid" 
            hx-swap="outerHTML"
            class={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              category === cat 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            {cat === "" ? "Tutti" : cat}
          </button>
        ))}
      </div>

      {/* Primary Grid Anchor */}
      {productsGrid}

      <div id="cart-drawer"></div>

      {/* Global Modals Appended Container */}
      <div id="modal"></div>
      {session?.username && <ConfirmLogoutModal />}
    </div>
  )
}