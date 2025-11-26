-- CreateTable
CREATE TABLE "post_profiles" (
    "id" BIGSERIAL NOT NULL,
    "company_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "wp_category_id" BIGINT,
    "keyword_strategy" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_profiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "post_profiles" ADD CONSTRAINT "post_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
