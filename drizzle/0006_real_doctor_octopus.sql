CREATE TABLE `cleaning_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`establishment_id` integer,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`cleaning_areas` text NOT NULL,
	`products` text NOT NULL,
	`employee_id` integer,
	`employee_name` text,
	`notes` text,
	`log_date` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cleaning_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`establishment_id` integer,
	`name` text NOT NULL,
	`days_of_week` text NOT NULL,
	`cleaning_hours` text NOT NULL,
	`duration` integer NOT NULL,
	`products` text NOT NULL,
	`cleaning_areas` text NOT NULL,
	`employee_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`establishment_id`) REFERENCES `establishments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `personnel`(`id`) ON UPDATE no action ON DELETE no action
);
