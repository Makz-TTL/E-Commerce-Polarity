type Props = {
  redirectTo?: string;
  values?: {
    username?: string
    password?: string
  }
  error?: {
    username?: string
    password?: string
  }
}

export const loginFormId = "login-form"

export default function LoginForm({ values = {}, error, redirectTo = "/" }: Props) {
  return (
    <form 
      id={loginFormId}
      hx-post={`/login?redirect=${encodeURIComponent(redirectTo)}`}
      hx-target="this"
      hx-swap="outerHTML"
      hx-push-url="false"
      class="space-y-5 w-full max-w-md mx-auto bg-white p-2"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-gray-700" for="username">
          Username
        </label>
        <div class="relative">
          <input
            class={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-4 ${
              error?.username 
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10"
            }`}
            type="text"
            id="username"
            name="username"
            placeholder="Inserisci il tuo username"
            required
            value={values.username || ""}
          />
        </div>
        {error?.username && (
          <div class="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error.username}
          </div>
        )}
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-gray-700" for="password">
          Password
        </label>
        <div class="relative">
          <input
            class={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-sm transition-all duration-200 outline-none focus:bg-white focus:ring-4 ${
              error?.password 
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10" 
                : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10"
            }`}
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            required
            value={values.password || ""}
          />
        </div>
        {error?.password && (
          <div class="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-0.5">
            <svg xmlns="http://www.w3.org/2000/xl" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error.password}
          </div>
        )}
      </div>

      <button
        class="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm shadow-indigo-100 text-sm text-center cursor-pointer"
        type="submit"
      >
        Accedi
      </button>

      <p class="text-center text-sm text-gray-500 pt-2">
        Hai dimenticato la password? <a 
          hx-get="/forgot-password-modal"
          hx-target="#login-form"
          hx-swap="outerHTML"
          class="text-blue-600 hover:underline"
          style="cursor: pointer"
        > 
          Recuperala!
        </a>
      </p>
    </form>
  )
}