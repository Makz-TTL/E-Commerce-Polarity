CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY,
	"sess" jsonb NOT NULL,
	"expire" timestamp with time zone NOT NULL
);
