import { Session } from "fastify"
import LoginForm from "./LoginForm"

type InputProps = {
  session?: Session
  error?: string
}

const ProfileSection = ({ session, error }: InputProps) => {
  if (session?.username) {
    return (
      <div id="profile-section">
        <p class="text-lg">
          Logged in as <strong>{session.username}</strong>
        </p>
        <button
          class="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
          hx-get="/confirm-logout-modal"
          hx-target="#modal"
          hx-swap="innerHTML"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div id="profile-section">
      <LoginForm
        values={{
          username: "",
          password: "",
        }}
      />

      <div>ciao mare</div>
    </div>
  )
}

export default ProfileSection
