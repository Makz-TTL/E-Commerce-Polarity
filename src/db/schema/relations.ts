import { users } from "./users"
import { products } from "./products"
import { reviews } from "./reviews"
import { productUsefulness } from "./productUsefulness"
import { orders } from "./orders"
import { wishlist } from "./wishlist"
import { defineRelations } from "drizzle-orm/relations";
import { cart } from "./cart"

export default defineRelations({ users, products, reviews, productUsefulness, orders, wishlist, cart }, (r) => ({
  users: {
    reviews: r.many.reviews(),
    orders: r.many.orders(),
    wishlist: r.many.wishlist(),
    productUsefulness: r.many.productUsefulness(),
  },
  
  products: {
   
    seller: r.one.users({
      from: r.products.userId, 
      to: r.users.id,
    }),
    reviews: r.many.reviews(),
    productUsefulness: r.many.productUsefulness(),
    orders: r.many.orders(), 
  },


  cart:{

    cartOwner: r.one.users({

      from: r.cart.userId,      // Assicurati che questi campi riflettano lo schema del tuo DB
      to: r.users.id,

    }),
    cartItem: r.one.products({

      from: r.cart.productId,   // Assicurati che il tuo schema cart abbia productId
      to: r.products.id,

    })

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


  wishlist: {
    user: r.one.users({
      from: r.wishlist.userId,
      to: r.users.id,
    }),
    product: r.one.products({
      from: r.wishlist.productId,
      to: r.products.id,
    }),
  },
}))