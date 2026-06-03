CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`userName` text NOT NULL UNIQUE,
	`lastName` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`phone` integer
);
