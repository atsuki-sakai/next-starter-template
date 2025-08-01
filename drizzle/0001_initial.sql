-- Migration: Initial chat database schema
-- Created at: 2025-01-01

CREATE TABLE `chat_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);

CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`username` text NOT NULL,
	`content` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON UPDATE no action ON DELETE no action
);