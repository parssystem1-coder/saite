-- Prisma Migrate: add_pg_trgm_search_indexes
-- Created: 2026-08-14
-- Source: prisma/schema.prisma (Product model + datasource postgresqlExtensions)
-- Purpose: جستجوی trigram روی نام/مدل/SKU/برند محصولات — حذف seq-scan با رشد کاتالوگ

-- افزونهٔ pg_trgm برای جستجوی LIKE/contains کارا (GIN + gin_trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ایندکس GIN روی نام محصول
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- ایندکس GIN روی مدل محصول
CREATE INDEX IF NOT EXISTS "products_model_trgm_idx" ON "products" USING GIN ("model" gin_trgm_ops);

-- ایندکس GIN روی SKU محصول
CREATE INDEX IF NOT EXISTS "products_sku_trgm_idx" ON "products" USING GIN ("sku" gin_trgm_ops);

-- ایندکس GIN روی برند محصول
CREATE INDEX IF NOT EXISTS "products_brand_trgm_idx" ON "products" USING GIN ("brand" gin_trgm_ops);
