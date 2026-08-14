-- Prisma Migrate: add_outbox_claimed_at
-- Created: 2026-08-14
-- Source: prisma/schema.prisma (OutboxEvent model)
-- Purpose: جداسازی claimedAt از retryCount — رویداد سالم دیگر DLQ نمی‌شود

-- ستون claimedAt — زمان آخرین claim توسط dispatcher
ALTER TABLE "outbox_events" ADD COLUMN "claimedAt" TIMESTAMP;

-- ایندکس ترکیبی جدید: (processedAt, claimedAt, createdAt)
CREATE INDEX IF NOT EXISTS "outbox_events_processedAt_claimedAt_createdAt_idx"
  ON "outbox_events"("processedAt", "claimedAt", "createdAt");

-- ایندکس قدیمی (processedAt, createdAt) اکنون زیرمجموعهٔ ایندکس جدید است و حذف می‌شود
DROP INDEX IF EXISTS "outbox_events_processedAt_createdAt_idx";
