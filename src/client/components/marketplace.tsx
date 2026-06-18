import { db } from "../../db"
import type { FastifySessionObject } from "@fastify/session"
import ConfirmLogoutModal from "./ConfirmLogoutModal"
import { products as productsTable, users as usersTable } from "../../db/schema"
import { eq, gt, and, like, ilike } from "drizzle-orm"
import { getCartCount } from "../helpers/cartCounter"
import OtpForm from "./OtpForm"
import Navbar from "./Navbar"

type MarketplaceProps = {
  searchParams?: { category?: string; search?: string }
  partial?: boolean
  session?: FastifySessionObject
}

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
  const search = searchParams?.search ? searchParams.search.trim() : ""

  const cartCount = await getCartCount(session?.username)

  const queryConditions = [
    gt(productsTable.stock, 0),
    eq(productsTable.status, "approved")
  ]

  let isVerified = true
  let currentUser: any = null
  if (session?.username) {
    const [found] = await db.select().from(usersTable).where(eq(usersTable.userName, session.username)).limit(1)
    currentUser = found
    isVerified = currentUser?.isVerified ? true : false
  }

  if (category) {
    queryConditions.push(like(productsTable.category, category))
  }

  if (search) {
    queryConditions.push(ilike(productsTable.productName, `%${search}%`))
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
    .where(and(eq(productsTable.isDisable, false), // <--- Condizione fissa
      ...queryConditions))

  const products = rows.map(row => ({
    ...row,
    reviews: []
  }))

  const productsGrid = (
    <div id="products-grid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6 max-w-7xl mx-auto">
      {products.length === 0 ? (
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-14 h-14 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
          </svg>
          <p class="text-gray-500 font-medium text-lg">Nessun prodotto trovato</p>
          <p class="text-gray-400 text-sm mt-1">Prova con un altro termine o categoria</p>
        </div>
      ) : (
        products.map((product: any) => {
          const isOwnProduct = session?.username && session.username === product.seller?.userName

          let productCover = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
          if (product.imageUrl) {
            try {
              const images = JSON.parse(product.imageUrl)
              if (Array.isArray(images) && images.length > 0) {
                productCover = images[0]
              }
            } catch (e) {
              productCover = product.imageUrl
            }
          }

          return (
            <a
              href={`/product/${product.id}`}
              id={`product-card-${product.id}`}
              class="w-full rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:cursor-pointer flex flex-col justify-between"
            >
              <div class="w-full aspect-[4/3] bg-gray-50 overflow-hidden rounded-t-xl group">
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
                      onclick="event.stopPropagation();"
                      class="w-32 bg-gray-100 text-gray-400 font-medium py-2 px-3 rounded-xl text-xs text-center cursor-not-allowed border border-gray-200"
                    >
                      Tuo prodotto
                    </button>
                  ) : (
                    <button
                      type="button"
                      onclick={`
                        event.stopPropagation();
                        event.preventDefault();
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
                      class="flex items-center gap-2 h-10 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2 px-4 rounded-xl transition-colors shadow-sm text-xs text-center cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                      </svg>
                      Aggiungi
                    </button>
                  )}
                </div>
              </div>
            </a>
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
      <Navbar session={session} currentUser={currentUser} cartCount={cartCount} />

      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 px-6 pt-8 max-w-7xl mx-auto">
        Marketplace
      </h1>

      <div class="flex flex-col sm:flex-row gap-3 mt-4 mb-2 max-w-7xl mx-auto px-6">
        <div class="relative shrink-0" id="category-dropdown">
          <button
            type="button"
            onclick="
              const menu = document.getElementById('category-menu');
              const arrow = document.getElementById('dropdown-arrow');
              const isOpen = !menu.classList.contains('hidden');
              if (isOpen) {
                menu.classList.add('opacity-0', 'scale-95');
                menu.classList.remove('opacity-100', 'scale-100');
                setTimeout(() => menu.classList.add('hidden'), 150);
                arrow.classList.remove('rotate-180');
              } else {
                menu.classList.remove('hidden');
                setTimeout(() => {
                  menu.classList.remove('opacity-0', 'scale-95');
                  menu.classList.add('opacity-100', 'scale-100');
                }, 10);
                arrow.classList.add('rotate-180');
              }
            "
            class="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2.5 shadow-sm hover:border-indigo-400 transition-colors cursor-pointer min-w-[180px] justify-between"
          >
            <span id="category-label">Tutte le categorie</span>
            <svg id="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <div
            id="category-menu"
            class="hidden absolute z-50 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden opacity-0 scale-95 transition-all duration-150 origin-top"
          >
            {AVAILABLE_CATEGORIES.map((cat) => (
              <button
                type="button"
                onclick={`
                  document.getElementById('category-label').innerText = '${cat.label}';
                  const menu = document.getElementById('category-menu');
                  const arrow = document.getElementById('dropdown-arrow');
                  menu.classList.add('opacity-0', 'scale-95');
                  menu.classList.remove('opacity-100', 'scale-100');
                  setTimeout(() => menu.classList.add('hidden'), 150);
                  arrow.classList.remove('rotate-180');
                  document.getElementById('category-value').value = '${cat.value}';
                  htmx.trigger(document.getElementById('category-value'), 'change');
                `}
                class="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            id="category-value"
            type="hidden"
            name="category"
            value=""
            hx-get="/"
            hx-target="#products-grid"
            hx-swap="outerHTML"
            hx-trigger="change"
            hx-include="#search-input"
          />
        </div>

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
            hx-include="#category-value"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 placeholder-gray-400 placeholder:font-normal shadow-sm hover:border-indigo-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
          />
        </div>
      </div>

      {productsGrid}

      <div id="cart-drawer"></div>
      <div id="modal"></div>
      {session?.username && <ConfirmLogoutModal />}

      {session?.username && !isVerified && (
        <div
          id="otp-verification-overlay"
          class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          hx-get="/resend-verification"
          hx-trigger="revealed"
          hx-swap="none"
        >
          <OtpForm email={currentUser!.eMail} />
        </div>
      )}
    </div>
  )
}