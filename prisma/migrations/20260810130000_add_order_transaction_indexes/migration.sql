-- Prisma Migrate: add_order_transaction_indexes
-- Created: 2026-08-10
-- Source: prisma/schema.prisma (Order & Transaction models)
-- Purpose: افزودن ایندکس‌های ترکیبی برای بهینه‌سازی کوئری‌های فیلتر وضعیت و پنل مالی

-- ایندکس روی status و createdAt برای فیلتر وضعیت سفارشات در پنل ادمین
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- ایندکس ترکیبی customerId, status و createdAt برای کوئری‌های پنل کاربری
CREATE INDEX IF NOT EXISTS "orders_customerId_status_createdAt_idx" ON "orders"("customerId", "status", "createdAt");

-- ایندکس روی invoiceId و status برای جستجوی تراکنش‌های فاکتور
CREATE INDEX IF NOT EXISTS "transactions_invoiceId_status_idx" ON "transactions"("invoiceId", "status");

-- ایندکس روی status و createdAt برای گزارش‌گیری تراکنش‌ها
CREATE INDEX IF NOT EXISTS "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt");
