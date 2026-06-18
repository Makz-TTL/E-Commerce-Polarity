ALTER TABLE "products" ADD COLUMN "isDisable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "productId" SET NOT NULL;