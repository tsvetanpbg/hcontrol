ALTER TABLE `users` ADD `manager_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profile_image_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` integer DEFAULT 0 NOT NULL;