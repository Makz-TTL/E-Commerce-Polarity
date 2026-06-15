// src/server/helpers/cart.ts
import { db } from "../../db"

export async function getCartCount(username?: string): Promise<number> {
    if (!username) return 0

    const user = await db.query.users.findFirst({
        where: { userName: username }
    })

    if (!user) return 0

    const cartItems = await db.query.cart.findMany({
        where: { userId: user.id }
    })

    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
}