import { users } from "./users"
import { products } from "./products"
import { reviews } from "./reviews"
import { productUsefulness } from "./productUsefulness"
import {orders} from "./orders"
import { relations } from "drizzle-orm/relations";



// Relazioni per gli UTENTI
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
  usefulnessVotes: many(productUsefulness),
  soldProducts: many(orders)
}));

// Relazioni per i PRODOTTI
export const productsRelations = relations(products, ({ one, many }) => ({
  reviews: many(reviews),
  seller: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
}));

// Relazioni per le RECENSIONI
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  author: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  usefulness: many(productUsefulness),
}));


// Relazioni per gli ORDINI
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {         //Relazione tra ORDINI e UTENTI (buyer).
    fields: [orders.userId],  //Un ordine ha un solo buyer.
    references: [users.id],
  }),
  product: many(products, {        //Relazione tra ORDINI e PRODOTTI.
    fields: [orders.productId],     //Un ordine può contenere più prodotti.
    references: [products.id],
  }),
}));