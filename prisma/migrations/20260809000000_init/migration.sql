-- Prisma Migrate: init
-- Created: 2026-08-09
-- Source: prisma/schema.prisma
-- Target: PostgreSQL 17 + pgvector

-- ── Extensions ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "vector";

-- ── Enums ───────────────────────────────────────────

CREATE TYPE "PriceType" AS ENUM ('fixed', 'quote_only');
CREATE TYPE "StockStatus" AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'on_request');
CREATE TYPE "ProductCondition" AS ENUM ('new', 'refurbished');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE "PaymentIntentStatus" AS ENUM ('created', 'redirect_required', 'pending', 'succeeded', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded', 'chargeback');
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled', 'refunded');
CREATE TYPE "TransactionType" AS ENUM ('payment', 'refund', 'fee', 'settlement', 'adjustment');
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE "ShipmentStatus" AS ENUM ('pending', 'label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned');
CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed_amount', 'free_shipping');

-- ── Customers ───────────────────────────────────────

CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- ── Products ────────────────────────────────────────

CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "priceType" "PriceType" NOT NULL,
    "price" INTEGER,
    "compareAtPrice" INTEGER,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'in_stock',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "keyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specs" JSONB,
    "technology" TEXT,
    "colorSupport" TEXT,
    "usageClass" TEXT,
    "warrantyMonths" INTEGER,
    "condition" "ProductCondition" NOT NULL DEFAULT 'new',
    "compatibleWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consumables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_category_createdAt_idx" ON "products"("category", "createdAt");
CREATE INDEX "products_brand_idx" ON "products"("brand");
CREATE INDEX "products_stockStatus_idx" ON "products"("stockStatus");

-- ── Orders ──────────────────────────────────────────

CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "shippingAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orders_customerId_createdAt_idx" ON "orders"("customerId", "createdAt");

CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- ── Payment Intents ─────────────────────────────────

CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerCode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'created',
    "idempotencyKey" TEXT NOT NULL,
    "authority" TEXT,
    "transactionId" TEXT,
    "redirectUrl" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_intents_idempotencyKey_key" ON "payment_intents"("idempotencyKey");
CREATE UNIQUE INDEX "payment_intents_authority_key" ON "payment_intents"("authority");
CREATE INDEX "payment_intents_orderId_idx" ON "payment_intents"("orderId");

-- ── Outbox Events ───────────────────────────────────

CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outbox_events_processedAt_createdAt_idx" ON "outbox_events"("processedAt", "createdAt");

-- ── AI Usage Logs ───────────────────────────────────

CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "estimatedCostRial" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "gitSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_usage_logs_feature_createdAt_idx" ON "ai_usage_logs"("feature", "createdAt");

-- ── Feature Flags ───────────────────────────────────

CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 100,
    "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- ── Invoices ────────────────────────────────────────

CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "subtotal" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_customerId_createdAt_idx" ON "invoices"("customerId", "createdAt");

-- ── Transactions ────────────────────────────────────

CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "orderId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "provider" TEXT,
    "referenceId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "settledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_orderId_createdAt_idx" ON "transactions"("orderId", "createdAt");

-- ── Shipments ───────────────────────────────────────

CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'pending',
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "weightGrams" INTEGER,
    "dimensions" TEXT,
    "originAddress" JSONB,
    "destinationAddress" JSONB,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments"("orderId");
CREATE INDEX "shipments_carrier_status_idx" ON "shipments"("carrier", "status");

-- ── Shipping Rates ──────────────────────────────────

CREATE TABLE "shipping_rates" (
    "id" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "minWeight" INTEGER NOT NULL DEFAULT 0,
    "maxWeight" INTEGER,
    "baseCost" INTEGER NOT NULL,
    "perKgCost" INTEGER NOT NULL DEFAULT 0,
    "codFee" INTEGER NOT NULL DEFAULT 0,
    "estimatedDays" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipping_rates_carrier_zone_minWeight_key" ON "shipping_rates"("carrier", "zone", "minWeight");

-- ── Coupons ─────────────────────────────────────────

CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "applicableProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicableCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- ── Coupon Redemptions ──────────────────────────────

CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupon_redemptions_orderId_key" ON "coupon_redemptions"("orderId");
CREATE UNIQUE INDEX "coupon_redemptions_couponId_customerId_key" ON "coupon_redemptions"("couponId", "customerId");
CREATE INDEX "coupon_redemptions_customerId_idx" ON "coupon_redemptions"("customerId");

-- ── Campaigns ───────────────────────────────────────

CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "bannerUrl" TEXT,
    "targetUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- ── Email Logs ──────────────────────────────────────

CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'console',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_logs_to_createdAt_idx" ON "email_logs"("to", "createdAt");

-- ── SMS Logs ────────────────────────────────────────

CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'console',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sms_logs_to_createdAt_idx" ON "sms_logs"("to", "createdAt");

-- ── Pages ───────────────────────────────────────────

CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- ── Posts ───────────────────────────────────────────

CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "authorName" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- ── Menu Items ──────────────────────────────────────

CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT 'header',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- ── Foreign Keys ────────────────────────────────────

ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
