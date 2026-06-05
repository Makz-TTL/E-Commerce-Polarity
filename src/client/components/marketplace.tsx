import { db } from "../../db"
import { Session } from "fastify"
// 1. Import the modal component
import ConfirmLogoutModal from "./ConfirmLogoutModal"

type MarketplaceProps = {
  searchParams?: { category?: string }
  partial?: boolean
  session?: Session
}

export default async function Marketplace({ searchParams, partial, session }: MarketplaceProps) {
  const category = searchParams?.category ? searchParams.category.trim() : ""

  const products = await db.query.products.findMany({
    where: category ? { category } : undefined,
    with: {
      seller: true,
      reviews: true
    }
  })

  const productsGridClass = (
    <div id="products-grid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6 max-w-7xl mx-auto">
      {products.map((product: any) => (
        <div class="w-full rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between p-6 h-[350px]">
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <h2 class="text-xl font-bold text-gray-900 tracking-tight flex flex-col mb-2">
                {product.productName}
                <span class="text-xs text-indigo-500 font-normal mt-1">
                  Seller: {product.seller?.name} {product.seller?.lastName}
                </span>
              </h2>
              <div class="mb-4">
                <span class="text-xl font-extrabold text-indigo-600">${product.price}</span>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{product.description}</p>
            </div>
            <div class="mb-5 mt-auto">
              <label class="text-sm font-medium text-gray-500">Categoria: </label>
              <span class="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">
                {product.category}
              </span>
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm text-center">Info</button>
            <button class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm text-center">Cart</button>
          </div>
        </div>
      ))}
    </div>
  )

  if (partial) {
    return productsGridClass
  }

  return (
    <div class="bg-gray-50/50 min-h-screen pb-12">
      <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">

            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                TechStore
              </a>
            </div>

            <div class="flex items-center gap-4">
              <button hx-get="/cart-preview" hx-target="#cart-drawer" hx-swap="innerHTML" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group" aria-label="Vedi carrello">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </button>

              <span class="h-6 w-px bg-gray-200" aria-hidden="true"></span>

              <div id="profile-section">
                {session?.username ? (
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium text-gray-700">
                      Ciao, <strong class="text-indigo-600">{session.username}</strong>
                    </span>
                    <button
                      class="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-colors"
                      onclick="document.getElementById('confirm-logout-modal').classList.remove('hidden')"
                    >
                      Disconnetti
                    </button>

                  </div>
                ) : (
                  <div class="flex items-center gap-2">
                    <button
                      hx-get="/login-modal"
                      hx-target="#modal"
                      hx-swap="innerHTML"
                      class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors"
                    >
                      Log In
                    </button>
                    <button
                      hx-get="/signup-modal"
                      hx-target="#modal"
                      hx-swap="innerHTML"
                      class="inline-flex items-center justify-center text-sm font-semibold py-2.5 px-6 rounded-xl border-2 border-gray-300 hover:border-indigo-400 transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </nav>

      <h1 class="text-2xl font-bold mb-4 p-6 pb-0">Marketplace</h1>

      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
        {products.map((product) => (
          <div class="max-w-sm rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between">
            <div class="w-full h-48 bg-gray-100 relative overflow-hidden">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'}
                alt={product.productName}
                class="w-full h-full object-cover transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div class="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 tracking-tight flex flex-col mb-2">
                  {product.productName}
                  <span class="text-xs text-indigo-500 font-normal mt-1">Seller: {product.seller?.name} {product.seller?.lastName}</span>
                </h2>
                <div class="mb-4">
                  <span class="text-xl font-extrabold text-indigo-600">${product.price}</span>
                </div>
                <p class="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-3">{product.description}</p>
                <div class="mb-5">
                  <label class="text-sm font-medium text-gray-500">Categoria: </label>
                  <span class="inline-block bg-gray-200 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">{product.category}</span>
                </div>
              </div>
              <div class="flex gap-3 mt-auto">
                <button class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm text-center">Info</button>
                <button class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm text-sm text-center">Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div class="flex justify-center gap-3 mt-6 max-w-7xl mx-auto px-6">
        <button hx-get="/marketplace" hx-target="#products-grid" hx-swap="outerHTML"
          class={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === "" ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Tutti
        </button>
        <button hx-get="/marketplace?category=Tech" hx-target="#products-grid" hx-swap="outerHTML"
          class={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === "Tech" ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Tech
        </button>
        <button hx-get="/marketplace?category=Toy" hx-target="#products-grid" hx-swap="outerHTML"
          class={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === "Toy" ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Toy
        </button>
        <button hx-get="/marketplace?category=Auto" hx-target="#products-grid" hx-swap="outerHTML"
          class={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === "Auto" ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
          Auto
        </button>
      </div>

      {productsGridClass}

      <div id="cart-drawer"></div>

      {/* 2. RENDER THE MODAL COMPONENT IF USER IS LOGGED IN */}
      {session?.username && <ConfirmLogoutModal />}
    </div>
  )
}