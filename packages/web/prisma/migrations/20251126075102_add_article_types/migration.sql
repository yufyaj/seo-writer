-- CreateTable
CREATE TABLE "post_profile_article_types" (
    "id" BIGSERIAL NOT NULL,
    "post_profile_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "prompt_template" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_profile_article_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "post_profile_article_types" ADD CONSTRAINT "post_profile_article_types_post_profile_id_fkey" FOREIGN KEY ("post_profile_id") REFERENCES "post_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
