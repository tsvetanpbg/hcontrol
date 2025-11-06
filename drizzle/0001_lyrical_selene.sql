CREATE TABLE `establishments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`establishment_type` text NOT NULL,
	`employee_count` integer NOT NULL,
	`manager_name` text NOT NULL,
	`manager_phone` text NOT NULL,
	`manager_email` text NOT NULL,
	`company_name` text NOT NULL,
	`eik` text NOT NULL,
	`registration_address` text NOT NULL,
	`contact_email` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personnel` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`establishment_id` integer NOT NULL,
	`full_name` text NOT NULL,
	`egn` text NOT NULL,
	`position` text NOT NULL,
	`work_book_image_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE no action
);
