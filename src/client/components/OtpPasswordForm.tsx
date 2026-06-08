type Props = {
    email: string
    error?: string
}

export default function OtpPasswordForm({ email, error }: Props) {
    return (
        <div id="registerDiv" class="p-6">
            <p class="text-gray-500 text-sm mb-6">
                Abbiamo inviato un codice a 6 cifre a <strong class="text-blue-600">{email}</strong>.
            </p>

            <form
                hx-post="/verify-password-otp"
                hx-target="#registerDiv"
                hx-swap="outerHTML"
                class="space-y-4"
            >
                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-gray-700" for="otp">Codice di verifica</label>
                    <input
                        type="text"
                        id="otp"
                        name="otp"
                        placeholder="000000"
                        maxlength={6}
                        pattern="\d{6}"
                        required
                        autofocus
                        class={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-mono tracking-widest outline-none focus:ring-2 ${
                            error
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-300 focus:ring-blue-500"
                        }`}
                    />
                    {error && (
                        <p class="text-red-600 text-xs mt-0.5">{error}</p>
                    )}
                </div>

                <button
                    type="submit"
                    class="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
                >
                    Verifica e Salva
                </button>
            </form>
        </div>
    )
}