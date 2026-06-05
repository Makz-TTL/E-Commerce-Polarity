CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"totalPrice" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productUsefulness" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"usefulness" boolean
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productName" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"stock" integer NOT NULL,
	"category" text NOT NULL,
	"imageUrl" text
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lastName" text NOT NULL,
	"eMail" text NOT NULL,
	"userName" text NOT NULL,
	"password" text NOT NULL,
	"cookie" text NOT NULL,
	CONSTRAINT "users_eMail_unique" UNIQUE("eMail"),
	CONSTRAINT "users_userName_unique" UNIQUE("userName")
);
