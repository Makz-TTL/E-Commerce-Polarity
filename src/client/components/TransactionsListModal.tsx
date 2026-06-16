type Props = {
    soldOrders: {
        product: {productName: string} | null,
        quantity: number,
        totalPrice: number
    }[]
}

export default function TransitionListModal( {soldOrders}: Props ){
    return (
        <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onclick="if(event.target===this)this.remove()">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative">
                <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                <h2 class="text-lg font-bold text-gray-800 mb-4">Transazioni</h2>
                {soldOrders.length === 0 ? (
                <p class="text-gray-400 text-sm text-center py-6">Nessuna transazione</p>
                ) : (
                <ul class="divide-y divide-gray-100">
                    {soldOrders.map(order => (
                    <li class="flex items-center justify-between py-3 gap-4">
                        <div class="flex-1">
                        <p class="font-medium text-gray-800">{order.product?.productName ?? "Prodotto eliminato"}</p>
                        <p class="text-xs text-gray-400">Quantità: {order.quantity}</p>
                        </div>
                        <span class="text-emerald-600 font-bold">+${order.totalPrice.toLocaleString("it-IT")}</span>
                    </li>
                    ))}
                </ul>
                )}
            </div>
        </div>
    )
}