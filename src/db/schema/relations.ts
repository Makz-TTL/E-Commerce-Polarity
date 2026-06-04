
import { users } from "./users"
import { products } from "./products"
import { reviews } from "./reviews"
import { productUsefulness } from "./productUsefulness"
import {orders} from "./orders"
import { defineRelations } from "drizzle-orm/relations";

export default defineRelations({ users, products, reviews, productUsefulness, orders }, (r) => ({
  users: {
    reviews: r.many.reviews(),
    orders: r.many.orders()
  },
  products: {
    seller: r.one.users({
      from: r.products.userId,
      to: r.users.id,
    }),
    reviews: r.many.reviews(),
    productUsefulness: r.many.productUsefulness(),
  },
  reviews: {
    user: r.one.users({
      from: r.reviews.userId,
      to: r.users.id
    }),
    product: r.one.products({
      from: r.reviews.productId,
      to: r.products.id
    }),
 
  },
  productUsefulness: {
    product: r.one.products({
      from: r.productUsefulness.productId,
      to: r.products.id,
    }),
    user: r.one.users({
      from: r.productUsefulness.userId,
      to: r.users.id,
    }),
  },
  orders: {
    user: r.one.users({
      from: r.orders.userId,
      to: r.users.id,
    }),
    product: r.one.products({
      from: r.orders.productId,
      to: r.products.id,
    }),
  },
}))



