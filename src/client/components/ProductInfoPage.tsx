import { products } from "../../db/schema"
import { Session } from "fastify"
import ConfirmLogoutModal from "./ConfirmLogoutModal"
import { getCartCount } from "../helpers/cartCounter"

type Product = typeof products.$inferSelect & {
  seller?: {
    userName?: string
    name?: string
    lastName?: string
  }
}

type Props = {
  product: Product
  session?: Session
}

export default async function ProductInfoPage({ product, session }: Props) {
  const currentPath = `/product/${product.id}`
  const isOwnProduct = session?.username && session.username === product.seller?.userName

  const getImages = (): string[] => {
    if (!product.imageUrl) {
      return ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80']
    }
    try {
      const parsed = JSON.parse(product.imageUrl)
      return Array.isArray(parsed) ? parsed : [product.imageUrl]
    } catch (e) {
      return [product.imageUrl]
    }
  }
  const cartCount = await getCartCount(session?.username)
  const images = getImages()

  return (
    <div class="bg-gray-50/50 min-h-screen pb-12">
      
      {/* Navbar */}
      <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                TechStore
              </a>
            </div>      

            <div class="flex items-center gap-4">
              <button onclick="window.location.href='/cart'" class="relative p-2.5 text-indigo-600 bg-gray-50 rounded-xl transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 scale-105">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span 
                    id="cart-count-badge" 
                    class={`absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${cartCount === 0 ? 'hidden' : ''}`}
                >
                    {cartCount}
                </span>
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
                    <button 
                      hx-get={`/login-modal?redirect=${encodeURIComponent(currentPath)}`}
                      hx-target="#modal" 
                      hx-swap="innerHTML" 
                      class="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Log In
                    </button>
                    <button 
                      hx-get={`/signup-modal?redirect=${encodeURIComponent(currentPath)}`}
                      hx-target="#modal" 
                      hx-swap="innerHTML" 
                      class="inline-flex items-center justify-center text-sm font-semibold py-2.5 px-6 rounded-xl border-2 border-gray-300 hover:border-indigo-400 transition-colors cursor-pointer"
                    >
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

      {/* Torna indietro */}
      <div class="max-w-5xl mx-auto px-6 mt-6">
        <a href="/" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Torna al Marketplace
        </a>
      </div>

      {/* Box Principale Prodotto */}
      <div class="max-w-5xl mx-auto px-6 mt-4">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8 items-start">
          
          {/* CAROSELLO IMMAGINI */}
          <div class="relative w-full h-80 md:h-[400px] rounded-xl overflow-hidden bg-gray-100 shadow-inner group flex items-center justify-center md:sticky md:top-24">
            {images.map((url, index) => (
              <img 
                src={url} 
                alt={`${product.productName} - Immagine ${index + 1}`} 
                data-carousel-item
                class={`absolute inset-0 w-full h-full object-cover transition-all duration-300 cursor-zoom-in ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                loading={index === 0 ? "eager" : "lazy"}
                onclick={`(() => {
                  const lightbox = document.getElementById('lightbox-modal');
                  lightbox.classList.remove('hidden');
                  const lbImgs = lightbox.querySelectorAll('[data-lightbox-item]');
                  const lbDots = lightbox.querySelectorAll('[data-lightbox-dot]');
                  
                  lbImgs.forEach((img, i) => {
                    if(i === ${index}) {
                      img.classList.replace('opacity-0', 'opacity-100');
                      img.classList.remove('pointer-events-none');
                      img.classList.replace('z-0', 'z-10');
                    } else {
                      img.classList.replace('opacity-100', 'opacity-0');
                      img.classList.add('pointer-events-none');
                      img.classList.replace('z-10', 'z-0');
                    }
                  });
                  if(lbDots.length > 0) {
                    lbDots.forEach((dot, i) => {
                      if(i === ${index}) dot.classList.replace('bg-white/40', 'bg-white');
                      else dot.classList.replace('bg-white', 'bg-white/40');
                    });
                  }
                })()`}
              />
            ))}

            {images.length > 1 && (
              <>
                <button 
                  type="button"
                  onclick={`(() => {
                    const container = this.parentElement;
                    const imgs = container.querySelectorAll('[data-carousel-item]');
                    const dots = container.querySelectorAll('[data-carousel-dot]');
                    let idx = Array.from(imgs).findIndex(i => i.classList.contains('opacity-100'));
                    imgs[idx].classList.replace('opacity-100', 'opacity-0');
                    imgs[idx].classList.add('pointer-events-none');
                    imgs[idx].classList.replace('z-10', 'z-0');
                    dots[idx].classList.replace('bg-indigo-600', 'bg-white/60');
                    idx = (idx - 1 + imgs.length) % imgs.length;
                    imgs[idx].classList.replace('opacity-0', 'opacity-100');
                    imgs[idx].classList.remove('pointer-events-none');
                    imgs[idx].classList.replace('z-0', 'z-10');
                    dots[idx].classList.replace('bg-white/60', 'bg-indigo-600');
                  })()`}
                  class="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <button 
                  type="button"
                  onclick={`(() => {
                    const container = this.parentElement;
                    const imgs = container.querySelectorAll('[data-carousel-item]');
                    const dots = container.querySelectorAll('[data-carousel-dot]');
                    let idx = Array.from(imgs).findIndex(i => i.classList.contains('opacity-100'));
                    imgs[idx].classList.replace('opacity-100', 'opacity-0');
                    imgs[idx].classList.add('pointer-events-none');
                    imgs[idx].classList.replace('z-10', 'z-0');
                    dots[idx].classList.replace('bg-indigo-600', 'bg-white/60');
                    idx = (idx + 1) % imgs.length;
                    imgs[idx].classList.replace('opacity-0', 'opacity-100');
                    imgs[idx].classList.remove('pointer-events-none');
                    imgs[idx].classList.replace('z-0', 'z-10');
                    dots[idx].classList.replace('bg-white/60', 'bg-indigo-600');
                  })()`}
                  class="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/10 backdrop-blur-xs px-2 py-1 rounded-full">
                  {images.map((_, index) => (
                    <span data-carousel-dot class={`w-2 h-2 rounded-full transition-all ${index === 0 ? 'bg-indigo-600' : 'bg-white/60'}`}></span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DETTAGLI PRODOTTO */}
          <div class="flex flex-col justify-between self-stretch">
            <div class="space-y-4">
              <span class="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                {product.category}
              </span>

              <h1 class="text-3xl font-bold text-gray-900 break-words">{product.productName}</h1>
              
              <div class="text-2xl font-extrabold text-indigo-600">
                ${product.price.toLocaleString("it-IT")}
              </div>

              <div class="pt-4 border-t border-gray-100">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">Descrizione</h3>
                <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words max-w-none">
                  {product.description || "Nessuna descrizione fornita per questo prodotto."}
                </p>
              </div>
            </div>

            {/* SEZIONE AMMINISTRAZIONE / ACQUISTO / STOCK */}
            <div class="pt-6 mt-8 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-400 uppercase tracking-wider font-medium">Disponibilità</p>
                <p id={`stock-status-${product.id}`} class="text-sm font-semibold text-gray-800 mt-0.5">
                  {product.stock > 0 ? (
                    <>
                      Stock disponibile: <span id={`stock-badge-${product.id}`} class="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">{product.stock}</span>
                    </>
                  ) : "Esaurito"}
                </p>
              </div>
              
              <div class="flex gap-3">
                {isOwnProduct ? (
                  <button
                    hx-delete={`/product/${product.id}`}
                    hx-confirm="Sei sicuro di voler eliminare definitivamente questo annuncio? L'azione è irreversibile."
                    hx-target="body"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Elimina Annuncio
                  </button>
                ) : (
                  <div id={`purchase-actions-${product.id}`} class={product.stock > 0 ? "flex gap-3" : "hidden"}>
                    <div
                      id={`modal-${product.id}`}
                      class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center cursor-default"
                      onclick="if(event.target === this) this.classList.add('hidden')"
                    >
                      <div class="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4" onclick="event.stopPropagation()">
                        <h3 class="text-lg font-bold text-gray-900">Aggiungi al carrello</h3>
                        <p class="text-sm text-gray-500">
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
                            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 bg-white"
                            oninput={`
                                    const max = parseInt(this.max);
                                    if (this.value !== '' && parseInt(this.value) > max) this.value = max;
                            `}
                            onblur={`
                                if (this.value === '' || parseInt(this.value) < 1) this.value = '1';
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

                              htmx.ajax('GET', '/addToCart/${product.id}?quantity=' + qty, { swap: 'none' });
                              document.getElementById('modal-${product.id}').classList.add('hidden');
                              
                              const stockBadge = document.getElementById('stock-badge-${product.id}');
                              if (stockBadge) {
                                const currentStock = parseInt(stockBadge.innerText, 10);
                                const newStock = Math.max(0, currentStock - qty);
                                
                                if (newStock <= 0) {
                                  document.getElementById('stock-status-${product.id}').innerText = 'Esaurito';
                                  document.getElementById('purchase-actions-${product.id}').remove();
                                } else {
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

                    <button
                      type="button"
                      onclick={`
                        event.stopPropagation();
                        const btn = this;
                        const badge = document.getElementById('stock-badge-${product.id}');
                        const statusContainer = document.getElementById('stock-status-${product.id}');
                        const actionsContainer = document.getElementById('purchase-actions-${product.id}');
                        
                        btn.addEventListener('htmx:afterRequest', function(e) {
                          if (e.detail.successful && badge) {
                            const currentStock = parseInt(badge.innerText, 10);
                            const newStock = Math.max(0, currentStock - 1);
                            
                            if (newStock <= 0) {
                              if (statusContainer) statusContainer.innerText = 'Esaurito';
                              if (actionsContainer) actionsContainer.remove();
                            } else {
                              badge.innerText = newStock;
                            }
                          }
                        }, { once: true });

                        htmx.ajax('GET', '/addToCart/${product.id}?quantity=1', { swap: 'none', elt: btn });
                      `}
                      class="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                      </svg>
                      Aggiungi al Carrello
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* FEEDBACK & RECENSIONI */}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mt-8">
          <div class="flex items-center gap-2 pb-4 border-b border-gray-100 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 class="text-lg font-bold text-gray-800">Recensioni e Commenti</h2>
            <span class="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">Presto disponibile</span>
          </div>

          <div class="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p class="text-gray-400 text-sm">
              La sezione dei commenti è in fase di sviluppo. <br />
              Presto potrai leggere le opinioni degli altri acquirenti e lasciare il tuo feedback!
            </p>
          </div>
        </div>

      </div>

      {/* LIGHTBOX MODAL (Ingrandimento Immagine a Schermo Intero) */}
      <div 
        id="lightbox-modal" 
        class="hidden fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 select-none"
        onclick="this.classList.add('hidden')"
      >
        {/* Pulsante di chiusura */}
        <button 
          type="button" 
          class="absolute top-4 right-4 text-white/70 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors z-50 cursor-pointer"
          onclick="document.getElementById('lightbox-modal').classList.add('hidden')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Contenitore Immagine Principale */}
        <div class="relative w-full max-w-5xl h-[80vh] flex items-center justify-center" onclick="event.stopPropagation()">
          {images.map((url, index) => (
            <img 
              src={url} 
              alt={`Ingrandimento ${index + 1}`} 
              data-lightbox-item
              class="absolute max-w-full max-h-full object-contain transition-all duration-300 opacity-0 z-0 pointer-events-none"
            />
          ))}

          {images.length > 1 && (
            <>
              {/* Freccia Sinistra / Precedente */}
              <button 
                type="button"
                onclick={`(() => {
                  const container = this.parentElement;
                  const imgs = container.querySelectorAll('[data-lightbox-item]');
                  const dots = document.querySelectorAll('[data-lightbox-dot]');
                  let idx = Array.from(imgs).findIndex(i => i.classList.contains('opacity-100'));
                  
                  imgs[idx].classList.replace('opacity-100', 'opacity-0');
                  imgs[idx].classList.add('pointer-events-none');
                  imgs[idx].classList.replace('z-10', 'z-0');
                  if(dots.length) dots[idx].classList.replace('bg-white', 'bg-white/40');
                  
                  idx = (idx - 1 + imgs.length) % imgs.length;
                  
                  imgs[idx].classList.replace('opacity-0', 'opacity-100');
                  imgs[idx].classList.remove('pointer-events-none');
                  imgs[idx].classList.replace('z-0', 'z-10');
                  if(dots.length) dots[idx].classList.replace('bg-white/40', 'bg-white');
                })()`}
                class="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all flex items-center justify-center cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Freccia Destra / Successiva */}
              <button 
                type="button"
                onclick={`(() => {
                  const container = this.parentElement;
                  const imgs = container.querySelectorAll('[data-lightbox-item]');
                  const dots = document.querySelectorAll('[data-lightbox-dot]');
                  let idx = Array.from(imgs).findIndex(i => i.classList.contains('opacity-100'));
                  
                  imgs[idx].classList.replace('opacity-100', 'opacity-0');
                  imgs[idx].classList.add('pointer-events-none');
                  imgs[idx].classList.replace('z-10', 'z-0');
                  if(dots.length) dots[idx].classList.replace('bg-white', 'bg-white/40');
                  
                  idx = (idx + 1) % imgs.length;
                  
                  imgs[idx].classList.replace('opacity-0', 'opacity-100');
                  imgs[idx].classList.remove('pointer-events-none');
                  imgs[idx].classList.replace('z-0', 'z-10');
                  if(dots.length) dots[idx].classList.replace('bg-white/40', 'bg-white');
                })()`}
                class="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all flex items-center justify-center cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Indicatori a pallino (Dots) in fondo al Lightbox */}
        {images.length > 1 && (
          <div class="mt-4 z-30 flex gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full" onclick="event.stopPropagation()">
            {images.map((_, index) => (
              <span data-lightbox-dot class="w-2 h-2 rounded-full transition-all bg-white/40"></span>
            ))}
          </div>
        )}
      </div>

      <div id="modal"></div>
      {session?.username && <ConfirmLogoutModal />}
    </div>
  )
}