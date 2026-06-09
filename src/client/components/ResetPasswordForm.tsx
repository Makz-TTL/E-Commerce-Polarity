type Props = {
    email: string
    error?: string
}

export default function ResetPasswordForm({ email, error }: Props) {
    return (
        <div id="registerDiv" class="p-6">
            <p class="text-gray-500 text-sm mb-6">
                Inserisci il codice ricevuto via email e scegli una nuova password.
            </p>

            <form
                hx-post="/reset-password"
                hx-target="#registerDiv"
                hx-swap="outerHTML"
                class="space-y-4"
            >
                <input type="hidden" name="email" value={email} />

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Codice di verifica</label>
                    <input type="text" name="otp" placeholder="000000" maxlength={6} required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nuova password</label>
                    <input type="password" name="newPassword" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Conferma nuova password</label>
                    <input type="password" name="confirmPassword" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {error && <p class="text-red-600 text-xs">{error}</p>}

                <button type="submit"
                    class="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    Reimposta password
                </button>
            </form>
        </div>
    )
}