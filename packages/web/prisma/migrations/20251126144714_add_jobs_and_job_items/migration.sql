-- CreateTable
CREATE TABLE "jobs" (
    "id" BIGSERIAL NOT NULL,
    "post_profile_id" BIGINT NOT NULL,
    "trigger_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "error_message" TEXT,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_items" (
    "id" BIGSERIAL NOT NULL,
    "job_id" BIGINT NOT NULL,
    "post_profile_id" BIGINT NOT NULL,
    "post_profile_article_type_id" BIGINT NOT NULL,
    "keyword" VARCHAR(255),
    "title" VARCHAR(512),
    "wp_post_id" BIGINT,
    "wp_post_url" VARCHAR(512),
    "wp_media_id" BIGINT,
    "status" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_post_profile_id_fkey" FOREIGN KEY ("post_profile_id") REFERENCES "post_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_post_profile_id_fkey" FOREIGN KEY ("post_profile_id") REFERENCES "post_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_post_profile_article_type_id_fkey" FOREIGN KEY ("post_profile_article_type_id") REFERENCES "post_profile_article_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
