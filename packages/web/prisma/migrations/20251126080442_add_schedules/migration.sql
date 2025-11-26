-- CreateTable
CREATE TABLE "post_profile_schedules" (
    "post_profile_id" BIGINT NOT NULL,
    "schedule_type" VARCHAR(20) NOT NULL DEFAULT 'none',
    "daily_time" VARCHAR(5),
    "weekly_day_of_week" INTEGER,
    "weekly_time" VARCHAR(5),
    "cron_expression" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_profile_schedules_pkey" PRIMARY KEY ("post_profile_id")
);

-- AddForeignKey
ALTER TABLE "post_profile_schedules" ADD CONSTRAINT "post_profile_schedules_post_profile_id_fkey" FOREIGN KEY ("post_profile_id") REFERENCES "post_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
