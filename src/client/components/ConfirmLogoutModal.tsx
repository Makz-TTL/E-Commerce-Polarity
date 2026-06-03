import Modal from "./Modal"

export const confirmLogoutModalId = "confirm-logout-modal"

const ConfirmLogoutModal = () => {
  return (
    <Modal
      id={confirmLogoutModalId}
      title={<h2 class="text-xl font-bold">Conferma logout</h2>}
      footer={
        <div class={"flex items-center gap-4 justify-end"}>
          <button 
            class={"px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 active:bg-gray-800"}
            onclick={`closeModal('${confirmLogoutModalId}')`}
          >
            Annulla
          </button>
          <button 
            class={"px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800"}
            hx-post="/logout"
            hx-target="#profile-section"
            hx-swap="outerHTML"
          >
            Conferma
          </button>
        </div>
      }
      {...{
        "hx-on::after-request": `closeModal('${confirmLogoutModalId}')`
      }}
    >
      Sei sicuro di voler effettuare il logout? Tutti i dati non salvati andranno persi.
    </Modal>
  )
}

export default ConfirmLogoutModal
