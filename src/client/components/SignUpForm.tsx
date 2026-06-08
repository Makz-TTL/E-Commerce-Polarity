type Props = {
    values?: {
        nome?: string,
        cognome?: string,
        username?: string,
        email?: string,
        password?: string
    },
    errors?: {
        nome?: string,
        cognome?: string,
        username?: string,
        email?: string,
        password?: string
    },
    isEdit?: boolean,               // 👈 Flag per identificare se siamo in modifica profilo
    onEditPasswordClick?: string    // 👈 Codice JS nativo per gestire il comportamento del bottone password
}

export default function SignUpForm({ values = {}, errors, isEdit = false, onEditPasswordClick }: Props) {
    return (
       <div id="registerDiv" class="p-6">
            <p class="text-gray-500 text-sm mb-6">
                {isEdit ? "Modifica i tuoi dati personali" : "Compila i campi per registrarti"}
            </p>

            <form 
                hx-post={isEdit ? "/editProfile" : "/signUp"} 
                hx-target="#registerDiv" // Cerca l'ID qui sopra e lo sostituisce
                hx-swap="outerHTML"
                class="space-y-4"
            >
                <div class="flex gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="nome"> Nome </label>
                        <input type="text" name="nome" value={values.nome || ""} required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        {errors?.nome && (
                            <div class="text-red-600 text-xs mt-1">{errors.nome}</div>
                        )}
                    </div>

                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1" for="cognome"> Cognome </label>
                        <input type="text" name="cognome" value={values.cognome || ""} required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors?.cognome && (
                            <div class="text-red-600 text-xs mt-1">{errors.cognome}</div>
                        )}     
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"> Username </label>
                    <input type="text" name="username" value={values.username || ""} required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors?.username && (
                        <div class="text-red-600 text-xs mt-1">{errors.username}</div>
                    )}
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
                    <input type="email" name="email" value={values.email || ""} required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors?.email && (
                        <div class="text-red-600 text-xs mt-1">{errors.email}</div>
                    )}
                </div>

                {/* 🌟 LOGICA CONDIZIONALE PER LA PASSWORD */}
                {isEdit ? (
                    <div class="pt-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sicurezza</label>
                        <button
                          type="button"
                          onclick={onEditPasswordClick || "alert('Funzionalità password non configurata')"}
                          class="w-full py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer text-center"
                        >
                          Modifica Password
                        </button>
                    </div>
                ) : (
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" name="password" value={values.password || ""} required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors?.password && (
                            <div class="text-red-600 text-xs mt-1">{errors.password}</div>
                        )}
                    </div>
                )}

                <button type="submit"
                    class="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors mt-4 cursor-pointer">
                    {isEdit ? "Salva Modifiche" : "Registrati"}
                </button>

                {!isEdit && (
                    <p class="text-center text-sm text-gray-500 pt-2">
                        Hai già un account? <a href="/login" 
                        hx-get="/login-modal"
                        hx-target="#modal"
                        hx-swap="innerHTML"
                        class="text-blue-600 hover:underline"> Accedi </a>
                    </p>
                )}
            </form>
        </div>
    )
}