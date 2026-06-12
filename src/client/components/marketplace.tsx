import { db } from "../../db"
import { Session } from "fastify"
import ConfirmLogoutModal from "./ConfirmLogoutModal"
import { products as productsTable, users as usersTable } from "../../db/schema"
import { eq, gt, and, sql, like } from "drizzle-orm" // 👈 aggiunto "like"

type MarketplaceProps = {
  searchParams?: { category?: string; search?: string } // 👈 aggiunto search
  partial?: boolean
  session?: Session
}

// Spostiamo la mappa fuori dal componente così viene istanziata una sola volta
const AVAILABLE_CATEGORIES = [
  { value: "", label: "Tutte le categorie" },
  { value: "Tech", label: "Tech" },
  { value: "Toys", label: "Toys" },
  { value: "Cars", label: "Cars" },
  { value: "Sport&Outdoor", label: "Sport & Outdoor" },
  { value: "Hobby", label: "Hobby" },
  { value: "Collectibles", label: "Collectibles" },
  { value: "Other", label: "Altro" }
]

export default async function Marketplace({ searchParams, partial, session }: MarketplaceProps) {
  const category = searchParams?.category ? searchParams.category.trim() : ""
  const search = searchParams?.search ? searchParams.search.trim() : "" // 👈 nuovo

  const queryConditions = [
    gt(productsTable.stock, 0),
    eq(productsTable.status, "approved")
  ]

  // 2. Logica di filtro ottimizzata per le nuove categorie
  if (category) {
    // Usiamo ilike per un match case-insensitive (es. "tech" troverà anche "Tech")
    // Inoltre gestisce in modo più sicuro stringhe complesse come "Sport&Outdoor"
    queryConditions.push(like(productsTable.category, category))
  }

  //filtra per nome prodotto (case-insensitive)
  if (search) {
    queryConditions.push(like(productsTable.productName, `%${search}%`))
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
      status: productsTable.status,
      seller: {
        name: usersTable.name,
        lastName: usersTable.lastName,
        userName: usersTable.userName,
      },
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.userId, usersTable.id))
    .where(and(...queryConditions))

  const products = rows.map(row => ({
    ...row,
    reviews: []
  }))

  const productsGrid = (
    <div id="products-grid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6 max-w-7xl mx-auto">
      {products.length === 0 ? ( // 👈 nuovo: empty state
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-14 h-14 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
          </svg>
          <p class="text-gray-500 font-medium text-lg">Nessun prodotto trovato</p>
          <p class="text-gray-400 text-sm mt-1">Prova con un altro termine o categoria</p>
        </div>
      ) : (
        products.map((product: any) => {
          const isOwnProduct = session?.username && session.username === product.seller?.userName;

          let productCover = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
          if (product.imageUrl) {
            try {
              const images = JSON.parse(product.imageUrl);
              if (Array.isArray(images) && images.length > 0) {
                productCover = images[0];
              }
            } catch (e) {
              productCover = product.imageUrl;
            }
          }

          return (
            <div id={`product-card-${product.id}`} class="w-full rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl flex flex-col justify-between">
              <div class="w-full aspect-[4/3] bg-gray-50 overflow-hidden rounded-t-xl hover:cursor-pointer group" onclick={`window.location.href='/product/${product.id}'`}>
                <img
                  src={productCover}
                  alt={product.productName}
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              <div class="flex-1 flex flex-col justify-between p-4 min-w-0">
                <div class="min-w-0">
                  <h2 class="text-xl font-bold text-gray-900 tracking-tight truncate mb-0.5" title={product.productName}>
                    {product.productName}
                  </h2>
                  <div class="my-1.5 flex items-center gap-1.5">
                    <label class="text-xs font-medium text-gray-400">Stock disponibile:</label>
                    <span id={`stock-badge-${product.id}`} class="inline-block bg-gray-100 text-gray-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {product.stock}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div class="pr-3">
                    <span class="text-2xl font-extrabold text-gray-900">${product.price.toLocaleString("it-IT")}</span>
                  </div>

                  {isOwnProduct ? (
                    <button
                      disabled
                      class="w-32 bg-gray-100 text-gray-400 font-medium py-2 px-3 rounded-xl text-xs text-center cursor-not-allowed border border-gray-200"
                    >
                      Tuo prodotto
                    </button>
                  ) : (
                    <button
                      type="button"
                      onclick={`
                        const btn = this;
                        const badge = document.getElementById('stock-badge-${product.id}');
                        const card = document.getElementById('product-card-${product.id}');
                        
                        btn.addEventListener('htmx:afterRequest', function(e) {
                          if (e.detail.successful && badge) {
                            const currentStock = parseInt(badge.innerText, 10);
                            const newStock = Math.max(0, currentStock - 1);
                            
                            if (newStock <= 0 && card) {
                              card.style.transition = 'all 0.3s ease';
                              card.style.opacity = '0';
                              card.style.transform = 'scale(0.95)';
                              setTimeout(() => card.remove(), 300);
                            } else {
                              badge.innerText = newStock;
                            }
                          }
                        }, { once: true });

                        htmx.ajax('GET', '/addToCart/${product.id}?quantity=1', { swap: 'none', elt: btn });
                      `}
                      class="w-32 h-10 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2 px-2 rounded-xl transition-colors shadow-sm text-xs text-center cursor-pointer"
                    >
                      Aggiungi
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  if (partial) {
    return productsGrid
  }

  return (
    <div class="bg-gray-50/50 min-h-screen pb-12">
      <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                TechStore
              </a>
            </div>

            <div class="flex items-center gap-4">
              <button onclick="window.location.href='/cart'" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </button>

              <div id="profile-section">
                {session?.username ? (
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium text-gray-700">
                      Ciao, <strong class="text-indigo-600">{session.username}</strong>
                    </span>
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

              <span class="h-6 w-px bg-gray-200"></span>

              {session?.username && (
                <button onclick="window.location.href='/profile'" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 px-6 pt-8 max-w-7xl mx-auto">
        Marketplace
      </h1>

      {/* 👇 NUOVA BARRA: filtri categoria + search bar affiancati */}
      <div class="flex flex-col sm:flex-row gap-3 mt-4 mb-2 max-w-7xl mx-auto px-6">
        
        {/* Filtri categoria */}
        <div class="flex gap-2 overflow-x-auto pb-1 shrink-0">
          <label for="category-filter" class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Filtri:
          </label>
          <select
            id="category-filter"
            name="category"
            hx-get="/marketplace"
            hx-target="#products-grid"
            hx-swap="outerHTML"
            class="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer transition-colors"
          >
            {AVAILABLE_CATEGORIES.map((cat) => (
              // 3. Il confronto dell'attributo 'selected' ora è coerente con la logica case-insensitive
              <option value={cat.value} selected={category.toLowerCase() === cat.value.toLowerCase()}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search bar */}
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
            </svg>
          </div>
          <input
            id="search-input"
            type="text"
            name="search"
            placeholder="Cerca prodotti..."
            hx-get="/marketplace"
            hx-target="#products-grid"
            hx-swap="outerHTML"
            hx-trigger="input changed delay:400ms, search"
            hx-include="[name='search']" // si include da solo
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
        </div>

      </div>

      {productsGrid}

      <div id="cart-drawer"></div>
      <div id="modal"></div>
      {session?.username && <ConfirmLogoutModal />}
    </div>
  )
}