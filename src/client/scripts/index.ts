import "htmx.org"
import { createToast } from "./modules/toast"

declare global {
  interface Window {
    closeModal: (eventOrId: MouseEvent | string, remove?: boolean) => void
  }
}

window.closeModal = (eventOrId, remove = true) => {
  let modal: HTMLElement | null = null
  if (typeof eventOrId === "string") {
    modal = document.getElementById(eventOrId)
  } else {
    modal = (eventOrId.target as HTMLElement).closest(".modal__wrap")
  }

  if (modal) {
    if (remove) {
      modal.remove()
    } else {
      modal.classList.remove("is-open")
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // fai queste cose
  
  document.body.addEventListener("showSuccessToast", (ev) => {
    const event = ev as CustomEvent<{ message: string }>
    const { message } = event.detail

    createToast(message, "success")
  })
})
