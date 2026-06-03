import { defineRelations } from "drizzle-orm"
import { users } from "./users"
import { products } from "./products"
import { reviews } from "./reviews"
import { productUsefulness } from "./productUsefulness"
import { orders } from "./orders"

export const relations = defineRelations(
  { users, products, reviews, productUsefulness, orders },
  (r) => ({
    users: {
      orders: r.many.orders({
        from: r.users.id,
        to: r.orders.userId,
      }),
      reviews: r.many.reviews({
        from: r.users.id,
        to: r.reviews.userId,
      }),
      usefulnessVotes: r.many.productUsefulness({
        from: r.users.id,
        to: r.productUsefulness.userId,
      }),
      soldProducts: r.many.orders({
        from: r.users.id,
        to: r.orders.userId,
      }),
    },
    products: {
      reviews: r.many.reviews({
        from: r.products.id,
        to: r.reviews.productId,
      }),
      seller: r.one.users({
        from: r.products.userId,
        to: r.users.id,
      }),
    },
    reviews: {
      author: r.one.users({
        from: r.reviews.userId,
        to: r.users.id,
      }),
      product: r.one.products({
        from: r.reviews.productId,
        to: r.products.id,
      }),
      usefulness: r.many.productUsefulness({
        from: r.reviews.productId,
        to: r.productUsefulness.productId,
      }),
    },
    orders: {
      buyer: r.one.users({
        from: r.orders.userId,
        to: r.users.id,
      }),
      product: r.one.products({
        from: r.orders.productId,
        to: r.products.id,
      }),
    },
  }),
)
