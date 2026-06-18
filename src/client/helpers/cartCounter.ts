import { db } from "../../db"

export async function getCartCount(username?: string): Promise<number> {
    if (!username) return 0

    const user = await db.query.users.findFirst({
        where: { userName: username }
    })

    if (!user) return 0

    const cartItems = await db.query.cart.findMany({
        where: { userId: user.id },
        with: {
        cartItem: true // <-- Fondamentale per leggere lo stato "isDisable"
        }
    })

    const activeCartItems = cartItems.filter(item => {
        return item.cartItem && item.cartItem.isDisable === false;
    });

    return activeCartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}