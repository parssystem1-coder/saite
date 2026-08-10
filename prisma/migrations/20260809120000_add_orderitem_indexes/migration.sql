-- Prisma Migrate: add_orderitem_indexes
-- Created: 2026-08-09
-- Source: prisma/schema.prisma (OrderItem model)
-- Purpose: افزودن ایندکس روی FKهای OrderItem برای بهبود performance JOIN

-- ایندکس روی orderId برای JOIN با جدول orders و query سفارشات یک مشتری
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- ایندکس روی productId برای JOIN با جدول products و query محصولات یک سفارش
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
