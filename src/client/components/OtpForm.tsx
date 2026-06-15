type OtpFormProps = {
  email: string
  error?: string
}

export default function OtpForm({ email, error }: OtpFormProps) {
  return (
    <div
      id="otp-container"
      class="w-full max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl space-y-5"
    >
      <div>
        <h2 class="text-2xl font-extrabold text-gray-900 tracking-tight">
          Verifica la tua Email
        </h2>
        <p class="text-sm text-gray-500 mt-1 leading-relaxed">
          Abbiamo inviato un codice di verifica a 6 cifre a <strong class="text-indigo-600 font-semibold">{email}</strong>.
        </p>
      </div>

      <form
        hx-post="/verify-otp"
        hx-target="#otp-container"
        hx-swap="outerHTML"
        class="space-y-4"
      >
        <input type="hidden" name="email" value={email} />

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-gray-700" for="otp">
            Codice di Verifica
          </label>
          <input
            type="text"
            id="otp"
            name="otp"
            placeholder="000000"
            maxlength={6}
            pattern="\d{6}"
            required
            autofocus
            class={`w-full px-4 py-3 bg-gray-50/50 border rounded-xl text-center text-2xl font-mono tracking-widest outline-none transition-all duration-200 focus:bg-white focus:ring-4 ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10"
            }`}
          />
          {error && (
            <div class="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 flex-shrink-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          class="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl shadow-sm shadow-indigo-100 text-sm text-center transition-all cursor-pointer"
        >
          Verifica Account
        </button>
      </form>
    </div>
  )
}