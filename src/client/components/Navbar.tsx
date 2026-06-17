import { Session } from "fastify"
import { User } from "../../db/schema/users"



const Navbar = ({
    session,
    cartCount = 0,
    currentUser
}: {
    session?: Session
    cartCount: number
    currentUser: User | undefined
}) => {
    return ( 
              <nav class="w-full bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex-shrink-0 flex items-center">
              <a href="/" class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                TechStore
              </a>
            </div>

            <div class="flex items-center gap-4">
              <a href="/cart" class="relative p-2.5 text-gray-600 hover:text-indigo-600 rounded-xl transition-all group hover:bg-gray-50 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 scale-105">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span
                  id="cart-count-badge"
                  class={`absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${cartCount === 0 ? 'hidden' : ''}`}
                >
                  {cartCount}
                </span>
              </a>

              <div id="profile-section">
                {session?.username ? (
                  <div class="flex items-center gap-3">
                    <a href={`/profile?username=${session.username}`} class="text-sm font-medium text-gray-700" style="cursor: pointer">
                      Ciao, <strong class="text-indigo-600">{session.username}</strong>
                    </a>
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
                <a href="/profile" class="relative p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 group-hover:scale-105 transition-transform">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  {currentUser?.hasUnseenModeration && (
                    <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>
    )
}

export default Navbar