

export type ToastType = "success" | "cart" | "error" | "info" | "loading" | "warning"

const iconNameMap: {
  [key in ToastType]: string
} = {
  success: `
  <path
    d="M7.155 18.334c-.326.001-.64-.152-.874-.427L.377 10.963a1.563 1.563 0 01-.276-.489c-.065-.183-.099-.38-.1-.58-.005-.402.123-.79.355-1.078.232-.288.55-.452.881-.457.332-.005.652.15.89.432l5.033 5.918 10.712-12.61c.238-.282.558-.437.89-.432.333.005.65.17.882.459.232.288.36.676.356 1.08a1.69 1.69 0 01-.378 1.068L8.03 17.907c-.234.275-.548.428-.875.427z"
    fill="currentColor"
  />
  `,
  error: `
  <path
    d="M10 0a10 10 0 1010 10A10.011 10.011 0 0010 0zm0 15a1 1 0 110-2.001A1 1 0 0110 15zm1-4a1 1 0 01-2 0V6a1 1 0 012 0v5z"
    fill="currentColor"
  />
  `,
  cart: `
  <path
    
    d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>

    fill="currentColor"
  />
  `,
  info: `
  <path d="M10 20C8.02219 20 6.08879 19.4135 4.4443 18.3147C2.79981 17.2159 1.51809 15.654１ 

  <path d="M9.5 7C10.3284 7 11 6.32843 11 5.5C11 4.67158 10.3284 4 9.5 4C8.67158 4 8 4.67158 8 5.5C8 6.32843 8.67158 7 9.5 7Z" fill="currentColor"/>
  `,
  loading: `
  <path d="M18.7935 7.69003C19.2786 7.5626 19.5725 7.06416 19.4016 6.59262C19.0586 5.64638 18.5742 4.75567 17.9633 3.95143C17.169 2.90567 16.1765 2.0266 15.0425 1.36441C13.9084 0.702225 12.6551 0.269886 11.354 0.0920831C10.3533 -0.0446559 9.33952 -0.0287954 8.34691 0.137581C7.85225 0.220493 7.56259 0.721392 7.69002 1.20649V1.20649C7.81745 1.69158 8.31387 1.97618 8.81009 1.90326C9.57023 1.79155 10.3438 1.78721 11.108 1.89165C12.1728 2.03716 13.1986 2.39097 14.1266 2.93288C15.0547 3.4748 15.8669 4.19421 16.517 5.05003C16.9835 5.66425 17.3599 6.3401 17.6362 7.057C17.8166 7.525 18.3084 7.81746 18.7935 7.69003V7.69003Z" fill="currentColor"/>
  `,
  warning: `
  <path
    d="M10 0a10 10 0 1010 10A10.011 10.011 0 0010 0zm0 15a1 1 0 110-2.001A1 1 0 0110 15zm1-4a1 1 0 01-2 0V6a1 1 0 012 0v5z"
    fill="currentColor"
  />
  `
}

const createIconElement = (type: ToastType): HTMLDivElement => {
  const container = document.createElement("div")
  container.classList.add("icon")
  container.style.setProperty("--icon-size", "16")

  if (type === "loading") {
    container.classList.add("animate-spin")
  }

  const svgTemplate = `
  <svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
  >
    ${iconNameMap[type]}
  </svg>
  `


  container.innerHTML = svgTemplate
  return container
}

const createToast = (message: string, type: ToastType, autoRemove = true): HTMLDivElement => {
  const toastContainer = document.getElementById("toast")

  if (!toastContainer) {
    throw new Error("Toast container not found")
  }

  const toast = document.createElement("div")
  toast.classList.add("toast", `toast--${type}`)

  const iconContainer = document.createElement("div")
  iconContainer.classList.add("icon-container")
  const icon = createIconElement(type)
  iconContainer.appendChild(icon)
  toast.appendChild(iconContainer)

  const toastMessage = document.createElement("div")
  toastMessage.classList.add("toast__message")
  toastMessage.innerHTML = message
  toast.appendChild(toastMessage)

  toastContainer.appendChild(toast)

  if (autoRemove) {
    hideToast(toast)
  }

  return toast
}

const updateToast = (toast: HTMLDivElement, message: string, type?: ToastType) => {
  const toastMessage = toast.querySelector(".toast__message")
  if (!toastMessage) {
    throw new Error("Toast message not found")
  }

  toastMessage.innerHTML = message

  if (type) {
    toast.classList.remove("toast--success", "toast--error","toast--cart", "toast--info", "toast--loading", "toast--warning")
    toast.classList.add(`toast--${type}`)
    const icon = toast.querySelector(".icon")
    if (icon) {
      icon.remove()
      toast.prepend(createIconElement(type))
    }
  }
}

const hideToast = (toast: HTMLDivElement, timeout = 3000) => {
  setTimeout(() => {
    toast.classList.add("toast--hide")
    setTimeout(() => {
      toast.remove()
    }, 600)
  }, timeout)
}

export { createToast, updateToast, hideToast }
