type Porps = {
    error? : string,
    success? : string
}

export default function ForgotPasswordForm({ error, success} : Porps){
    return (
        <div id="registerDiv" class="p-6">
            <p class="text-gray-500 text-sm mb-6">
                Inserisci la tua email e ti manderemo un codice per reimpostare la password.
            </p>

            <form
                hx-post="/forgot-password"
                hx-target="#registerDiv"
                hx-swap="outerHTML"
                class="space-y-4"
            >
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" name="email" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {error && <p class="text-red-600 text-xs"> {error} </p>}
                {success && <p class="text-green-600 text-xs"> {success} </p>}

                <button type="submit"
                    class="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    Invia codice
                </button>
                
            </form>
        </div>
    )
}