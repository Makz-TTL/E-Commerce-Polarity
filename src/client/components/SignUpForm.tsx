type Props = {
    values: {
        nome: string,
        cognome: string,
        username: string,
        email: string,
        password: string
    },
    errors?: {
        nome?: string,
        cognome?: string,
        username?: string,
        email?: string,
        password?: string
    }
}

//export const SignUpFormId = "sign-up-form"


export default function SignUpForm ({ values, errors }: Props){
    return (
        <div id="registerDiv" class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

                <h1 class="text-2xl font-bold text-gray-800 mb-2"> Registrati </h1>
                <p class="text-gray-500 text-sm mb-6"> Compila i campi per registrarti </p>

                <form 
                    hx-post="/signUp"
                    hx-target="#registerDiv"
                    hx-swap="outerHTML"
                >
                    <div class="flex gap-3">
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1" for="nome"> Nome </label>
                            <input type="text" name="nome" value={values.nome} required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            {errors?.nome ?
                                <div class="text-red-600 text-sm mt-1">
                                    {errors?.nome}
                                </div>
                                : null
                            }
                        </div>

                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1" for="cognome"> Cognome </label>
                            <input type="text" name="cognome" value={values.cognome} required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            {errors?.cognome ?
                                <div class="text-red-600 text-sm mt-1">
                                    {errors?.cognome}
                                </div> 
                                : null
                            }     
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"> Username </label>
                        <input type="text" name="username" value={values.username} required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors?.username ?
                            <div class="text-red-600 text-sm mt-1">
                                {errors.username}
                            </div>
                            : null
                        }
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
                        <input type="email" name="email" value={values.email} required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors?.email ?
                            <div class="text-red-600 text-sm mt-1">
                                {errors.email}
                            </div>
                            : null
                        }
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="text" name="password" value={values.password} required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        {errors?.password ?
                            <div class="text-red-600 text-sm mt-1">
                                {errors.password}
                            </div>
                            : null
                        }
                    </div>

                    <button type="submit"
                        class="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors mt-2">
                        Registrati
                    </button>

                    <p class="text-center text-sm text-gray-500">
                        Hai già un account? <a href="/login" class="text-blue-600 hover:underline"> Accedi </a>
                    </p>
                </form>
            </div>
        </div>
    )
}