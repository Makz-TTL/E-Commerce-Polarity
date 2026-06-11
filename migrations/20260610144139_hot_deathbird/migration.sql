CREATE TABLE "orders" (
	"id" serial PRIMARY KEY,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer NOT NULL,
	"totalPrice" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productUsefulness" (
	"id" serial PRIMARY KEY,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"usefulness" boolean
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY,
	"userId" integer NOT NULL,
	"productName" text NOT NULL,
	"description" text,
	"price" double precision NOT NULL,
	"stock" integer NOT NULL,
	"category" text NOT NULL,
	"imageUrl" text,
	"status" text,
	"reliability" double precision
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"lastName" text NOT NULL,
	"eMail" text NOT NULL UNIQUE,
	"userName" text NOT NULL UNIQUE,
	"password" text NOT NULL,
	"cookie" text,
	"resetToken" text,
	"resetTokenExpiry" text
);
