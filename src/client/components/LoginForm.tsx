type Props = {
  values: {
    username: string
    password: string
  }
  error?: {
    username?: string
    password?: string
  }
}

export const loginFormId = "login-form"

const LoginForm = ({ 
  values, 
  error 
}: Props) => {
  return (
    <form 
      id={loginFormId}
      action={"/login"}
      method={"POST"}
      hx-boost={"true"}
      hx-target={`#${loginFormId}`}
      hx-swap="outerHTML"
      hx-push-url={"false"}
    >
      <div class="mb-4">
        <label class="block font-medium mb-1" for="username">
          Username
        </label>
        <input
          class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          type="text"
          id="username"
          name="username"
          required
          value={values.username}
        />
        {error?.username ?
          <div class="text-red-600 text-sm mt-1">
            {error?.username}
          </div>
          : null
        }
      </div>
      <div class="mb-4">
        <label class="block font-medium mb-1" for="password">
          Password
        </label>
        <input
          class="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          type="password"
          id="password"
          name="password"
          required
          value={values.password}
        />
        {error?.password ?
          <div class="text-red-600 text-sm mt-1">
            {error?.password}
          </div>
          : null
        }
      </div>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
        type="submit"
      >
        Login
      </button>
    </form>
  )
}

export default LoginForm
