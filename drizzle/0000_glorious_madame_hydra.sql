CREATE TABLE `token_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`mint` text,
	`owner_user_id` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` integer NOT NULL
);
