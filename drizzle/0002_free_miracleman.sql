CREATE TABLE `diary_devices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`device_type` text NOT NULL,
	`device_name` text NOT NULL,
	`min_temp` real NOT NULL,
	`max_temp` real NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `temperature_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` integer NOT NULL,
	`reading_date` text NOT NULL,
	`hour` integer NOT NULL,
	`temperature` real NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `diary_devices`(`id`) ON UPDATE no action ON DELETE no action
);
