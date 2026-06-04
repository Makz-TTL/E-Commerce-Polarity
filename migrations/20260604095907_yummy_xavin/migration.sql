CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`userId` integer NOT NULL,
	`productId` integer NOT NULL,
	`quantity` integer NOT NULL,
	`totalPrice` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `productUsefulness` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`userId` integer NOT NULL,
	`productId` integer NOT NULL,
	`usefulness` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`userId` integer NOT NULL,
	`productName` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`stock` integer NOT NULL,
	`category` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`userId` integer NOT NULL,
	`productId` integer NOT NULL,
	`rating` integer NOT NULL,
	`title` text,
	`comment` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`lastName` text NOT NULL,
	`eMail` text NOT NULL UNIQUE,
	`userName` text NOT NULL UNIQUE,
	`password` text NOT NULL,
	`cookie` text NOT NULL
);
