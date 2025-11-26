-- CreateTable
CREATE TABLE "companies" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "brand_name" VARCHAR(255),
    "about_text" TEXT,
    "site_url" VARCHAR(255),
    "contact_url" VARCHAR(255),
    "wp_base_url" VARCHAR(255) NOT NULL,
    "wp_username" VARCHAR(255) NOT NULL,
    "wp_app_password_secret_name" VARCHAR(255) NOT NULL,
    "wp_default_status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
