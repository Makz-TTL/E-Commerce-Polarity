CREATE TABLE "cart" (
	"id" serial PRIMARY KEY,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer NOT NULL
);
