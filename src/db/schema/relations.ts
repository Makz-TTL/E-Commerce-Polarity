import { users } from "./users"
import { products } from "./products"
import { reviews } from "./reviews"
import { productUsefulness } from "./productUsefulness"
import { orders } from "./orders"
import { wishlist } from "./wishlist"
import { relations } from "drizzle-orm"

export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  orders: many(orders),
  wishlist: many(wishlist),
  productUsefulness: many(productUsefulness),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  reviews: many(reviews),
  productUsefulness: many(productUsefulness),
  orders: many(orders),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}))

export const productUsefulnessRelations = relations(productUsefulness, ({ one }) => ({
  product: one(products, {
    fields: [productUsefulness.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productUsefulness.userId],
    references: [users.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
}))

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}))