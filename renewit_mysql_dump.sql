-- RenewIt (RemindIt) MySQL Database Dump
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Ready for 1-click import in cPanel phpMyAdmin

SET NAMES utf8mb4;
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- --------------------------------------------------------
-- Table structure for users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `timezone` VARCHAR(100) NOT NULL DEFAULT "Asia/Kathmandu",
  `email_verified_at` DATETIME(3) DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT "active",
  `role` VARCHAR(30) NOT NULL DEFAULT "user",
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for accounts (NextAuth)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `provider_account_id` VARCHAR(191) NOT NULL,
  `refresh_token` TEXT DEFAULT NULL,
  `access_token` TEXT DEFAULT NULL,
  `expires_at` INT DEFAULT NULL,
  `token_type` VARCHAR(50) DEFAULT NULL,
  `scope` VARCHAR(255) DEFAULT NULL,
  `id_token` TEXT DEFAULT NULL,
  `session_state` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_provider_provider_account_id_key` (`provider`, `provider_account_id`),
  KEY `accounts_user_id_fkey` (`user_id`),
  CONSTRAINT `accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for sessions (NextAuth)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) NOT NULL,
  `session_token` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_session_token_key` (`session_token`),
  KEY `sessions_user_id_fkey` (`user_id`),
  CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for verification_tokens
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `identifier` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  UNIQUE KEY `verification_tokens_token_key` (`token`),
  UNIQUE KEY `verification_tokens_identifier_token_key` (`identifier`, `token`),
  KEY `verification_tokens_user_id_fkey` (`user_id`),
  CONSTRAINT `verification_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for password_reset_tokens
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_reset_tokens_token_key` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for categories
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(100) DEFAULT NULL,
  `color` VARCHAR(50) DEFAULT NULL,
  `group` VARCHAR(50) DEFAULT NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `default_schedule` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for reminders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `owner_name` VARCHAR(150) DEFAULT NULL,
  `reference_number` VARCHAR(150) DEFAULT NULL,
  `provider_name` VARCHAR(255) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `expiry_date` DATE NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT "active",
  `is_recurring` TINYINT(1) NOT NULL DEFAULT 0,
  `recurrence_type` VARCHAR(30) DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_reminders_user_expiry` (`user_id`, `expiry_date`),
  KEY `idx_reminders_expiry` (`expiry_date`),
  KEY `idx_reminders_user_status` (`user_id`, `status`),
  KEY `reminders_category_id_fkey` (`category_id`),
  CONSTRAINT `reminders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reminders_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for reminder_schedules
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reminder_schedules` (
  `id` VARCHAR(36) NOT NULL,
  `reminder_id` VARCHAR(36) NOT NULL,
  `days_before` INT NOT NULL,
  `channel` VARCHAR(30) NOT NULL DEFAULT "email",
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `send_time` VARCHAR(10) NOT NULL DEFAULT "08:00",
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reminder_schedule` (`reminder_id`, `days_before`, `channel`),
  CONSTRAINT `reminder_schedules_reminder_id_fkey` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for notification_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `reminder_id` VARCHAR(36) NOT NULL,
  `notification_type` VARCHAR(50) NOT NULL,
  `channel` VARCHAR(30) NOT NULL DEFAULT "email",
  `scheduled_for` DATETIME(3) NOT NULL,
  `sent_at` DATETIME(3) DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT "pending",
  `provider_message_id` VARCHAR(255) DEFAULT NULL,
  `attempt_count` INT NOT NULL DEFAULT 0,
  `error_message` TEXT DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_notification` (`reminder_id`, `notification_type`, `scheduled_for`),
  KEY `idx_notification_logs_scheduled` (`scheduled_for`, `status`),
  KEY `notification_logs_user_id_fkey` (`user_id`),
  CONSTRAINT `notification_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notification_logs_reminder_id_fkey` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for renewal_history
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `renewal_history` (
  `id` VARCHAR(36) NOT NULL,
  `reminder_id` VARCHAR(36) NOT NULL,
  `previous_expiry_date` DATE NOT NULL,
  `new_expiry_date` DATE NOT NULL,
  `renewed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `renewal_history_reminder_id_fkey` (`reminder_id`),
  CONSTRAINT `renewal_history_reminder_id_fkey` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for notification_preferences
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `email_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `push_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `expiry_day_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `overdue_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `weekly_summary_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `summary_day` INT NOT NULL DEFAULT 1,
  `summary_time` VARCHAR(10) NOT NULL DEFAULT "08:00",
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_preferences_user_id_key` (`user_id`),
  CONSTRAINT `notification_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for push_subscriptions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `endpoint` VARCHAR(191) NOT NULL,
  `p256dh` VARCHAR(255) NOT NULL,
  `auth` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `push_subscriptions_endpoint_key` (`endpoint`),
  KEY `idx_push_subscriptions_user` (`user_id`),
  CONSTRAINT `push_subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for system_settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `group` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Data for users (Super Admin: rawindhakal@gmail.com / Admin123!@#)
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `timezone`, `email_verified_at`, `status`, `role`)
VALUES (
  "00000000-0000-0000-0000-000000000001",
  "Super Admin",
  "rawindhakal@gmail.com",
  "$2b$10$b5j0ghjn1.T7/fCXG4Ge6ubajDq95GcYrpwZk.T4c4jqpR/wBrck.",
  "Asia/Kathmandu",
  NOW(),
  "active",
  "super_admin"
) ON DUPLICATE KEY UPDATE `role`="super_admin", `status`="active";

-- Notification preferences for Super Admin
INSERT INTO `notification_preferences` (`id`, `user_id`, `email_enabled`, `push_enabled`, `expiry_day_enabled`, `overdue_enabled`, `weekly_summary_enabled`, `summary_day`, `summary_time`)
VALUES (
  "00000000-0000-0000-0000-000000000002",
  "00000000-0000-0000-0000-000000000001",
  1, 1, 1, 0, 1, 1, "08:00"
) ON DUPLICATE KEY UPDATE `email_enabled`=1;

-- --------------------------------------------------------
-- Data for categories
-- --------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000001", "Driving License", "driving-license", "🪪", "#3B82F6", "Documents", 1, 1, ) ON DUPLICATE KEY UPDATE `name`="Driving License", `icon`="🪪", `color`="#3B82F6", `group`="Documents", `sort_order`=1, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000002", "Passport", "passport", "📘", "#6366F1", "Documents", 1, 2, ) ON DUPLICATE KEY UPDATE `name`="Passport", `icon`="📘", `color`="#6366F1", `group`="Documents", `sort_order`=2, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000003", "National ID", "national-id", "🪪", "#8B5CF6", "Documents", 1, 3, ) ON DUPLICATE KEY UPDATE `name`="National ID", `icon`="🪪", `color`="#8B5CF6", `group`="Documents", `sort_order`=3, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000004", "Citizenship", "citizenship", "📄", "#EC4899", "Documents", 1, 4, ) ON DUPLICATE KEY UPDATE `name`="Citizenship", `icon`="📄", `color`="#EC4899", `group`="Documents", `sort_order`=4, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000005", "Visa", "visa", "✈️", "#F59E0B", "Documents", 1, 5, ) ON DUPLICATE KEY UPDATE `name`="Visa", `icon`="✈️", `color`="#F59E0B", `group`="Documents", `sort_order`=5, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000006", "Work Permit", "work-permit", "💼", "#10B981", "Documents", 1, 6, ) ON DUPLICATE KEY UPDATE `name`="Work Permit", `icon`="💼", `color`="#10B981", `group`="Documents", `sort_order`=6, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000007", "Bluebook", "bluebook", "📋", "#3B82F6", "Vehicle", 1, 10, ) ON DUPLICATE KEY UPDATE `name`="Bluebook", `icon`="📋", `color`="#3B82F6", `group`="Vehicle", `sort_order`=10, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000008", "Vehicle Tax", "vehicle-tax", "🚗", "#EF4444", "Vehicle", 1, 11, ) ON DUPLICATE KEY UPDATE `name`="Vehicle Tax", `icon`="🚗", `color`="#EF4444", `group`="Vehicle", `sort_order`=11, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000009", "Vehicle Insurance", "vehicle-insurance", "🛡️", "#F97316", "Vehicle", 1, 12, ) ON DUPLICATE KEY UPDATE `name`="Vehicle Insurance", `icon`="🛡️", `color`="#F97316", `group`="Vehicle", `sort_order`=12, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000010", "Vehicle Fitness", "vehicle-fitness", "🔧", "#84CC16", "Vehicle", 1, 13, ) ON DUPLICATE KEY UPDATE `name`="Vehicle Fitness", `icon`="🔧", `color`="#84CC16", `group`="Vehicle", `sort_order`=13, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000011", "Pollution Certificate", "pollution-certificate", "🌿", "#22C55E", "Vehicle", 1, 14, ) ON DUPLICATE KEY UPDATE `name`="Pollution Certificate", `icon`="🌿", `color`="#22C55E", `group`="Vehicle", `sort_order`=14, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000012", "Health Insurance", "health-insurance", "🏥", "#EC4899", "Insurance", 1, 20, ) ON DUPLICATE KEY UPDATE `name`="Health Insurance", `icon`="🏥", `color`="#EC4899", `group`="Insurance", `sort_order`=20, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000013", "Life Insurance", "life-insurance", "❤️", "#F43F5E", "Insurance", 1, 21, ) ON DUPLICATE KEY UPDATE `name`="Life Insurance", `icon`="❤️", `color`="#F43F5E", `group`="Insurance", `sort_order`=21, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000014", "Travel Insurance", "travel-insurance", "✈️", "#0EA5E9", "Insurance", 1, 22, ) ON DUPLICATE KEY UPDATE `name`="Travel Insurance", `icon`="✈️", `color`="#0EA5E9", `group`="Insurance", `sort_order`=22, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000015", "Property Insurance", "property-insurance", "🏠", "#78716C", "Insurance", 1, 23, ) ON DUPLICATE KEY UPDATE `name`="Property Insurance", `icon`="🏠", `color`="#78716C", `group`="Insurance", `sort_order`=23, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000016", "Internet Subscription", "internet-subscription", "🌐", "#6366F1", "Subscription", 1, 30, ) ON DUPLICATE KEY UPDATE `name`="Internet Subscription", `icon`="🌐", `color`="#6366F1", `group`="Subscription", `sort_order`=30, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000017", "Mobile Plan", "mobile-plan", "📱", "#8B5CF6", "Subscription", 1, 31, ) ON DUPLICATE KEY UPDATE `name`="Mobile Plan", `icon`="📱", `color`="#8B5CF6", `group`="Subscription", `sort_order`=31, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000018", "OTT / Streaming", "ott-streaming", "📺", "#E11D48", "Subscription", 1, 32, ) ON DUPLICATE KEY UPDATE `name`="OTT / Streaming", `icon`="📺", `color`="#E11D48", `group`="Subscription", `sort_order`=32, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000019", "Software License", "software-license", "💻", "#0891B2", "Subscription", 1, 33, ) ON DUPLICATE KEY UPDATE `name`="Software License", `icon`="💻", `color`="#0891B2", `group`="Subscription", `sort_order`=33, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000020", "Domain", "domain", "🔗", "#D97706", "Subscription", 1, 34, ) ON DUPLICATE KEY UPDATE `name`="Domain", `icon`="🔗", `color`="#D97706", `group`="Subscription", `sort_order`=34, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000021", "Hosting", "hosting", "☁️", "#059669", "Subscription", 1, 35, ) ON DUPLICATE KEY UPDATE `name`="Hosting", `icon`="☁️", `color`="#059669", `group`="Subscription", `sort_order`=35, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000022", "Membership", "membership", "🏷️", "#7C3AED", "Subscription", 1, 36, ) ON DUPLICATE KEY UPDATE `name`="Membership", `icon`="🏷️", `color`="#7C3AED", `group`="Subscription", `sort_order`=36, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000023", "Phone Warranty", "phone-warranty", "📱", "#6B7280", "Warranty", 1, 40, ) ON DUPLICATE KEY UPDATE `name`="Phone Warranty", `icon`="📱", `color`="#6B7280", `group`="Warranty", `sort_order`=40, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000024", "Laptop Warranty", "laptop-warranty", "💻", "#374151", "Warranty", 1, 41, ) ON DUPLICATE KEY UPDATE `name`="Laptop Warranty", `icon`="💻", `color`="#374151", `group`="Warranty", `sort_order`=41, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000025", "Appliance Warranty", "appliance-warranty", "🏠", "#9CA3AF", "Warranty", 1, 42, ) ON DUPLICATE KEY UPDATE `name`="Appliance Warranty", `icon`="🏠", `color`="#9CA3AF", `group`="Warranty", `sort_order`=42, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000026", "Electronics Warranty", "electronics-warranty", "🔌", "#4B5563", "Warranty", 1, 43, ) ON DUPLICATE KEY UPDATE `name`="Electronics Warranty", `icon`="🔌", `color`="#4B5563", `group`="Warranty", `sort_order`=43, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000027", "Company Registration", "company-registration", "🏢", "#1D4ED8", "Business", 1, 50, ) ON DUPLICATE KEY UPDATE `name`="Company Registration", `icon`="🏢", `color`="#1D4ED8", `group`="Business", `sort_order`=50, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000028", "Business License", "business-license", "📃", "#2563EB", "Business", 1, 51, ) ON DUPLICATE KEY UPDATE `name`="Business License", `icon`="📃", `color`="#2563EB", `group`="Business", `sort_order`=51, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000029", "PAN / VAT", "pan-vat", "📊", "#0D9488", "Business", 1, 52, ) ON DUPLICATE KEY UPDATE `name`="PAN / VAT", `icon`="📊", `color`="#0D9488", `group`="Business", `sort_order`=52, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000030", "Contract", "contract", "📝", "#7C3AED", "Business", 1, 53, ) ON DUPLICATE KEY UPDATE `name`="Contract", `icon`="📝", `color`="#7C3AED", `group`="Business", `sort_order`=53, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000031", "Employee Certificate", "employee-certificate", "👤", "#DC2626", "Business", 1, 54, ) ON DUPLICATE KEY UPDATE `name`="Employee Certificate", `icon`="👤", `color`="#DC2626", `group`="Business", `sort_order`=54, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000032", "Bank Card", "bank-card", "💳", "#0369A1", "Other", 1, 60, ) ON DUPLICATE KEY UPDATE `name`="Bank Card", `icon`="💳", `color`="#0369A1", `group`="Other", `sort_order`=60, `default_schedule`=;
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `color`, `group`, `is_system`, `sort_order`, `default_schedule`) VALUES ("cat-0000-0000-0000-000000000033", "Custom Reminder", "custom", "⭐", "#F59E0B", "Other", 1, 99, ) ON DUPLICATE KEY UPDATE `name`="Custom Reminder", `icon`="⭐", `color`="#F59E0B", `group`="Other", `sort_order`=99, `default_schedule`=;

-- --------------------------------------------------------
-- Data for system_settings
-- --------------------------------------------------------
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_ads.enabled", "false", "google_ads", "Enable Google AdSense ads across the app") ON DUPLICATE KEY UPDATE `value`="false", `group`="google_ads", `description`="Enable Google AdSense ads across the app";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_ads.client_id", "", "google_ads", "Google AdSense Publisher ID (ca-pub-xxxxxxxxxx)") ON DUPLICATE KEY UPDATE `value`="", `group`="google_ads", `description`="Google AdSense Publisher ID (ca-pub-xxxxxxxxxx)";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_ads.top_banner_slot", "", "google_ads", "Top banner ad unit slot ID") ON DUPLICATE KEY UPDATE `value`="", `group`="google_ads", `description`="Top banner ad unit slot ID";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_ads.sidebar_slot", "", "google_ads", "Sidebar ad unit slot ID") ON DUPLICATE KEY UPDATE `value`="", `group`="google_ads", `description`="Sidebar ad unit slot ID";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_ads.bottom_slot", "", "google_ads", "Bottom / footer ad unit slot ID") ON DUPLICATE KEY UPDATE `value`="", `group`="google_ads", `description`="Bottom / footer ad unit slot ID";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_ads.auto_ads", "false", "google_ads", "Enable Google Auto Ads") ON DUPLICATE KEY UPDATE `value`="false", `group`="google_ads", `description`="Enable Google Auto Ads";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_auth.enabled", "false", "google_auth", "Enable Google One-Tap / OAuth sign in") ON DUPLICATE KEY UPDATE `value`="false", `group`="google_auth", `description`="Enable Google One-Tap / OAuth sign in";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_auth.client_id", "", "google_auth", "Google OAuth Client ID") ON DUPLICATE KEY UPDATE `value`="", `group`="google_auth", `description`="Google OAuth Client ID";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("google_auth.client_secret", "", "google_auth", "Google OAuth Client Secret") ON DUPLICATE KEY UPDATE `value`="", `group`="google_auth", `description`="Google OAuth Client Secret";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.provider", "gmail", "email", "Email delivery service (gmail, smtp)") ON DUPLICATE KEY UPDATE `value`="gmail", `group`="email", `description`="Email delivery service (gmail, smtp)";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.smtp_host", "smtp.gmail.com", "email", "SMTP host") ON DUPLICATE KEY UPDATE `value`="smtp.gmail.com", `group`="email", `description`="SMTP host";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.smtp_port", "587", "email", "SMTP port (587 or 465)") ON DUPLICATE KEY UPDATE `value`="587", `group`="email", `description`="SMTP port (587 or 465)";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.smtp_user", "", "email", "SMTP / Gmail account email") ON DUPLICATE KEY UPDATE `value`="", `group`="email", `description`="SMTP / Gmail account email";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.smtp_pass", "", "email", "SMTP / Gmail App Password") ON DUPLICATE KEY UPDATE `value`="", `group`="email", `description`="SMTP / Gmail App Password";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.from_name", "RenewIt", "email", "Sender display name") ON DUPLICATE KEY UPDATE `value`="RenewIt", `group`="email", `description`="Sender display name";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("email.from_address", "noreply@renewit.app", "email", "Sender email address") ON DUPLICATE KEY UPDATE `value`="noreply@renewit.app", `group`="email", `description`="Sender email address";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("push.enabled", "true", "push", "Enable PWA Web Push notifications") ON DUPLICATE KEY UPDATE `value`="true", `group`="push", `description`="Enable PWA Web Push notifications";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("push.public_key", "BPCP8QkDDz7Z1sWG9UDLLOLUfnSPaAdTjm4p6w5wlQWm3Bw_QSlnGaBAp1nvdIpxweH0FlcGwyqCm5Oy3wQ13H8", "push", "VAPID Public Key for web push") ON DUPLICATE KEY UPDATE `value`="BPCP8QkDDz7Z1sWG9UDLLOLUfnSPaAdTjm4p6w5wlQWm3Bw_QSlnGaBAp1nvdIpxweH0FlcGwyqCm5Oy3wQ13H8", `group`="push", `description`="VAPID Public Key for web push";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("push.private_key", "dR0F10ONJQ9ILKcSNoKWZDl3DbTVAegKYOiPm-arteA", "push", "VAPID Private Key for web push") ON DUPLICATE KEY UPDATE `value`="dR0F10ONJQ9ILKcSNoKWZDl3DbTVAegKYOiPm-arteA", `group`="push", `description`="VAPID Private Key for web push";
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`) VALUES ("push.subject", "mailto:support@renewit.app", "push", "VAPID Subject mailto or URL") ON DUPLICATE KEY UPDATE `value`="mailto:support@renewit.app", `group`="push", `description`="VAPID Subject mailto or URL";

SET FOREIGN_KEY_CHECKS = 1;
