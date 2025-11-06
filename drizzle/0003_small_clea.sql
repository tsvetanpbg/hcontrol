ALTER TABLE `establishments` ADD `eik_verified` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `establishments` ADD `eik_verification_date` text;--> statement-breakpoint
ALTER TABLE `personnel` ADD `photo_url` text;--> statement-breakpoint
ALTER TABLE `personnel` ADD `work_book_number` text NOT NULL;--> statement-breakpoint
ALTER TABLE `personnel` ADD `work_book_validity` text NOT NULL;