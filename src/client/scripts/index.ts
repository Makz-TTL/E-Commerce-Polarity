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
  
  // ── Toast from redirect ──────────────────────────────────────────────────
  const params = new URLSearchParams(window.location.search)
  const msg = params.get("toast")
  if (msg) {
    const url = new URL(window.location.href)
    url.searchParams.delete("toast")
    window.history.replaceState({}, "", url)
    createToast(decodeURIComponent(msg), "success")
  }

  // ── Existing listeners ───────────────────────────────────────────────────
  document.body.addEventListener("showSuccessToast", (ev) => {
    const event = ev as CustomEvent<{ message: string }>
    createToast(event.detail.message, "success")
  })
  document.body.addEventListener("showAddedToCartToast", (ev) => {
    const event = ev as CustomEvent<{ message: string }>
    createToast(event.detail.message, "cart")
  })
  document.body.addEventListener("showErrorToast", (ev) => {
    const event = ev as CustomEvent<{ message: string }>
    createToast(event.detail.message, "error")
  })
})