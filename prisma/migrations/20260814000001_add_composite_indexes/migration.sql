-- Prisma Migrate: add_composite_indexes
-- Created: 2026-08-14
-- Source: prisma/schema.prisma (Coupon, Campaign, Post, Page, PaymentIntent, EmailLog, SmsLog models)
-- Purpose: ایندکس‌های ترکیبی برای کوئری‌های پرتکرار پنل ادمین و مسیرهای عمومی

-- اعتبارسنجی کوپن بر اساس active و expiresAt
CREATE INDEX IF NOT EXISTS "coupons_active_expiresAt_idx" ON "coupons"("active", "expiresAt");

-- لیست کمپین‌های فعال (active + بازهٔ زمانی)
CREATE INDEX IF NOT EXISTS "campaigns_active_dates_idx" ON "campaigns"("active", "startDate", "endDate");

-- مسیرهای عمومی بلاگ — پست‌های منتشرشده به‌ترتیب زمان انتشار
CREATE INDEX IF NOT EXISTS "posts_isPublished_publishedAt_idx" ON "posts"("isPublished", "publishedAt");

-- مسیرهای عمومی صفحات — صفحات منتشرشده
CREATE INDEX IF NOT EXISTS "pages_isPublished_idx" ON "pages"("isPublished");

-- پاکسازی انقضای PaymentIntent (پیش‌نیاز فاز ۴)
CREATE INDEX IF NOT EXISTS "payment_intents_status_expiresAt_idx" ON "payment_intents"("status", "expiresAt");

-- retention لاگ‌های ایمیل (پیش‌نیاز فاز ۳)
CREATE INDEX IF NOT EXISTS "email_logs_status_createdAt_idx" ON "email_logs"("status", "createdAt");

-- retention لاگ‌های پیامک (پیش‌نیاز فاز ۳)
CREATE INDEX IF NOT EXISTS "sms_logs_status_createdAt_idx" ON "sms_logs"("status", "createdAt");
