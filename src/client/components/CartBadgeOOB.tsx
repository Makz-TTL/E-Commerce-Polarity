//Questo componente serve per permettere di aggioranre dinamicamente il simbolo della quantità nel cart.
type Props = { count: number }

export default function CartBadgeOOB({ count }: Props) {
    return (
        <span
            id="cart-count-badge"
            class={`absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${count === 0 ? 'hidden' : ''}`}
            hx-swap-oob="true"
        >
            {count}
        </span>
    )
}