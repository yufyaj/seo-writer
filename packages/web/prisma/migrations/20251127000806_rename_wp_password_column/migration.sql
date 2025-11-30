-- Rename column wp_app_password_secret_name to wp_app_password
ALTER TABLE "companies" RENAME COLUMN "wp_app_password_secret_name" TO "wp_app_password";

-- Change column type to TEXT for encrypted data
ALTER TABLE "companies" ALTER COLUMN "wp_app_password" TYPE TEXT;
