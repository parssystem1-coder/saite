# 🔧 SAAS_IMPLEMENTATION_SPEC.md

> **پروژه:** `parssystem1-coder/saite` (شاخه `arena/01a00248-saite`)
> **تاریخ:** ۱۴ اوت ۲۰۲۶
> **نقش:** نقشهٔ اجرایی دقیق (Implementation Specification) برای Coding Agent
> **پیش‌نیاز:** مطالعهٔ `SAAS_READINESS_AUDIT.md` و `SAAS_ARCHITECTURE_BLUEPRINT.md`
> **قانون:** این سند بر اساس کد واقعی Repository نوشته شده؛ هر فایل، خط، و نام دقیقاً از کد استخراج شده است.

---

## ۰) قوانین Coding Agent

این Specification باید توسط یک Coding Agent اجرا شود. Agent باید:

1. **هرگز خارج از Phase مشخص‌شده کد نزند.**
2. **هر فایل فقط در Phase مربوطه تغییر کند** (نه زودتر، نه دیرتر).
3. **پس از هر Phase، Checklist مربوطه تأیید شود** قبل از رفتن به Phase بعد.
4. **اگر موردی در این سند نیست، در Phase فعلی نادیده گرفته شود** — نه تغییر، نه "بهبود".
5. **Migration script باید idempotent باشد** (اگر دوبار اجرا شود، نتیجه یکسان باشد).
6. **هیچ تغییری در `package.json` بدون HUMAN DECISION نباشد.**

---

## ۱) Repository Inventory

### ۱.۱ Frontend

| مسیر | مسئولیت | وابستگی | وضعیت فعلی | تغییر مورد نیاز |
|---|---|---|---|---|
| `src/app/layout.tsx` | Root layout، metadata، fonts | `next/font`, `src/lib/constants.ts` | Public site root | افزودن provider برای tenant context (client) |
| `src/app/page.tsx` | Home page | `src/lib/api.ts` | Hardcoded به یک site | Tenant-aware از host |
| `src/app/about/page.tsx` | About page | Static | Public | Tenant-aware |
| `src/app/blog/page.tsx` | Blog list | `src/lib/api.ts` | Single-tenant | Tenant-aware |
| `src/app/brands/page.tsx` | Brands list | `src/lib/api.ts` | Single-tenant | Tenant-aware |
| `src/app/cart/page.tsx` | Cart | `src/store/cart-store.ts` | Global Zustand | Tenant-aware (clear on tenant switch) |
| `src/app/checkout/page.tsx` | Checkout | `src/lib/checkout/*` | Single-tenant | Tenant-aware |
| `src/app/compare/page.tsx` | Compare products | `src/store/compare-store.ts` | Global | Tenant-aware |
| `src/app/contact/page.tsx` | Contact | Static | Public | Tenant-aware |
| `src/app/dashboard/page.tsx` | Customer dashboard | `src/server/auth/customer-session.ts` | Single | Tenant-aware |
| `src/app/design-system/page.tsx` | Internal | - | Dev only | بدون تغییر |
| `src/app/faq/page.tsx` | FAQ | Static | Public | Tenant-aware |
| `src/app/forgot-password/page.tsx` | Customer password reset | - | - | Tenant-aware |
| `src/app/login/page.tsx` | Customer login | `customer-session.ts` | Single | Tenant-aware |
| `src/app/products/page.tsx` | Product list | `src/lib/api.ts` | Single-tenant | Tenant-aware |
| `src/app/products/[slug]/page.tsx` | Product detail | `src/lib/api.ts` | Single-tenant | Tenant-aware |
| `src/app/admin/layout.tsx` | Admin root | - | metadata only | افزودن Platform Admin split |
| `src/app/admin/login/page.tsx` | Admin login | `src/lib/auth/server/admin-session.ts` | env-based admin | جداسازی Platform vs Tenant login |
| `src/app/admin/recover/page.tsx` | Admin recovery | - | Single admin | Tenant-aware |
| `src/app/admin/(panel)/layout.tsx` | Admin panel guard | `getAdminSession()` | env-based | Tenant-aware guard |
| `src/app/admin/(panel)/page.tsx` | Dashboard | - | Single | Tenant-aware |
| `src/app/admin/(panel)/categories/page.tsx` | Categories | `prisma` (در mock mode) | - | Tenant filter |
| `src/app/admin/(panel)/communications/inquiries/page.tsx` | Inquiries | - | - | Tenant filter |
| `src/app/admin/(panel)/communications/sms/page.tsx` | SMS | - | - | Tenant filter |
| `src/app/admin/(panel)/content/article-categories/page.tsx` | Article categories | - | - | Tenant filter |
| `src/app/admin/(panel)/content/articles/page.tsx` | Articles | - | - | Tenant filter |
| `src/app/admin/(panel)/content/pages/page.tsx` | Pages | - | - | Tenant filter |
| `src/app/admin/(panel)/content/pages/new/page.tsx` | New page | - | - | Tenant filter |
| `src/app/admin/(panel)/customers/page.tsx` | Customers list | - | - | Tenant filter |
| `src/app/admin/(panel)/finance/*` | Finance pages | - | - | Tenant filter |
| `src/app/admin/(panel)/finance/subscriptions/page.tsx` | Subscriptions | localStorage mock | ⚠️ Mock | جایگزین با API |
| `src/app/admin/(panel)/marketing/*` | Marketing | - | - | Tenant filter |
| `src/app/admin/(panel)/orders/page.tsx` | Orders | - | - | Tenant filter |
| `src/app/admin/(panel)/products/page.tsx` | Products | - | - | Tenant filter |
| `src/app/admin/(panel)/products/new/page.tsx` | New product | - | - | Tenant filter |
| `src/app/admin/(panel)/reports/*` | Reports | - | - | Tenant filter |
| `src/app/admin/(panel)/settings/*` | Settings | - | Single | Tenant filter |
| `src/app/admin/(panel)/users/page.tsx` | Users | - | Single admin | Tenant filter (Tenant users) |
| `src/app/admin/(panel)/forbidden/page.tsx` | 403 page | - | - | بدون تغییر |
| `src/app/admin/(panel)/help/page.tsx` | Help | - | - | بدون تغییر |
| `src/app/api/*/route.ts` | API endpoints | - | Single | Tenant context wrap |

**فایل‌های جدید (Frontend) که باید ساخته شوند:**
- `src/app/(platform)/layout.tsx`
- `src/app/(platform)/login/page.tsx`
- `src/app/(platform)/admin/platform/dashboard/page.tsx`
- `src/app/(platform)/admin/platform/tenants/page.tsx`
- `src/app/(platform)/admin/platform/tenants/[id]/page.tsx`
- `src/app/(platform)/admin/platform/plans/page.tsx`
- `src/app/(platform)/admin/platform/subscriptions/page.tsx`
- `src/app/(platform)/admin/platform/domains/page.tsx`
- `src/app/(platform)/admin/platform/audit-logs/page.tsx`
- `src/app/(platform)/admin/platform/users/page.tsx`
- `src/app/(storefront)/layout.tsx` (tenant resolution)
- `src/app/(storefront)/admin/(panel)/tenant-settings/page.tsx`
- `src/app/(storefront)/admin/(panel)/billing/page.tsx`

### ۱.۲ Backend

| مسیر | مسئولیت | وابستگی | وضعیت فعلی | تغییر مورد نیاز |
|---|---|---|---|---|
| `src/proxy.ts` | Middleware (Next.js) | `src/lib/auth/server/session-token.ts`, `src/lib/security-headers.ts` | Admin guard | افزودن tenant resolution |
| `src/server/shared/db.ts` | Prisma singleton | `@prisma/client` | بدون context | Tenant context + Extension |
| `src/server/shared/redis.ts` | Redis singleton | `ioredis` | shared | بدون تغییر (فقط namespace) |
| `src/server/shared/cache.ts` | Cache helper | `redis.ts`, `logger.ts` | بدون tenant prefix | افزودن tenant prefix |
| `src/server/shared/event-bus.ts` | Outbox publisher | `prisma` | بدون tenantId | افزودن tenantId |
| `src/server/shared/event-types.ts` | Event type registry | - | بدون tenant | افزودن tenant claim (اختیاری) |
| `src/server/shared/http-utils.ts` | HTTP helpers | - | - | افزودن tenant context check |
| `src/server/shared/validation.ts` | Zod validation | `zod` | - | افزودن tenantId در schemas |
| `src/server/shared/rate-limit-policy.ts` | Rate limit | `rate-limit.ts` | per-IP/user | افزودن per-tenant |
| `src/server/shared/repo-utils.ts` | Pagination | - | - | افزودن tenant filter |
| `src/server/shared/errors.ts` | Error classes | - | - | افزودن `QuotaExceededError`, `TenantSuspendedError` |
| `src/server/shared/logger.ts` | Pino logger | `pino` | - | افزودن tenantId در context |
| `src/server/shared/site-url.ts` | Get site URL | env | Single domain | افزودن `getTenantSiteUrl()` |
| `src/server/shared/constants.ts` | Constants | - | - | Tenant-aware constants |
| `src/server/auth/customer-session.ts` | Customer session | HMAC | Single | افزودن tenantId |
| `src/server/auth/session-token.ts` | Customer session token | `session-token-core.ts` | Single | افزودن tenantId |
| `src/server/modules/products/*` | Products domain | `prisma` | global | Tenant-scoped |
| `src/server/modules/orders/*` | Orders domain | `prisma` | global | Tenant-scoped |
| `src/server/modules/inventory/*` | Inventory | `prisma` + raw SQL | global | Tenant-scoped |
| `src/server/modules/finance/*` | Finance | `prisma` | global | Tenant-scoped |
| `src/server/modules/marketing/*` | Marketing | `prisma` | global | Tenant-scoped |
| `src/server/modules/shipping/*` | Shipping | `prisma` | global | Tenant-scoped |
| `src/server/modules/content/*` | Content | `prisma` | global | Tenant-scoped |
| `src/server/payments/*` | Payments | adapters | global | Tenant-scoped |
| `src/server/upload/*` | Upload | local + s3 | global | Tenant-scoped path |
| `src/server/communications/*` | Email/SMS | providers | global | Tenant-scoped |
| `src/server/jobs/*` | BullMQ workers | `bullmq` | global | Tenant context per job |
| `src/server/ai/*` | AI gateway | anthropic/openai | global | Tenant-scoped (cache) |
| `src/server/seo-tools/*` | SEO tools | - | global | Tenant-scoped (اختیاری) |

**فایل‌های جدید (Backend) که باید ساخته شوند:**
- `src/server/tenants/tenant-context.ts` (ALS)
- `src/server/tenants/tenant-resolver.ts` (Host → tenantId)
- `src/server/tenants/with-tenant-context.ts` (Route wrapper)
- `src/server/tenants/tenant-guard.ts` (requireTenant)
- `src/server/tenants/cache-key.ts` (Cache key prefix)
- `src/server/platform/auth.ts` (Platform session)
- `src/server/platform/tenant-service.ts` (CRUD)
- `src/server/platform/plan-service.ts` (CRUD)
- `src/server/platform/subscription-service.ts` (CRUD)
- `src/server/platform/domain-service.ts` (CRUD + verification)
- `src/server/platform/audit-log.ts` (Platform audit)
- `src/server/platform/impersonation.ts`
- `src/server/subscriptions/quota-enforcer.ts`
- `src/server/subscriptions/feature-gate.ts`
- `src/server/subscriptions/usage-tracker.ts`
- `src/server/subscriptions/lifecycle.ts`
- `src/server/billing/webhook-handler.ts`
- `src/server/billing/idempotency.ts`
- `src/server/domains/verifier.ts` (DNS lookup)
- `src/server/domains/ssl-provisioner.ts` (ACME)
- `src/server/tenants/onboarding.ts`

### ۱.۳ Database (Prisma)

| Model | محل تعریف | وضعیت فعلی | تغییر مورد نیاز |
|---|---|---|---|
| `Product` | `prisma/schema.prisma:21` | Global | Tenant-scoped + `tenantId` + RLS |
| `Order` | `prisma/schema.prisma:131` | Global | Tenant-scoped + `tenantId` + RLS |
| `OrderItem` | `prisma/schema.prisma:155` | Global (transitive) | از `Order` filter + RLS |
| `Customer` | `prisma/schema.prisma:191` | Global | Tenant-scoped + `tenantId` + RLS |
| `PaymentIntent` | `prisma/schema.prisma:209` | Global | Tenant-scoped + `tenantId` + RLS |
| `Invoice` | `prisma/schema.prisma:255` | Global | Tenant-scoped + `tenantId` + RLS |
| `Transaction` | `prisma/schema.prisma:294` | Global (transitive) | از `Invoice` filter + RLS |
| `Shipment` | `prisma/schema.prisma:328` | Global | Tenant-scoped + `tenantId` + RLS |
| `ShippingRate` | `prisma/schema.prisma:357` | Global (per-store) | Tenant-scoped + `tenantId` + RLS |
| `Coupon` | `prisma/schema.prisma:381` | Global | Tenant-scoped + `tenantId` + RLS |
| `CouponRedemption` | `prisma/schema.prisma:413` | Global (transitive) | از `Coupon` filter + RLS |
| `Campaign` | `prisma/schema.prisma:430` | Global | Tenant-scoped + `tenantId` + RLS |
| `EmailLog` | `prisma/schema.prisma:456` | Global | Tenant-scoped + `tenantId` + RLS |
| `SmsLog` | `prisma/schema.prisma:471` | Global | Tenant-scoped + `tenantId` + RLS |
| `Page` | `prisma/schema.prisma:485` | Global | Tenant-scoped + `tenantId` + RLS |
| `Post` | `prisma/schema.prisma:500` | Global | Tenant-scoped + `tenantId` + RLS |
| `MenuItem` | `prisma/schema.prisma:520` | Global | Tenant-scoped + `tenantId` + RLS |
| `InventoryItem` | `prisma/schema.prisma:62` | Global (transitive) | از `Product` filter + RLS |
| `InventoryAdjustment` | `prisma/schema.prisma:82` | Global | Tenant-scoped + `tenantId` + RLS |
| `InventoryReservation` | `prisma/schema.prisma:104` | Global (transitive) | از `Order` filter + RLS |
| `OutboxEvent` | `prisma/schema.prisma:212` | Global | Hybrid: `tenantId?` + RLS (with NULL) |
| `AiUsageLog` | `prisma/schema.prisma:228` | Global | Tenant-scoped + `tenantId` + RLS |
| `FeatureFlag` | `prisma/schema.prisma:243` | Global | Hybrid: `tenantId?` + RLS |

**Models جدید:**
- `Tenant`
- `User` (سراسری)
- `TenantUser`
- `Plan`
- `Subscription`
- `Domain`
- `PlatformAdmin`
- `PlatformSession`
- `PlatformAuditLog`
- `ProcessedWebhook`
- `UserSession` (یا استفاده از Customer session)

### ۱.۴ Authentication

| فایل | مسئولیت | تغییر |
|---|---|---|
| `src/lib/auth/rbac.ts` | RBAC (viewer/operator/admin) | افزودن `TenantRole` map |
| `src/lib/auth/server/session-token.ts` | Admin session token | افزودن `tenantId?` (backward compat) |
| `src/lib/auth/server/session-token-core.ts` | HMAC core | بدون تغییر |
| `src/lib/auth/server/admin-session.ts` | Admin session | جداسازی Platform vs Tenant |
| `src/lib/auth/server/admin-secret.ts` | Admin credentials (env) | جداسازی Platform env vs Tenant user |
| `src/lib/auth/server/require-role.ts` | Permission guard | افزودن `requireTenantPermission`, `requirePlatformPermission` |
| `src/lib/auth/server/page-guard.ts` | Page guard | افزودن tenant check |
| `src/lib/auth/server/rate-limit.ts` | Rate limit | افزودن per-tenant |
| `src/lib/auth/server/rate-limit-store.ts` | Rate limit storage | بدون تغییر (key شامل tenantId) |
| `src/lib/auth/server/password-hash.ts` | Password hash | بدون تغییر |
| `src/lib/auth/server/totp.ts` | TOTP | بدون تغییر |
| `src/lib/auth/server/audit-log.ts` | Audit log | افزودن tenantId field |
| `src/lib/auth/customer-scope.ts` | Customer scope check | افزودن tenantId check |
| `src/lib/auth/customer-scope.ts:13` | `canAccessOrder` | **بحرانی** — افزودن tenantId |
| `src/server/auth/customer-session.ts` | Customer session | افزودن tenantId |
| `src/server/auth/session-token.ts` | Customer session token | افزودن tenantId |

### ۱.۵ Authorization

| فایل | مسئولیت | تغییر |
|---|---|---|
| `src/lib/auth/rbac.ts` | RBAC logic | گسترش به Tenant Roles |
| `src/lib/auth/server/require-role.ts` | Guards | افزودن `requireTenant`, `requirePlatformAdmin` |

### ۱.۶ API (Route Handlers)

| مسیر | Tenant-Aware | فاز تغییر |
|---|---|---|
| `src/app/api/products/route.ts` | ✅ | Phase 2 |
| `src/app/api/products/[id]/route.ts` | ✅ | Phase 2 |
| `src/app/api/products/by-slug/[slug]/route.ts` | ✅ | Phase 2 |
| `src/app/api/products/[id]/inventory/route.ts` | ✅ | Phase 2 |
| `src/app/api/products/[id]/inventory/adjust/route.ts` | ✅ | Phase 2 |
| `src/app/api/products/[id]/inventory/adjustments/route.ts` | ✅ | Phase 2 |
| `src/app/api/orders/route.ts` | ✅ | Phase 2 |
| `src/app/api/orders/[id]/route.ts` | ✅ | Phase 2 |
| `src/app/api/inventory/route.ts` | ✅ | Phase 2 |
| `src/app/api/inventory/alerts/route.ts` | ✅ | Phase 2 |
| `src/app/api/customers/session/route.ts` | ✅ | Phase 4 |
| `src/app/api/finance/invoices/route.ts` | ✅ | Phase 2 |
| `src/app/api/finance/invoices/[id]/route.ts` | ✅ | Phase 2 |
| `src/app/api/finance/transactions/route.ts` | ✅ | Phase 2 |
| `src/app/api/marketing/coupons/route.ts` | ✅ | Phase 2 |
| `src/app/api/marketing/coupons/validate/route.ts` | ✅ | Phase 2 |
| `src/app/api/marketing/campaigns/route.ts` | ✅ | Phase 2 |
| `src/app/api/content/pages/route.ts` | ✅ | Phase 2 |
| `src/app/api/content/pages/[slug]/route.ts` | ✅ | Phase 2 |
| `src/app/api/content/posts/route.ts` | ✅ | Phase 2 |
| `src/app/api/content/posts/[slug]/route.ts` | ✅ | Phase 2 |
| `src/app/api/content/menu/route.ts` | ✅ | Phase 2 |
| `src/app/api/ai/advisor/route.ts` | ✅ (cache) | Phase 9 |
| `src/app/api/ai/chat/route.ts` | ✅ (cache) | Phase 9 |
| `src/app/api/comms/email-logs/route.ts` | ✅ | Phase 2 |
| `src/app/api/comms/sms-logs/route.ts` | ✅ | Phase 2 |
| `src/app/api/upload/route.ts` | ✅ (storage path) | Phase 9 |
| `src/app/api/payments/route.ts` | ✅ | Phase 2 |
| `src/app/api/payments/webhook/zarinpal/route.ts` | ✅ (lookup) | Phase 8 |
| `src/app/api/shipping/rates/route.ts` | ✅ | Phase 2 |
| `src/app/api/shipping/shipments/route.ts` | ✅ | Phase 2 |
| `src/app/api/shipping/shipments/[id]/route.ts` | ✅ | Phase 2 |
| `src/app/api/admin/products/seo/*` | ✅ | Phase 2 |
| `src/app/api/admin/emojis/route.ts` | ✅ | Phase 2 |
| `src/app/api/health/*` | ❌ | بدون تغییر |
| `src/app/admin/api/session/route.ts` | ✅ (به Platform/Tenant split) | Phase 4 |

**APIهای جدید (Platform Admin):**
- `src/app/api/platform/auth/login/route.ts`
- `src/app/api/platform/auth/session/route.ts`
- `src/app/api/platform/tenants/route.ts`
- `src/app/api/platform/tenants/[id]/route.ts`
- `src/app/api/platform/tenants/[id]/suspend/route.ts`
- `src/app/api/platform/tenants/[id]/resume/route.ts`
- `src/app/api/platform/tenants/[id]/impersonate/route.ts`
- `src/app/api/platform/tenants/[id]/domains/route.ts`
- `src/app/api/platform/tenants/[id]/domains/[domainId]/verify/route.ts`
- `src/app/api/platform/plans/route.ts`
- `src/app/api/platform/plans/[id]/route.ts`
- `src/app/api/platform/subscriptions/route.ts`
- `src/app/api/platform/subscriptions/[id]/route.ts`
- `src/app/api/platform/audit-logs/route.ts`
- `src/app/api/platform/users/route.ts`
- `src/app/api/platform/usage/route.ts`
- `src/app/api/platform/system/health/route.ts`

### ۱.۷ Services

| فایل | وضعیت فعلی | تغییر |
|---|---|---|
| `src/server/modules/products/service.ts` | بدون tenant | افزودن `tenantId` به همه متدها |
| `src/server/modules/orders/service.ts` | از `customerId` | افزودن tenantId check |
| `src/server/modules/finance/service.ts` | بدون tenant | Tenant-scoped |
| `src/server/modules/marketing/service.ts` | بدون tenant | Tenant-scoped |
| `src/server/modules/shipping/service.ts` | بدون tenant | Tenant-scoped |
| `src/server/modules/content/service.ts` | بدون tenant | Tenant-scoped |
| `src/server/modules/inventory/service.ts` | بدون tenant | Tenant-scoped |
| `src/server/payments/service.ts` | از `customerId` | افزودن tenantId |
| `src/server/upload/service.ts` | بدون tenant | Tenant folder prefix |

### ۱.۸ Repositories

| فایل | تغییر |
|---|---|
| `src/server/modules/products/repository.ts` | همهٔ متدها `tenantId` بگیرند |
| `src/server/modules/orders/repository.ts` | همهٔ متدها tenant-scoped |
| `src/server/modules/inventory/repository.ts` | tenantId به raw SQL inject شود |
| `src/server/modules/finance/repository.ts` | tenant-scoped |
| `src/server/modules/marketing/repository.ts` | tenant-scoped |
| `src/server/modules/shipping/repository.ts` | tenant-scoped |
| `src/server/modules/content/repository.ts` | tenant-scoped |
| `src/server/communications/repository.ts` | tenant-scoped |

### ۱.۹ Middleware

| فایل | تغییر |
|---|---|
| `src/proxy.ts` | افزودن `resolveTenantFromHost` |

### ۱.۱۰ Cache

| محل استفاده | Cache key فعلی | تغییر |
|---|---|---|
| `src/server/modules/products/service.ts:48` | `products:list\|...` | `tenant:{id}:products:list\|...` |
| `src/server/modules/shipping/service.ts:78` | `shipping:rates\|...` | `tenant:{id}:shipping:rates\|...` |
| `src/server/seo-tools/gateway.ts:45` | (درون تابعی) | `tenant:{id}:seo:...` |
| `src/server/ai/features/sales-advisor/session-store.ts:147,161` | `chat:{sessionId}` | tenantId در key (اگر session tenant-scoped) |
| `src/lib/auth/server/rate-limit-store.ts:183,188` | `ratelimit:{key}` | `ratelimit:tenant:{id}:{resource}` |

### ۱.۱۱ Redis

| فایل | تغییر |
|---|---|
| `src/server/shared/redis.ts` | بدون تغییر (فقط namespace per tenant) |

### ۱.۱۲ Events / Queues

| فایل | تغییر |
|---|---|
| `src/server/shared/event-bus.ts` | `publish(type, payload, { tenantId })` |
| `src/server/shared/event-types.ts` | Event payload types شامل `tenantId?` |
| `src/server/jobs/queues.ts` | Job data شامل `tenantId` |
| `src/server/jobs/registry.ts` | Worker context |
| `src/server/jobs/init.ts` | بدون تغییر |
| `src/server/jobs/workers/outbox-worker.ts` | Worker با `withTenantContext` |
| `src/server/jobs/workers/email-worker.ts` | Worker با tenant context |
| `src/server/jobs/workers/sms-worker.ts` | Worker با tenant context |
| `src/server/jobs/dispatchers/*` | tenantId در job |

### ۱.۱۳ Storage

| فایل | تغییر |
|---|---|
| `src/server/upload/service.ts` | `tenants/{tenantId}/{folder}/` |
| `src/server/upload/providers/local.ts` | Path tenant-scoped |
| `src/server/upload/providers/s3.ts` | (هنوز TODO) — tenant-scoped path |
| `public/uploads/` | ساختار جدید `tenants/{id}/` |

### ۱.۱۴ Docker

| فایل | تغییر |
|---|---|
| `Dockerfile` | بدون تغییر (multi-stage) |
| `docker-compose.prod.yml` | افزودن Traefik، PgBouncer، MinIO |
| `docker-compose.dev.yml` | افزودن PgBouncer (اختیاری) |

### ۱.۱۵ Nginx

| فایل | تغییر |
|---|---|
| `nginx/nginx.conf` | جایگزین با Traefik (deprecate) — یا Traefik در کنار |

### ۱.۱۶ CI/CD

| فایل | تغییر |
|---|---|
| `.github/workflows/ci.yml` | افزودن tenant isolation test step |
| `.github/workflows/e2e.yml` | افزودن multi-tenant e2e |

### ۱.۱۷ Tests

| فایل | تغییر |
|---|---|
| `tests/lib/*` | افزودن tenant-aware tests |
| `tests/db-integration/*` | افزودن RLS tests |
| `tests/integration/*` | (جدید) Tenant isolation tests |
| `tests/server/*` | (جدید) ALS tests |
| `e2e/*` | (جدید) multi-tenant e2e |

### ۱.۱۸ Configuration

| فایل | تغییر |
|---|---|
| `.env.example` | افزودن TENANT_*, PLATFORM_*, S3_*, ACME_* |
| `src/lib/constants.ts` | افزودن tenant defaults |

### ۱.۱۹ Environment

| متغیر | مقدار پیش‌فرض | توضیح |
|---|---|---|
| `PLATFORM_SESSION_SECRET` | (required) | Platform Admin session HMAC secret |
| `PLATFORM_DEFAULT_TENANT_SLUG` | `default` | برای boot قبل از اولین tenant |
| `PLATFORM_DOMAIN` | `platform.com` | دامنهٔ اصلی پلتفرم |
| `PLATFORM_WILDCARD_DOMAIN` | `*.platform.com` | wildcard cert |
| `DNS_PROVIDER_API_KEY` | - | Cloudflare/ArvanCloud |
| `PGUSER_APP` | `saite_app` | Non-superuser Prisma user |
| `S3_ENDPOINT` | - | MinIO یا ArvanCloud |
| `S3_BUCKET` | `saite-uploads` | - |
| `S3_ACCESS_KEY` | - | - |
| `S3_SECRET_KEY` | - | - |
| `ACME_EMAIL` | `admin@platform.com` | Let's Encrypt |

---

## ۲) File-Level Change Map

این جدول مهم‌ترین بخش Specification است. هر تغییر آینده در اینجا Map شده.

### ۲.۱ Phase 0 — Foundation

| فایل | مسئولیت فعلی | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|---|
| `prisma/schema.prisma` | 23 models | افزودن 11 model جدید (Tenant, User, TenantUser, Plan, Subscription, Domain, PlatformAdmin, PlatformSession, PlatformAuditLog, ProcessedWebhook, UserSession) | P0 | Medium | Phase 0 |
| `prisma/migrations/20260822000000_tenant_foundation/migration.sql` | - | ایجاد Migration اول (جداول سراسری) | P0 | High | Phase 0 |
| `prisma/seed.ts` | Seed products | افزودن default tenant + plan_legacy + default admin user | P0 | Low | Phase 0 |
| `src/server/tenants/tenant-context.ts` | - | ایجاد (ALS) | P0 | Low | Phase 0 |
| `src/server/tenants/types.ts` | - | ایجاد (TypeScript types) | P0 | Low | Phase 0 |
| `package.json` | - | افزودن deps: `acme-client`, `cloudflare` (یا DNS provider SDK) | P1 | Low | Phase 0 |

### ۲.۲ Phase 1 — Tenant Context (No DB change)

| فایل | مسئولیت فعلی | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|---|
| `prisma/schema.prisma` | - | افزودن `tenantId String?` به 23 models | P0 | Low | Phase 1 |
| `prisma/migrations/20260823000000_tenant_id_nullable/migration.sql` | - | ایجاد (ADD COLUMN nullable) | P0 | Low | Phase 1 |
| `src/server/tenants/tenant-resolver.ts` | - | ایجاد (Host → tenantId) | P0 | Medium | Phase 1 |
| `src/server/tenants/with-tenant-context.ts` | - | ایجاد (Route wrapper) | P0 | Low | Phase 1 |
| `src/proxy.ts` | Admin guard | افزودن `resolveTenantFromHost` در ابتدای `proxy()` | P0 | Medium | Phase 1 |
| `prisma/seed.ts` | - | Backfill default tenant (id: `t_default_legacy`) | P0 | Low | Phase 1 |
| `prisma/migrations/20260824000000_backfill_default_tenant/migration.sql` | - | Backfill تمام ردیف‌ها | P0 | Medium | Phase 1 |

### ۲.۳ Phase 2 — Database Multi-Tenancy

| فایل | مسئولیت فعلی | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|---|
| `prisma/schema.prisma` | - | `tenantId String` (NOT NULL) | P0 | High | Phase 2 |
| `prisma/schema.prisma` | - | FK به Tenant (cascade) | P0 | High | Phase 2 |
| `prisma/migrations/20260825000000_tenant_id_not_null/migration.sql` | - | SET NOT NULL | P0 | High | Phase 2 |
| `prisma/schema.prisma` | - | تغییر unique constraints: `(tenantId, slug)`, `(tenantId, sku)`, `(tenantId, email)`, `(tenantId, code)`, `(tenantId, slug)` (Page/Post), `(tenantId, invoiceNumber)` | P0 | High | Phase 2 |
| `prisma/migrations/20260826000000_tenant_scoped_uniques/migration.sql` | - | DROP old + ADD composite unique | P0 | Critical | Phase 2 |
| `prisma/schema.prisma` | - | افزودن `@@index([tenantId, ...])` | P0 | Medium | Phase 2 |
| `prisma/migrations/20260827000000_composite_indexes/migration.sql` | - | `CREATE INDEX CONCURRENTLY` | P0 | Low | Phase 2 |
| `src/server/shared/db.ts` | Prisma singleton | Prisma Client Extension با auto-filter از ALS | P0 | Critical | Phase 2 |
| `src/server/modules/products/repository.ts` | - | همه متدها tenantId filter | P0 | Critical | Phase 2 |
| `src/server/modules/orders/repository.ts` | - | tenantId filter | P0 | Critical | Phase 2 |
| `src/server/modules/inventory/repository.ts` | - | raw SQL با tenantId | P0 | Critical | Phase 2 |
| `src/server/modules/finance/repository.ts` | - | tenantId filter | P0 | Critical | Phase 2 |
| `src/server/modules/marketing/repository.ts` | - | tenantId filter | P0 | Critical | Phase 2 |
| `src/server/modules/shipping/repository.ts` | - | tenantId filter | P0 | Critical | Phase 2 |
| `src/server/modules/content/repository.ts` | - | tenantId filter | P0 | Critical | Phase 2 |
| `src/app/api/products/route.ts` | - | wrap with `withTenantContext` | P0 | High | Phase 2 |
| `src/app/api/products/[id]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/products/by-slug/[slug]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/products/[id]/inventory/*.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/orders/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/orders/[id]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/inventory/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/inventory/alerts/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/finance/invoices/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/finance/invoices/[id]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/finance/transactions/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/marketing/coupons/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/marketing/coupons/validate/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/marketing/campaigns/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/content/pages/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/content/pages/[slug]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/content/posts/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/content/posts/[slug]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/content/menu/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/comms/email-logs/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/comms/sms-logs/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/shipping/rates/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/shipping/shipments/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/shipping/shipments/[id]/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/admin/products/seo/generate/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/admin/products/seo/import/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/admin/products/seo/keyword/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/admin/emojis/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/ai/advisor/route.ts` | - | wrap + tenant cache | P0 | High | Phase 2 |
| `src/app/api/ai/chat/route.ts` | - | wrap + tenant session | P0 | High | Phase 2 |
| `src/app/api/upload/route.ts` | - | wrap + tenant folder | P0 | High | Phase 2 |
| `src/app/api/payments/route.ts` | - | wrap | P0 | High | Phase 2 |
| `src/app/api/payments/webhook/zarinpal/route.ts` | - | lookup tenantId از orderId | P0 | High | Phase 2 |
| `src/server/payments/service.ts` | - | tenantId در PaymentIntent | P0 | High | Phase 2 |

### ۲.۴ Phase 3 — Tenant Isolation & RLS

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `prisma/migrations/20260828000000_enable_rls/migration.sql` | ENABLE + FORCE + Policies | P0 | Critical | Phase 3 |
| `prisma/migrations/20260828000001_bypass_user/migration.sql` | CREATE USER saite_app NOLOGIN | P0 | High | Phase 3 |
| `src/server/shared/db.ts` | تغییر به extended client با auto-set_config | P0 | Critical | Phase 3 |
| `src/server/tenants/with-tenant-context.ts` | استفاده از `set_config('app.current_tenant_id', ...)` | P0 | Critical | Phase 3 |
| `src/server/platform/database-access.ts` | `withPlatformAccess` (bypass RLS) | P0 | Critical | Phase 3 |

### ۲.۵ Phase 4 — Authentication

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `prisma/schema.prisma` | افزودن `User` model (سراسری) | P0 | Medium | Phase 4 |
| `prisma/schema.prisma` | افزودن `TenantUser` model | P0 | Medium | Phase 4 |
| `prisma/schema.prisma` | افزودن `PlatformAdmin` + `PlatformSession` models | P0 | Medium | Phase 4 |
| `prisma/schema.prisma` | افزودن `UserSession` model (اختیاری) | P1 | Medium | Phase 4 |
| `prisma/migrations/20260829000000_user_models/migration.sql` | - | P0 | Medium | Phase 4 |
| `src/lib/auth/server/session-token.ts` | افزودن `tenantId?` و `tenantRole?` به payload | P0 | High | Phase 4 |
| `src/lib/auth/server/session-token-core.ts` | بدون تغییر | - | - | - |
| `src/lib/auth/server/admin-session.ts` | جداسازی Platform vs Tenant | P0 | High | Phase 4 |
| `src/lib/auth/server/admin-secret.ts` | خواندن Platform env vs Tenant DB | P0 | High | Phase 4 |
| `src/lib/auth/server/require-role.ts` | افزودن `requireTenantPermission`, `requirePlatformPermission` | P0 | High | Phase 4 |
| `src/lib/auth/customer-scope.ts:13` | `canAccessOrder` با tenantId | P0 | Critical | Phase 4 |
| `src/server/auth/customer-session.ts` | tenantId در session | P0 | High | Phase 4 |
| `src/server/auth/session-token.ts` | tenantId در customer payload | P0 | High | Phase 4 |
| `src/app/admin/api/session/route.ts` | جداسازی Platform login (host = admin.platform.com) از Tenant login | P0 | High | Phase 4 |
| `src/app/api/customers/session/route.ts` | tenantId در session | P0 | High | Phase 4 |
| `src/lib/auth/rbac.ts` | map TenantRole to permissions | P0 | Medium | Phase 4 |
| `src/server/auth/platform-session.ts` (جدید) | Platform HMAC session | P0 | High | Phase 4 |
| `src/server/auth/user-session.ts` (جدید) | User/Tenant HMAC session | P0 | High | Phase 4 |
| `src/lib/auth/server/page-guard.ts` | tenant check | P0 | Medium | Phase 4 |
| `src/app/admin/(panel)/layout.tsx` | tenant guard | P0 | High | Phase 4 |
| `src/app/admin/login/page.tsx` | جداسازی login UI بر اساس host | P0 | High | Phase 4 |

### ۲.۶ Phase 5 — Platform Admin

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `src/app/(platform)/layout.tsx` (جدید) | Platform guard | P0 | Medium | Phase 5 |
| `src/app/(platform)/login/page.tsx` (جدید) | Platform login | P0 | Medium | Phase 5 |
| `src/app/(platform)/admin/platform/dashboard/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/tenants/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/tenants/[id]/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/plans/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/subscriptions/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/domains/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/audit-logs/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/(platform)/admin/platform/users/page.tsx` (جدید) | - | P0 | Low | Phase 5 |
| `src/app/api/platform/auth/login/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/auth/session/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/[id]/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/[id]/suspend/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/[id]/resume/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/[id]/impersonate/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/[id]/domains/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/tenants/[id]/domains/[domainId]/verify/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/plans/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/plans/[id]/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/subscriptions/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/subscriptions/[id]/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/audit-logs/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/users/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/app/api/platform/usage/route.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/server/platform/tenant-service.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/server/platform/plan-service.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/server/platform/subscription-service.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/server/platform/audit-log.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/server/platform/impersonation.ts` (جدید) | - | P0 | High | Phase 5 |
| `src/lib/admin/platform-nav.ts` (جدید) | - | P0 | Low | Phase 5 |

### ۲.۷ Phase 6 — Tenant Admin

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `src/app/(storefront)/layout.tsx` (جدید) | Tenant Resolver | P0 | Medium | Phase 6 |
| `src/app/(storefront)/admin/(panel)/tenant-settings/page.tsx` (جدید) | - | P0 | Low | Phase 6 |
| `src/app/(storefront)/admin/(panel)/billing/page.tsx` (جدید) | - | P0 | Low | Phase 6 |
| `src/app/api/auth/login/route.ts` (جدید) | Tenant user login (ایمیل + رمز) | P0 | High | Phase 6 |
| `src/app/api/auth/signup/route.ts` (جدید) | Tenant user signup | P0 | High | Phase 6 |
| `src/app/api/auth/switch-tenant/route.ts` (جدید) | برای multi-tenant user | P0 | Medium | Phase 6 |
| `src/app/api/tenant/users/route.ts` (جدید) | Tenant users management | P0 | High | Phase 6 |
| `src/app/api/tenant/invite/route.ts` (جدید) | Invite user to tenant | P0 | High | Phase 6 |
| `src/server/tenants/onboarding.ts` (جدید) | Tenant signup flow | P0 | High | Phase 6 |
| `src/components/admin/tenant-switcher.tsx` (جدید) | Multi-tenant UI | P0 | Low | Phase 6 |

### ۲.۸ Phase 7 — Custom Domains

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `prisma/schema.prisma` | Domain model (قبلاً ساخته شده) | - | - | - |
| `src/server/domains/verifier.ts` (جدید) | DNS lookup | P0 | Medium | Phase 7 |
| `src/server/domains/ssl-provisioner.ts` (جدید) | ACME | P0 | High | Phase 7 |
| `src/server/domains/service.ts` (جدید) | Domain CRUD | P0 | Medium | Phase 7 |
| `docker-compose.prod.yml` | افزودن Traefik service | P0 | High | Phase 7 |
| `docker-compose.prod.yml` | حذف nginx | P0 | Medium | Phase 7 |
| `nginx/` | deprecate | P1 | Low | Phase 7 |
| `src/proxy.ts` | بهبود tenant resolution | P0 | Medium | Phase 7 |
| `.env.example` | DNS_PROVIDER, ACME_EMAIL | P0 | Low | Phase 7 |

### ۲.۹ Phase 8 — Plans & Subscriptions

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `src/server/subscriptions/quota-enforcer.ts` (جدید) | Quota check | P0 | High | Phase 8 |
| `src/server/subscriptions/feature-gate.ts` (جدید) | Feature gate | P0 | High | Phase 8 |
| `src/server/subscriptions/usage-tracker.ts` (جدید) | Usage metrics | P0 | Medium | Phase 8 |
| `src/server/subscriptions/lifecycle.ts` (جدید) | Subscription state machine | P0 | High | Phase 8 |
| `src/server/billing/webhook-handler.ts` (جدید) | Zarinpal/IDPay webhook | P0 | High | Phase 8 |
| `src/server/billing/idempotency.ts` (جدید) | Idempotency | P0 | High | Phase 8 |
| `src/app/api/billing/webhook/[provider]/route.ts` (جدید) | Webhook receiver | P0 | High | Phase 8 |
| `src/app/api/billing/portal/route.ts` (جدید) | Customer billing portal | P0 | Medium | Phase 8 |
| `src/app/api/billing/checkout/route.ts` (جدید) | Create checkout | P0 | High | Phase 8 |
| `src/app/api/admin/products/route.ts` | افزودن `enforceQuota('product')` | P0 | High | Phase 8 |
| `src/app/api/orders/route.ts` | افزودن `enforceQuota('order')` | P0 | High | Phase 8 |
| `src/app/api/tenant/users/route.ts` (جدید) | `enforceQuota('user')` | P0 | High | Phase 8 |
| `src/server/jobs/dispatchers/subscription-expiry-dispatcher.ts` (جدید) | Cron | P0 | Medium | Phase 8 |
| `src/server/jobs/dispatchers/trial-reminder-dispatcher.ts` (جدید) | Cron | P0 | Low | Phase 8 |
| `src/components/admin/finance/subscriptions-client.tsx` | جایگزین با API call (نه localStorage) | P0 | Medium | Phase 8 |

### ۲.۱۰ Phase 9 — Storage & Cache Isolation

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `src/server/upload/service.ts` | `tenants/{id}/{folder}/` | P0 | High | Phase 9 |
| `src/server/upload/providers/local.ts` | tenantId در path | P0 | High | Phase 9 |
| `src/server/upload/providers/s3.ts` | tenantId در key | P0 | High | Phase 9 |
| `src/server/shared/cache.ts` | افزودن tenant prefix | P0 | Critical | Phase 9 |
| `src/server/modules/products/service.ts:13-30` | `buildCacheKey` با tenantId | P0 | Critical | Phase 9 |
| `src/server/modules/shipping/service.ts:78` | Cache key با tenantId | P0 | Critical | Phase 9 |
| `src/server/seo-tools/gateway.ts:45` | Cache key با tenantId | P0 | Critical | Phase 9 |
| `src/server/ai/features/sales-advisor/session-store.ts:147,161` | tenantId در session key | P0 | High | Phase 9 |
| `src/lib/auth/server/rate-limit-store.ts:183,188` | tenantId در key | P0 | High | Phase 9 |
| `src/server/tenants/cache-key.ts` (جدید) | Helper | P0 | Low | Phase 9 |

### ۲.۱۱ Phase 10 — Security Hardening

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `tests/integration/tenant-isolation.test.ts` (جدید) | - | P0 | - | Phase 10 |
| `tests/integration/rls.test.ts` (جدید) | - | P0 | - | Phase 10 |
| `tests/integration/cache-isolation.test.ts` (جدید) | - | P0 | - | Phase 10 |
| `tests/integration/storage-isolation.test.ts` (جدید) | - | P0 | - | Phase 10 |
| `tests/integration/api-isolation.test.ts` (جدید) | - | P0 | - | Phase 10 |
| `e2e/multi-tenant.spec.ts` (جدید) | - | P0 | - | Phase 10 |
| `e2e/custom-domain.spec.ts` (جدید) | - | P0 | - | Phase 10 |
| `e2e/subscription-lifecycle.spec.ts` (جدید) | - | P0 | - | Phase 10 |
| `.github/workflows/ci.yml` | افزودن tenant isolation step | P0 | Medium | Phase 10 |

### ۲.۱۲ Phase 11 — Infrastructure

| فایل | تغییر لازم | Priority | Risk | Phase |
|---|---|---|---|---|
| `docker-compose.prod.yml` | Traefik + PgBouncer + MinIO | P0 | High | Phase 11 |
| `docker-compose.dev.yml` | افزودن PgBouncer | P1 | Low | Phase 11 |
| `nginx/nginx.conf` | deprecate (comment out) | P0 | Low | Phase 11 |
| `Dockerfile` | بدون تغییر | - | - | - |
| `.env.example` | همه متغیرهای جدید | P0 | Low | Phase 11 |
| `scripts/backup.sh` (جدید) | Per-tenant backup | P0 | High | Phase 11 |
| `scripts/create-app-user.sh` (جدید) | saite_app non-superuser | P0 | High | Phase 11 |

---

## ۳) Database Change Specification

### ۳.۱ تغییرات per Model

این جدول بر اساس Schema واقعی Repository است.

| Model | Current Scope | Target Scope | tenantId Required? | Relations to Change | Indexes to Add | Unique Constraints to Change | RLS |
|---|---|---|---|---|---|---|---|
| `Product` | Global | Tenant | ✅ (NOT NULL) | FK → Tenant (onDelete: Cascade) | `(tenantId, createdAt)`, `(tenantId, category, createdAt)`, `(tenantId, stockStatus)`, `(tenantId, brand)` | `@@unique([slug])` → `@@unique([tenantId, slug])` ; `@@unique([sku])` → `@@unique([tenantId, sku])` | ✅ |
| `Order` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, createdAt)`, `(tenantId, status, createdAt)`, `(tenantId, customerId, status, createdAt)` | - | ✅ |
| `OrderItem` | Global (transitive) | Tenant (transitive) | ❌ direct (فقط از طریق Order) | از Order filter | (موجود) | - | ✅ (از طریق Order) |
| `Customer` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, createdAt)` | `@@unique([email])` → `@@unique([tenantId, email])` | ✅ |
| `PaymentIntent` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, orderId)`, `(tenantId, status, expiresAt)` | - | ✅ |
| `Invoice` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, customerId, createdAt)`, `(tenantId, status, createdAt)` | `@@unique([invoiceNumber])` → `@@unique([tenantId, invoiceNumber])` | ✅ |
| `Transaction` | Global (transitive) | Tenant (transitive) | ❌ direct (فقط از طریق Invoice) | از Invoice filter | (موجود) | - | ✅ (از طریق Invoice) |
| `Shipment` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, carrier, status)`, `(tenantId, orderId)` | - | ✅ |
| `ShippingRate` | Global | Tenant (با default global) | ✅ (یا default) | FK → Tenant (SetNull) | `(tenantId, carrier, zone, minWeight)` | `@@unique([carrier, zone, minWeight])` → با tenantId | ⚠️ اختیاری (global rates اشتراکی) |
| `Coupon` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, code)` (unique), `(tenantId, active, expiresAt)` | `@@unique([code])` → `@@unique([tenantId, code])` | ✅ |
| `CouponRedemption` | Global (transitive) | Tenant (transitive) | ❌ direct | از Coupon filter | `(tenantId, customerId)` (فقط برای queries) | - | ✅ (از طریق Coupon) |
| `Campaign` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, active, startDate, endDate)` | - | ✅ |
| `EmailLog` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, to, createdAt)`, `(tenantId, status, createdAt)` | - | ✅ |
| `SmsLog` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, to, createdAt)`, `(tenantId, status, createdAt)` | - | ✅ |
| `Page` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, isPublished)`, `(tenantId, slug)` | `@@unique([slug])` → `@@unique([tenantId, slug])` | ✅ |
| `Post` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, isPublished, publishedAt)`, `(tenantId, slug)` | `@@unique([slug])` → `@@unique([tenantId, slug])` | ✅ |
| `MenuItem` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, location, active)` | - | ✅ |
| `InventoryItem` | Global (transitive) | Tenant (transitive) | ❌ direct (فقط از طریق Product) | از Product filter | - | - | ✅ (از طریق Product) |
| `InventoryAdjustment` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, productId, createdAt)` | - | ✅ |
| `InventoryReservation` | Global (transitive) | Tenant (transitive) | ❌ direct | از Order filter | - | - | ✅ (از طریق Order) |
| `OutboxEvent` | Global | Hybrid | ⚠️ (nullable برای platform events) | FK → Tenant (SetNull) | `(tenantId, processedAt, claimedAt, createdAt)`, `(source, processedAt, createdAt)` | - | ✅ (با NULL handling) |
| `AiUsageLog` | Global | Tenant | ✅ | FK → Tenant (Cascade) | `(tenantId, feature, createdAt)` | - | ✅ |
| `FeatureFlag` | Global | Hybrid | ⚠️ (nullable) | FK → Tenant (SetNull) | `(tenantId, key)` | - | ✅ (با NULL handling) |

### ۳.۲ Models جدید (Schema)

```prisma
// ── Tenant Foundation ──────────────────────────────────────
model Tenant {
  id              String        @id @default(cuid())
  slug            String        @unique
  displayName     String
  legalName       String?
  status          TenantStatus  @default(trial)
  ownerEmail      String
  ownerPhone      String?
  timezone        String        @default("Asia/Tehran")
  locale          String        @default("fa-IR")
  currency        String        @default("IRR")
  brandColor      String?
  logoUrl         String?
  faviconUrl      String?
  trialEndsAt     DateTime?
  suspendedAt     DateTime?
  suspendedReason String?
  deletedAt       DateTime?
  dataRegion      String        @default("ir")
  metadata        Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations (بعد از tenantId اضافه شدن)
  domains         Domain[]
  subscriptions   Subscription[]
  tenantUsers     TenantUser[]
  products        Product[]
  orders          Order[]
  customers       Customer[]
  paymentIntents  PaymentIntent[]
  invoices        Invoice[]
  shipments       Shipment[]
  shippingRates   ShippingRate[]
  coupons         Coupon[]
  campaigns       Campaign[]
  emailLogs       EmailLog[]
  smsLogs         SmsLog[]
  pages           Page[]
  posts           Post[]
  menuItems       MenuItem[]
  inventoryAdjustments InventoryAdjustment[]
  outboxEvents    OutboxEvent[]
  aiUsageLogs     AiUsageLog[]
  featureFlags    FeatureFlag[]

  @@index([status])
  @@index([deletedAt])
  @@map("tenants")
}

enum TenantStatus {
  trial
  active
  past_due
  suspended
  cancelled
  archived
}

// ── User (سراسری) ─────────────────────────────────────────
model User {
  id               String        @id @default(cuid())
  email            String        @unique
  phone            String?
  name             String?
  passwordHash     String?
  emailVerified    DateTime?
  twoFactorEnabled Boolean       @default(false)
  twoFactorSecret  String?
  status           UserStatus    @default(active)
  lastLoginAt      DateTime?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  tenantMemberships TenantUser[]
  sessions          UserSession[]

  @@index([status])
  @@map("users")
}

enum UserStatus {
  active
  suspended
  deleted
}

model UserSession {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
  @@map("user_sessions")
}

model TenantUser {
  id        String            @id @default(cuid())
  tenantId  String
  userId    String
  role      TenantRole        @default(member)
  status    TenantUserStatus  @default(active)
  invitedAt DateTime          @default(now())
  joinedAt  DateTime?
  invitedBy String?

  tenant    Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@index([userId])
  @@index([tenantId, status])
  @@map("tenant_users")
}

enum TenantRole {
  owner
  admin
  manager
  finance
  content
  support
  member
}

enum TenantUserStatus {
  invited
  active
  suspended
  removed
}

// ── Plan & Subscription ───────────────────────────────────
model Plan {
  id          String         @id @default(cuid())
  code        String         @unique
  name        String
  description String?
  priceRial   Int
  interval    PlanInterval
  features    Json
  limits      Json
  trialDays   Int            @default(0)
  active      Boolean        @default(true)
  sortOrder   Int            @default(0)
  metadata    Json?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  subscriptions Subscription[]

  @@index([active, sortOrder])
  @@map("plans")
}

enum PlanInterval {
  monthly
  quarterly
  yearly
  lifetime
}

model Subscription {
  id                  String             @id @default(cuid())
  tenantId            String
  planId              String
  status              SubscriptionStatus
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  trialEndsAt         DateTime?
  cancelledAt         DateTime?
  cancelAtPeriodEnd   Boolean            @default(false)
  paymentMethod       String?
  paymentReference    String?
  nextBillingAt       DateTime?
  failedPaymentCount  Int                @default(0)
  gracePeriodEndsAt   DateTime?
  metadata            Json?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  tenant              Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan                Plan               @relation(fields: [planId], references: [id])
  billingEvents       SubscriptionBillingEvent[]

  @@index([tenantId, status])
  @@index([status, currentPeriodEnd])
  @@index([nextBillingAt, status])
  @@map("subscriptions")
}

enum SubscriptionStatus {
  trialing
  active
  past_due
  grace_period
  suspended
  cancelled
  expired
}

model SubscriptionBillingEvent {
  id             String   @id @default(cuid())
  subscriptionId String
  type           String   // 'payment', 'refund', 'failed'
  amount         Int
  currency       String   @default("IRR")
  provider       String?
  reference      String?
  payload        Json?
  createdAt      DateTime @default(now())

  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId, createdAt])
  @@map("subscription_billing_events")
}

// ── Domain ────────────────────────────────────────────────
model Domain {
  id                String      @id @default(cuid())
  tenantId          String
  hostname          String      @unique
  isPrimary         Boolean     @default(false)
  isWildcard        Boolean     @default(false)
  verified          Boolean     @default(false)
  verifiedAt        DateTime?
  verificationToken String
  sslStatus         SslStatus   @default(pending)
  sslIssuedAt       DateTime?
  sslExpiresAt      DateTime?
  sslProvider       String?
  sslLastError      String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  tenant            Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([verified, sslStatus])
  @@map("domains")
}

enum SslStatus {
  pending
  provisioning
  active
  failed
  expired
  renewing
}

// ── Platform Admin ────────────────────────────────────────
model PlatformAdmin {
  id               String              @id @default(cuid())
  email            String              @unique
  name             String
  passwordHash     String
  role             PlatformRole        @default(super_admin)
  twoFactorEnabled Boolean             @default(false)
  twoFactorSecret  String?
  status           PlatformAdminStatus @default(active)
  lastLoginAt      DateTime?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  sessions         PlatformSession[]
  auditLogs        PlatformAuditLog[]

  @@index([status])
  @@map("platform_admins")
}

enum PlatformRole {
  super_admin
  support
  finance
  engineer
}

enum PlatformAdminStatus {
  active
  suspended
  deleted
}

model PlatformSession {
  id        String   @id @default(cuid())
  adminId   String
  tokenHash String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  admin     PlatformAdmin @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId, expiresAt])
  @@map("platform_sessions")
}

model PlatformAuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String
  targetType String?
  targetId   String?
  payload    Json?
  ipAddress  String?
  userAgent  String?
  result     String
  createdAt  DateTime @default(now())

  admin      PlatformAdmin @relation(fields: [adminId], references: [id])

  @@index([adminId, createdAt])
  @@index([targetType, targetId, createdAt])
  @@index([action, createdAt])
  @@map("platform_audit_logs")
}

// ── Webhook Idempotency ───────────────────────────────────
model ProcessedWebhook {
  eventId     String   @id
  provider    String
  payload     Json
  processedAt DateTime @default(now())

  @@index([provider, processedAt])
  @@map("processed_webhooks")
}
```

---

## ۴) Existing Data Migration

### ۴.۱ Strategy

برای حفظ داده‌های فعلی، **Default Tenant** ساخته می‌شود و تمام ردیف‌ها به آن تخصیص می‌یابند.

### ۴.۲ per Model

| Model | مقدار اولیه tenantId | nullable? | زمان NOT NULL | زمان Index | زمان Unique Composite |
|---|---|---|---|---|---|
| `Product` | `t_default_legacy` | ✅ (Phase 1) → NOT NULL (Phase 2) | Phase 2 | Phase 2 | Phase 2 |
| `Order` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `Customer` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | Phase 2 |
| `PaymentIntent` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `Invoice` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | Phase 2 |
| `Shipment` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `ShippingRate` | `t_default_legacy` (default rates) | ✅ → NOT NULL (یا default) | Phase 2 | Phase 2 | Phase 2 |
| `Coupon` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | Phase 2 |
| `Campaign` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `EmailLog` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `SmsLog` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `Page` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | Phase 2 |
| `Post` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | Phase 2 |
| `MenuItem` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `InventoryAdjustment` | `t_default_legacy` | ✅ → NOT NULL | Phase 2 | Phase 2 | - |
| `OrderItem` | (transitive از Order) | ❌ direct | - | - | - |
| `InventoryItem` | (transitive از Product) | ❌ direct | - | - | - |
| `InventoryReservation` | (transitive از Order) | ❌ direct | - | - | - |
| `Transaction` | (transitive از Invoice) | ❌ direct | - | - | - |
| `CouponRedemption` | (transitive از Coupon) | ❌ direct | - | - | - |
| `OutboxEvent` | NULL (platform events) | ✅ همیشه nullable | never | Phase 2 | - |
| `AiUsageLog` | `t_default_legacy` (یا NULL برای platform) | ✅ | Phase 2 | Phase 2 | - |
| `FeatureFlag` | NULL (platform flags) | ✅ همیشه nullable | never | Phase 2 | - |

### ۴.۳ Migration Script (Phase 1)

```sql
-- prisma/migrations/20260824000000_backfill_default_tenant/migration.sql

-- 1. ساخت default tenant
INSERT INTO "tenants" (
  "id", "slug", "displayName", "status", "ownerEmail",
  "dataRegion", "createdAt", "updatedAt"
) VALUES (
  't_default_legacy', 'legacy', 'فروشگاه اصلی (مهاجرت)', 'active',
  'admin@saite.local', 'ir', NOW(), NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 2. ساخت default user برای admin فعلی
INSERT INTO "users" (
  "id", "email", "name", "emailVerified", "status", "createdAt", "updatedAt"
) VALUES (
  'u_default_admin', 'admin@saite.local', 'مدیر سیستم', NOW(), 'active', NOW(), NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 3. ایجاد tenant_users
INSERT INTO "tenant_users" (
  "id", "tenantId", "userId", "role", "status",
  "invitedAt", "joinedAt", "createdAt", "updatedAt"
) VALUES (
  'tu_default', 't_default_legacy', 'u_default_admin', 'owner', 'active',
  NOW(), NOW(), NOW(), NOW()
) ON CONFLICT ("tenantId", "userId") DO NOTHING;

-- 4. ساخت plan 'legacy' (بدون محدودیت)
INSERT INTO "plans" (
  "id", "code", "name", "priceRial", "interval",
  "features", "limits", "trialDays", "active", "sortOrder", "createdAt", "updatedAt"
) VALUES (
  'plan_legacy', 'legacy', 'پلن قدیمی (بدون محدودیت)', 0, 'monthly',
  '["all"]'::jsonb,
  '{"maxProducts": -1, "maxUsers": -1, "maxStorageMb": -1, "maxOrdersPerMonth": -1, "maxCategories": -1, "maxCoupons": -1}'::jsonb,
  0, true, -1, NOW(), NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 5. ساخت subscription پیش‌فرض
INSERT INTO "subscriptions" (
  "id", "tenantId", "planId", "status",
  "currentPeriodStart", "currentPeriodEnd",
  "cancelAtPeriodEnd", "createdAt", "updatedAt"
) VALUES (
  'sub_legacy', 't_default_legacy', 'plan_legacy', 'active',
  NOW(), NOW() + INTERVAL '100 years',
  false, NOW(), NOW()
) ON CONFLICT ("id") DO NOTHING;

-- 6. ساخت default domain
INSERT INTO "domains" (
  "id", "tenantId", "hostname", "isPrimary", "verified",
  "verificationToken", "sslStatus", "createdAt", "updatedAt"
) VALUES (
  'd_default_legacy', 't_default_legacy', 'saite.ir', true, true,
  'legacy-token-not-required', 'active', NOW(), NOW()
) ON CONFLICT ("hostname") DO NOTHING;

-- 7. Backfill تمام ردیف‌ها
UPDATE "products" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "orders" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "customers" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "payment_intents" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "invoices" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "shipments" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "shipping_rates" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "coupons" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "campaigns" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "email_logs" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "sms_logs" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "pages" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "posts" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "menu_items" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "inventory_adjustments" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
-- outbox_events و feature_flags: NULL باقی می‌مانند (platform-level)

-- 8. ساخت اولین Platform Admin (از env)
-- این با seed script انجام می‌شود نه migration
```

### ۴.۴ Verification Script (پس از Backfill)

```sql
-- بررسی: تمام ردیف‌ها tenantId دارند (به‌جز platform-level)
SELECT 'products' AS table, COUNT(*) AS null_tenant
  FROM "products" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'orders', COUNT(*) FROM "orders" WHERE "tenantId" IS NULL
UNION ALL
SELECT 'customers', COUNT(*) FROM "customers" WHERE "tenantId" IS NULL
-- ... (برای همه ۲۳ مدل)
-- همه باید ۰ باشند
```

---

## ۵) Prisma Specification

### ۵.۱ Prisma Client Extension (Auto-Filter)

```typescript
// src/server/shared/db.ts (تغییر یافته)

import { PrismaClient, Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import { logger } from './logger';

interface TenantContextStore {
  tenantId: string | null;        // null = platform context (RLS bypass)
  bypass: boolean;                 // true = platform admin
  source: 'request' | 'background_job' | 'seed' | 'platform';
  userId?: string;
}

const als = new AsyncLocalStorage<TenantContextStore>();

// --- Prisma Client اصلی (بدون Extension) ---
const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// --- Prisma Client با RLS-aware extension ---
export const prisma = basePrisma.$extends({
  name: 'tenant-isolation',
  query: {
    // برای همهٔ مدل‌ها
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = als.getStore();

        // اگر در platform context (RLS bypass) → مستقیم
        if (!ctx || ctx.bypass) {
          return query(args);
        }

        // لیست مدل‌های tenant-scoped
        const tenantScopedModels = new Set([
          'Product', 'Order', 'Customer', 'PaymentIntent', 'Invoice',
          'Transaction', 'Shipment', 'ShippingRate', 'Coupon',
          'CouponRedemption', 'Campaign', 'EmailLog', 'SmsLog',
          'Page', 'Post', 'MenuItem', 'InventoryItem',
          'InventoryAdjustment', 'InventoryReservation', 'AiUsageLog',
          'OutboxEvent', 'FeatureFlag',
        ]);

        if (!tenantScopedModels.has(model || '')) {
          return query(args);
        }

        // Inject tenantId در where
        const tenantId = ctx.tenantId;
        if (!tenantId) {
          throw new Error(`Tenant context required for ${model}.${operation}`);
        }

        // در operations که where دارند
        if (args) {
          if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany') {
            args.where = { ...args.where, tenantId };
          } else if (operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
            args.where = { ...args.where, tenantId };
          } else if (operation === 'count') {
            args.where = { ...args.where, tenantId };
          } else if (operation === 'create' || operation === 'createMany' || operation === 'upsert') {
            // inject tenantId در data
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: any) => ({ ...d, tenantId }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }
        }

        return query(args);
      },
    },
  },
});

// --- Helper برای اجرا در tenant context ---
export async function withTenantContext<T>(
  ctx: Omit<TenantContextStore, 'bypass' | 'source'> & Partial<Pick<TenantContextStore, 'bypass' | 'source'>>,
  fn: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return als.run(
    { ...ctx, bypass: ctx.bypass ?? false, source: ctx.source ?? 'request' },
    () => fn(prisma)
  );
}

export async function withPlatformContext<T>(
  fn: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return als.run(
    { tenantId: null, bypass: true, source: 'platform' },
    () => fn(prisma)
  );
}

export function getTenantContext(): TenantContextStore | undefined {
  return als.getStore();
}
```

### ۵.۲ خطرات Developer Bypass

| خطر | راه دور زدن | Mitigation |
|---|---|---|
| استفاده از `basePrisma` به جای `prisma` | Bypass auto-filter | **محدود:** basePrisma را فقط export نکن یا در dev mode هشدار بده |
| `findUnique({ where: { id } })` بدون `tenantId` | Bypass | **RLS به‌عنوان defense** — DB block می‌کند |
| `$queryRawUnsafe` | Bypass | **Audit:** ممنوع. فقط از `$queryRaw` (template) استفاده شود |
| `prisma.$transaction` بدون ALS | Bypass | **Audit:** code review |
| Job worker بدون `withTenantContext` | Bypass | **Test:** همهٔ workerها تست tenant context |
| `prisma.tenantUser.create({ data: {...} })` بدون tenantId | Bypass | auto-filter، RLS |

### ۵.٣ Forbidden Patterns (Code Review Checklist)

```typescript
// ❌ ممنوع
const product = await prisma.product.findUnique({ where: { id } });
const products = await prisma.product.findMany({ where: { category: 'X' } });
await prisma.$queryRawUnsafe('SELECT * FROM products WHERE id = $1', id);

// ✅ مجاز
const product = await withTenantContext(ctx, async (tx) => {
  return tx.product.findUnique({ where: { id } });
});
// یا با ALS
const product = await prisma.product.findUnique({ where: { id, tenantId: ctx.tenantId } });
await prisma.$queryRaw`SELECT * FROM products WHERE "tenantId" = ${ctx.tenantId}`;
```

### ۵.۴ Transactions

```typescript
// ✅ استفاده صحیح
await withTenantContext(ctx, async (tx) => {
  const order = await tx.order.create({ data: {...} });
  await tx.orderItem.createMany({ data: [...] });
  await tx.outboxEvent.create({ data: {...} });
  // همه در یک transaction با RLS
});
```

### ۵.۵ Nested Writes

```typescript
// ✅ prisma nested write
await prisma.order.create({
  data: {
    tenantId,  // explicit
    customer: { connect: { id: customerId } },
    items: {
      create: [
        { product: { connect: { id: productId1 } }, quantity: 1, unitPrice: 100 },
      ],
    },
  },
});
// Auto-filter tenantId در items نیز اعمال می‌شود
```

---

## ۶) AsyncLocalStorage Specification

### ۶.۱ Context Interface

```typescript
// src/server/tenants/types.ts
export interface TenantContextValue {
  // Identity
  tenantId: string;
  tenantSlug: string;
  tenantStatus: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'archived';
  
  // Source
  source: 'subdomain' | 'custom_domain' | 'platform_admin' | 'background_job' | 'seed' | 'cron';
  domainId?: string;
  
  // User (اگر authenticated)
  userId?: string;             // برای User-based auth
  customerId?: string;         // برای Customer session
  tenantUserId?: string;       // برای Tenant Admin
  tenantRole?: TenantRole;
  
  // Platform (اگر platform admin)
  platformAdminId?: string;
  platformRole?: PlatformRole;
  isImpersonating?: boolean;
  
  // Audit
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;          // برای tracing
}
```

### ۶.۲ Lifecycle

```
HTTP Request arrives
   ↓
Traefik (per-domain routing)
   ↓
Next.js Route Handler / Server Component
   ↓
proxy.ts: resolveTenantFromHost(host)
   ↓
withTenantContext(value, async () => {
  // Route Handler body
  // همهٔ prisma.* در این scope tenant-aware
})
   ↓
Response
   ↓
ALS context automatically cleared
```

### ۶.۳ Initialization (در proxy.ts)

```typescript
// src/proxy.ts (تغییر یافته)
export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname, search } = request.nextUrl;
  
  // Platform host → no tenant
  if (isPlatformHost(host)) {
    return NextResponse.next();
  }
  
  // Resolve tenant
  const resolution = await resolveTenantFromHost(host);
  if (!resolution) {
    return new NextResponse('Unknown tenant', { status: 404 });
  }
  
  // Status check
  if (resolution.tenantStatus === 'suspended') {
    return new NextResponse('Account suspended', { status: 503 });
  }
  if (resolution.tenantStatus === 'archived') {
    return new NextResponse('Account archived', { status: 410 });
  }
  
  // Attach to headers (برای Server Component)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', resolution.tenantId);
  requestHeaders.set('x-tenant-slug', resolution.tenantSlug);
  requestHeaders.set('x-tenant-status', resolution.tenantStatus);
  
  return NextResponse.next({ request: { headers: requestHeaders } });
}
```

### ۶.۴ Initialization (در Server Component / Route Handler)

```typescript
// src/app/api/products/route.ts
import { withTenantContext, getTenantContext } from '@/server/tenants/with-tenant-context';
import { requireTenantPermission } from '@/server/tenants/tenant-guard';

export const GET = async (req: NextRequest) => {
  // 1. Read tenant from header
  const tenantId = req.headers.get('x-tenant-id');
  const tenantSlug = req.headers.get('x-tenant-slug');
  const tenantStatus = req.headers.get('x-tenant-status') as any;
  
  if (!tenantId || !tenantSlug) {
    return NextResponse.json({ error: 'Tenant required' }, { status: 400 });
  }
  
  // 2. Permission check
  const guard = await requireTenantPermission('catalog:read');
  if (!guard.ok) return guard.response;
  
  // 3. Run in tenant context
  return withTenantContext(
    { tenantId, tenantSlug, tenantStatus, userId: guard.user.id, tenantUserId: guard.tenantUser.id, tenantRole: guard.tenantUser.role, source: 'request' },
    async () => {
      const result = await productsService.list({});
      return NextResponse.json(result);
    }
  );
};
```

### ۶.۵ Nested Requests

ALS به‌صورت خودکار handle می‌کند. اگر در داخل یک context یک context دیگر باز شود:
- اگر tenantId یکسان باشد: همان context
- اگر متفاوت باشد: inner جایگزین outer می‌شود (با احتیاط)
- **توصیه:** nested tenant context غیرمجاز — throw

```typescript
// src/server/tenants/with-tenant-context.ts
export async function withTenantContext<T>(
  ctx: TenantContextValue,
  fn: () => Promise<T>
): Promise<T> {
  const existing = als.getStore();
  if (existing && existing.tenantId !== ctx.tenantId) {
    // فقط برای platform context مجاز
    if (!ctx.platformAdminId) {
      throw new Error(`Nested tenant context mismatch: ${existing.tenantId} vs ${ctx.tenantId}`);
    }
  }
  return als.run(ctx, fn);
}
```

### ۶.۶ Async Boundaries

ALS در Node.js به‌صورت خودکار در همهٔ `await` ها propagate می‌شود. **نکتهٔ بحرانی:** اگر در داخل `setTimeout`, `setImmediate`, `process.nextTick` استفاده شود، context ممکن است گم شود. راه‌حل:

```typescript
// ❌ Bad
setTimeout(() => {
  const ctx = als.getStore();  // undefined!
  prisma.product.findMany();
}, 1000);

// ✅ Good
setTimeout(() => {
  als.run(savedContext, () => {
    prisma.product.findMany();
  });
}, 1000);
```

### ۶.۷ Background Jobs

```typescript
// src/server/jobs/workers/outbox-worker.ts
async function processEvent(event: OutboxEvent) {
  if (!event.tenantId) {
    // Platform event
    await withPlatformContext(async (tx) => {
      await handlePlatformEvent(event);
    });
    return;
  }
  
  // Tenant event
  const tenant = await prisma.tenant.findUnique({ where: { id: event.tenantId } });
  if (!tenant) {
    logger.error({ eventId: event.id }, 'Tenant not found');
    return;
  }
  
  await withTenantContext(
    {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantStatus: tenant.status,
      source: 'background_job',
    },
    async () => {
      await handleTenantEvent(event);
    }
  );
}
```

### ۶.۸ Tests

```typescript
// tests/server/als.test.ts
import { describe, it, expect } from 'vitest';
import { als, getTenantContext } from '@/server/tenants/with-tenant-context';

describe('AsyncLocalStorage', () => {
  it('propagates through async', async () => {
    const ctx = { tenantId: 't1', tenantSlug: 't1', tenantStatus: 'active' as const, source: 'test' as const };
    
    await als.run(ctx, async () => {
      expect(getTenantContext()?.tenantId).toBe('t1');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(getTenantContext()?.tenantId).toBe('t1');
    });
  });
  
  it('clears after scope', async () => {
    await als.run({ tenantId: 't1', tenantSlug: 't1', tenantStatus: 'active', source: 'test' }, async () => {});
    expect(getTenantContext()).toBeUndefined();
  });
  
  it('rejects nested mismatch', async () => {
    const ctx1 = { tenantId: 't1', tenantSlug: 't1', tenantStatus: 'active' as const, source: 'test' as const };
    const ctx2 = { tenantId: 't2', tenantSlug: 't2', tenantStatus: 'active' as const, source: 'test' as const };
    
    await expect(
      als.run(ctx1, () => als.run(ctx2, async () => {}))
    ).rejects.toThrow(/Nested tenant context mismatch/);
  });
});
```

---

## ۷) PostgreSQL RLS Specification

### ۷.۱ RLS Policies per Table

برای **هر** مدل tenant-scoped (لیست در §۳.۱):

```sql
-- Template (اعمال به هر مدل tenant-scoped)

-- 1. Enable RLS
ALTER TABLE "<table_name>" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "<table_name>" FORCE ROW LEVEL SECURITY;  -- حتی superuser

-- 2. Policy: SELECT
CREATE POLICY "<table>_tenant_select" ON "<table_name>"
  FOR SELECT
  USING (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  );

-- 3. Policy: INSERT
CREATE POLICY "<table>_tenant_insert" ON "<table_name>"
  FOR INSERT
  WITH CHECK (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  );

-- 4. Policy: UPDATE
CREATE POLICY "<table>_tenant_update" ON "<table_name>"
  FOR UPDATE
  USING (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  )
  WITH CHECK (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  );

-- 5. Policy: DELETE
CREATE POLICY "<table>_tenant_delete" ON "<table_name>"
  FOR DELETE
  USING (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  );
```

### ۷.۲ لیست کامل Policies

برای این ۲۳ جدول: `products`, `orders`, `order_items` (transitive), `customers`, `payment_intents`, `invoices`, `transactions` (transitive), `shipments`, `shipping_rates`, `coupons`, `coupon_redemptions` (transitive), `campaigns`, `email_logs`, `sms_logs`, `pages`, `posts`, `menu_items`, `inventory_items` (transitive), `inventory_adjustments`, `inventory_reservations` (transitive), `outbox_events` (with NULL), `ai_usage_logs`, `feature_flags` (with NULL).

### ۷.۳ OutboxEvent Special Case

```sql
-- OutboxEvent: tenantId nullable (platform events)
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "outbox_tenant_select" ON "outbox_events"
  FOR SELECT
  USING (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR "tenantId" IS NULL  -- platform events visible to all (for monitoring)
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  );

CREATE POLICY "outbox_tenant_insert" ON "outbox_events"
  FOR INSERT
  WITH CHECK (
    "tenantId" = current_setting('app.current_tenant_id', true)
    OR "tenantId" IS NULL
    OR current_setting('app.bypass_tenant_isolation', true) = 'on'
  );
```

### ۷.۴ Platform Admin Bypass

```typescript
// src/server/platform/database-access.ts
export async function withPlatformContext<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // set_config(name, value, is_local=true) → SET LOCAL
    await tx.$executeRaw`SELECT set_config('app.bypass_tenant_isolation', 'on', true)`;
    return fn(tx);
  });
}
```

### ۷.۵ User App (Non-Superuser)

```sql
-- scripts/create-app-user.sql
CREATE USER saite_app WITH PASSWORD '...';
GRANT CONNECT ON DATABASE saite_prod TO saite_app;
GRANT USAGE ON SCHEMA public TO saite_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saite_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saite_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO saite_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO saite_app;

-- Migration user (superuser) — جدا از app user
CREATE USER saite_migration WITH PASSWORD '...' SUPERUSER;
```

**DATABASE_URL تغییر:**
- قبل: `postgresql://postgres:PASSWORD@db:5432/saite_prod`
- بعد: `postgresql://saite_app:PASSWORD@db:5432/saite_prod`

### ۷.۶ Transaction + RLS

```typescript
// ✅ صحیح
await prisma.$transaction(async (tx) => {
  // 1. SET LOCAL
  await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
  
  // 2. Query
  const products = await tx.product.findMany();  // RLS enforces
  
  // 3. Write
  await tx.product.create({ data: { ...data, tenantId } });  // RLS checks
  
  // 4. COMMIT → SET LOCAL clears
});

// ❌ غلط — خارج از transaction
await prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, false)`;
// این ماندگار است و در transaction بعدی نیز اعمال می‌شود
```

### ۷.۷ PgBouncer Compatibility

- **Pool Mode:** `transaction` (نه `session`)
- **SET LOCAL:** فقط در transaction جاری → با PgBouncer transaction pooling سازگار
- **Prepared Statements:** `PgBouncer` در حالت transaction نمی‌تواند session-level prepared statement نگه دارد. Prisma client `pgbouncer=true` flag دارد.

```typescript
// src/server/shared/db.ts
new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
  // For PgBouncer transaction mode
  log: ['warn', 'error'],
});
// در DATABASE_URL: ?pgbouncer=true&connection_limit=1
```

### ۷.۸ Migration / Seed Bypass

```typescript
// prisma/seed.ts (or migration scripts)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  // SET bypass on every transaction
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_tenant_isolation', 'on', true)`;
    await tx.tenant.create({ ... });
    // ...
  });
}
```

---

## ۸) Authentication Specification

### ۸.۱ سه نوع Session

```typescript
// 1. Platform Session (PlatformAdmin)
export interface PlatformSessionPayload {
  sub: string;          // platformAdminId
  iat: number;
  exp: number;
  ver: string;
  kind: 'platform';
  role: PlatformRole;
}

// 2. User Session (TenantUser) — multi-tenant
export interface UserSessionPayload {
  sub: string;          // userId
  iat: number;
  exp: number;
  ver: string;
  kind: 'user';
  currentTenantId: string;    // tenant فعال
  currentTenantRole: TenantRole;
  availableTenants?: string[]; // برای switcher
}

// 3. Customer Session
export interface CustomerSessionPayload {
  sub: string;          // customerId
  iat: number;
  exp: number;
  ver: string;
  type: 'customer';
  tenantId: string;     // از host (یا از session قبلی)
}
```

### ۸.۲ Single-Tenant User

اکثریت کاربران:
- یک User
- یک TenantUser
- یک نقش
- Login → مستقیم وارد

```typescript
// src/app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  
  // 1. Resolve tenant از host
  const host = req.headers.get('host') || '';
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) return error('Unknown tenant', 400);
  
  // 2. Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return error('Invalid credentials', 401);
  
  // 3. Find TenantUser
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: tenant.tenantId, userId: user.id } },
  });
  if (!tenantUser || tenantUser.status !== 'active') {
    return error('Invalid credentials', 401);
  }
  
  // 4. Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    return error('Invalid credentials', 401);
  }
  
  // 5. Create session
  const token = await createUserSessionToken(user.id, tenant.tenantId, tenantUser.role);
  setSessionCookie(token);
  
  return NextResponse.json({ success: true });
}
```

### ۸.۳ Multi-Tenant User

```typescript
// یک User می‌تواند در چند Tenant باشد:
// User 'u_alice' →
//   - Tenant A: admin
//   - Tenant B: manager
//   - Tenant C: viewer

// Login flow:
export async function POST(req: NextRequest) {
  // 1. Resolve tenant from host
  const tenant = await resolveTenantFromHost(host);
  if (!tenant) return error('Unknown tenant', 400);
  
  // 2. Find TenantUser
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: tenant.tenantId, userId: user.id } },
  });
  
  // اگر TenantUser وجود نداشت، شاید user در tenant دیگری باشد
  if (!tenantUser) {
    // لیست tenantهای user
    const memberships = await prisma.tenantUser.findMany({
      where: { userId: user.id, status: 'active' },
      include: { tenant: { select: { slug: true, displayName: true } } },
    });
    
    if (memberships.length === 0) {
      return error('Invalid credentials', 401);
    }
    
    // Redirect به tenant صحیح
    return NextResponse.json({
      requiresTenantSelection: true,
      tenants: memberships.map(m => ({ 
        slug: m.tenant.slug, 
        displayName: m.tenant.displayName,
        role: m.role,
      })),
    });
  }
  
  // ادامه (همانند single-tenant)
}
```

### ۸.۴ Tenant Switching

```typescript
// src/app/api/auth/switch-tenant/route.ts
export async function POST(req: NextRequest) {
  const { tenantSlug } = await req.json();
  const session = await getUserSession();
  if (!session) return error('Unauthorized', 401);
  
  // 1. Verify user is member
  const tenantUser = await prisma.tenantUser.findFirst({
    where: {
      userId: session.sub,
      tenant: { slug: tenantSlug },
      status: 'active',
    },
    include: { tenant: true },
  });
  
  if (!tenantUser) return error('Forbidden', 403);
  
  // 2. Create new session with new tenant
  const token = await createUserSessionToken(
    session.sub,
    tenantUser.tenantId,
    tenantUser.role
  );
  setSessionCookie(token);
  
  return NextResponse.json({ success: true, redirectTo: `/${tenantSlug}.platform.com/admin` });
}
```

### ۸.۵ Backward Compatibility

برای پشتیبانی از session فعلی (admin based on env):

```typescript
// src/lib/auth/server/session-token.ts (تغییر یافته)
export interface AdminSessionPayload {
  sub: string;
  iat: number;
  exp: number;
  ver: string;
  role: AdminRole;
  // 🆕 اختیاری — برای backward compat
  tenantId?: string;
  tenantRole?: TenantRole;
}

// بررسی در verify:
if (payload.tenantId && !isValidTenantId(payload.tenantId)) {
  return null; // reject
}
```

### ۸.۶ Implementation per File

| فایل | تغییر دقیق |
|---|---|
| `src/lib/auth/server/session-token.ts` | افزودن `tenantId?`, `tenantRole?` به `AdminSessionPayload` |
| `src/lib/auth/server/session-token.ts:55` | Payload interface |
| `src/lib/auth/server/session-token.ts:124` | verify function — بررسی tenantId |
| `src/server/auth/platform-session.ts` (جدید) | Platform HMAC session functions |
| `src/server/auth/user-session.ts` (جدید) | User HMAC session functions |
| `src/server/auth/customer-session.ts` | افزودن `tenantId` |
| `src/server/auth/session-token.ts` | افزودن `tenantId` به customer payload |
| `src/lib/auth/customer-scope.ts:13` | `canAccessOrder(customerId, order, tenantId)` |
| `src/app/admin/api/session/route.ts` | جداسازی host-based login (admin.platform.com vs {slug}.platform.com) |
| `src/app/api/customers/session/route.ts` | افزودن tenantId در session |
| `src/lib/auth/server/admin-session.ts` | جداسازی platform session از tenant session |

---

## ۹) Authorization Specification

### ۹.۱ Platform Role × Tenant Role

```typescript
// src/lib/auth/permissions.ts (جدید)

export type PlatformPermission =
  | 'platform.tenant.create'
  | 'platform.tenant.read'
  | 'platform.tenant.update'
  | 'platform.tenant.delete'
  | 'platform.tenant.suspend'
  | 'platform.tenant.impersonate'
  | 'platform.plan.create'
  | 'platform.plan.update'
  | 'platform.plan.delete'
  | 'platform.subscription.create'
  | 'platform.subscription.update'
  | 'platform.subscription.cancel'
  | 'platform.domain.verify'
  | 'platform.domain.delete'
  | 'platform.user.create'
  | 'platform.user.update'
  | 'platform.audit.read'
  | 'platform.system.read'
  | 'platform.billing.read'
  | 'platform.billing.write';

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermission[]> = {
  super_admin: [/* همه */],
  support: ['platform.tenant.read', 'platform.tenant.impersonate', 'platform.subscription.read'],
  finance: ['platform.subscription.create', 'platform.subscription.update', 'platform.billing.read', 'platform.billing.write'],
  engineer: ['platform.system.read', 'platform.tenant.read'],
};

// TenantRole × Permission (الگوی فعلی)
const TENANT_ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  owner: [...ADMIN_PERMISSIONS, 'billing:write', 'tenant:delete', 'users:invite'],
  admin: ADMIN_PERMISSIONS,
  manager: [...OPERATOR_PERMISSIONS],
  finance: [...VIEWER_PERMISSIONS, 'finance:write', 'reports:read'],
  content: [...VIEWER_PERMISSIONS, 'catalog:write', 'content:write'],
  support: [...VIEWER_PERMISSIONS, 'orders:read', 'customers:read', 'comms:write'],
  member: VIEWER_PERMISSIONS,
};
```

### ۹.۲ Guards

```typescript
// src/server/tenants/tenant-guard.ts (جدید)
export async function requireTenantPermission(
  permission: Permission
): Promise<{ ok: true; user: User; tenantUser: TenantUser } | { ok: false; response: NextResponse }> {
  const session = await getUserSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: session.currentTenantId, userId: session.sub } },
  });
  if (!tenantUser || tenantUser.status !== 'active') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  if (!hasTenantPermission(tenantUser.role, permission)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  return { ok: true, user: await prisma.user.findUnique({ where: { id: session.sub } }), tenantUser };
}

// src/lib/auth/server/require-platform.ts (جدید)
export async function requirePlatformPermission(
  permission: PlatformPermission
): Promise<{ ok: true; admin: PlatformAdmin } | { ok: false; response: NextResponse }> {
  const session = await getPlatformSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  if (!hasPlatformPermission(session.role, permission)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  const admin = await prisma.platformAdmin.findUnique({ where: { id: session.sub } });
  if (!admin || admin.status !== 'active') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  
  return { ok: true, admin };
}
```

### ۹.۳ Permission Matrix (نهایی)

| Role | catalog:read | catalog:write | orders:read | orders:write | customers:read | customers:write | finance:read | finance:write | reports:read | settings:write | users:manage | billing:write |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **finance** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **content** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **support** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **member** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## ۱۰) Tenant Resolution Specification

### ۱۰.۱ Flow

```
DNS Query: customer-a.ir → VPS IP
   ↓
Traefik (TLS termination, SNI routing)
   ↓
Next.js App
   ↓
src/proxy.ts: proxy(request)
   ↓
Host header: "customer-a.ir:443"
   ↓
isPlatformHost(host)?
   ├─ Yes (admin.platform.com) → Platform Admin flow
   └─ No
      ↓
      resolveTenantFromHost(host)
      ├─ Subdomain pattern: /^([^.]+)\.platform\.com$/
      │  └─ findFirst({ where: { slug } })
      └─ Else (custom domain)
         └─ findFirst({ where: { hostname, verified: true } })
      ↓
      Return { tenantId, tenantSlug, tenantStatus, source } | null
   ↓
Set request headers: x-tenant-id, x-tenant-slug, x-tenant-status
   ↓
NextResponse.next({ request: { headers } })
   ↓
Server Component / Route Handler reads headers
   ↓
withTenantContext({ tenantId, ... }, async () => { ... })
   ↓
prisma queries (auto-filtered)
```

### ۱۰.۲ Code: resolveTenantFromHost

```typescript
// src/server/tenants/tenant-resolver.ts

import { prisma } from '@/server/shared/db';

const PLATFORM_DOMAINS = new Set([
  'platform.com',
  'www.platform.com',
  'admin.platform.com',
  'api.platform.com',
]);

function isPlatformHost(hostname: string): boolean {
  return PLATFORM_DOMAINS.has(hostname) || hostname.endsWith('.platform.com');
}

export interface TenantResolution {
  tenantId: string;
  tenantSlug: string;
  tenantStatus: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'archived';
  source: 'subdomain' | 'custom_domain';
  domainId?: string;
}

export async function resolveTenantFromHost(host: string): Promise<TenantResolution | null> {
  const hostname = host.split(':')[0].toLowerCase();
  
  if (isPlatformHost(hostname)) return null;
  
  // 1. Subdomain: {slug}.platform.com
  const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.platform\.com$/);
  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, status: true, deletedAt: true },
    });
    if (!tenant || tenant.deletedAt) return null;
    if (!['active', 'trial', 'past_due'].includes(tenant.status)) return null;
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantStatus: tenant.status as any,
      source: 'subdomain',
    };
  }
  
  // 2. Custom domain
  const domain = await prisma.domain.findUnique({
    where: { hostname },
    select: {
      id: true,
      verified: true,
      tenant: { select: { id: true, slug: true, status: true, deletedAt: true } },
    },
  });
  if (!domain || !domain.verified) return null;
  if (domain.tenant.deletedAt) return null;
  if (!['active', 'trial', 'past_due'].includes(domain.tenant.status)) return null;
  return {
    tenantId: domain.tenant.id,
    tenantSlug: domain.tenant.slug,
    tenantStatus: domain.tenant.status as any,
    source: 'custom_domain',
    domainId: domain.id,
  };
}
```

### ۱۰.۳ Performance Optimization

`resolveTenantFromHost` در هر request اجرا می‌شود. Cache لازم است:

```typescript
// Cache: 60 seconds
const CACHE_TTL = 60; // seconds
const cacheKey = (host: string) => `tenant:resolve:${host}`;

export async function resolveTenantFromHost(host: string): Promise<TenantResolution | null> {
  const cached = await redis.get(cacheKey(host));
  if (cached) return JSON.parse(cached);
  
  const result = await resolveTenantFromHostUncached(host);
  if (result) {
    await redis.set(cacheKey(host), JSON.stringify(result), 'EX', CACHE_TTL);
  } else {
    // Negative cache: 10 seconds
    await redis.set(cacheKey(host), 'null', 'EX', 10);
  }
  return result;
}
```

---

## ۱۱) Custom Domain Specification

### ۱۱.۱ Models

(از §۳.۲ — `Domain` model)

### ۱۱.۲ APIs

| Endpoint | Method | Description |
|---|---|---|
| `/api/platform/tenants/{id}/domains` | POST | افزودن domain |
| `/api/platform/tenants/{id}/domains` | GET | لیست |
| `/api/platform/tenants/{id}/domains/{domainId}` | DELETE | حذف |
| `/api/platform/tenants/{id}/domains/{domainId}/verify` | POST | شروع verification |
| `/api/platform/tenants/{id}/domains/{domainId}/verify/callback` | POST | Webhook از ACME |
| `/api/tenant/domains` | GET | Tenant view |

### ۱۱.۳ Middleware (در proxy.ts)

(در §۱۰٫۲ — قسمت custom_domain)

### ۱۱.۴ Admin UI

- Platform Admin: `src/app/(platform)/admin/platform/domains/page.tsx`
- Tenant Admin: `src/app/(storefront)/admin/(panel)/settings/domains/page.tsx`

### ۱۱.۵ Verification Flow (per Domain)

```
1. POST /api/platform/tenants/{id}/domains
   Body: { hostname: "customer-a.ir" }
   Server: 
   - generate verificationToken = random(32) hex
   - INSERT Domain (verified=false, sslStatus=pending)
   - Return:
     {
       domain: {...},
       dnsInstructions: {
         txt: { host: "_saite-verify.customer-a.ir", value: "saite-verify=<token>" },
         a:   { host: "@", value: "<VPS_IP>" }
       }
     }

2. Customer adds DNS records (manual or via API).

3. POST /api/platform/tenants/{id}/domains/{domainId}/verify
   Server:
   - Query DNS TXT: _saite-verify.customer-a.ir → TXT record
   - If matches token:
     - Domain.verified = true
     - Trigger ACME DNS-01 challenge (via Cloudflare API)
     - Wait for cert provisioning
     - Update Domain.sslStatus = active
   - Else: return error

4. Traefik auto-reload → cert loaded → tenant accessible.
```

### ۱۱.۶ ACME + DNS-01 (Cloudflare)

```typescript
// src/server/domains/ssl-provisioner.ts
import cloudflare from 'cloudflare';

const cf = new cloudflare({ token: process.env.CLOUDFLARE_API_TOKEN });
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID!;

export async function provisionSSL(hostname: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Create ACME TXT record for verification
  const txtRecord = `_acme-challenge.${hostname}`;
  await cf.dnsRecords.create({
    zone_id: ZONE_ID,
    type: 'TXT',
    name: txtRecord,
    content: '{{token}}',  // will be replaced by ACME client
    ttl: 60,
  });
  
  // 2. ACME DNS-01 challenge (using acme-client or lego)
  // ... (use acme-client library)
  
  // 3. Save cert to Traefik's acme.json
  // ... 
  
  return { success: true };
}
```

**Dependencies مورد نیاز:**
```json
{
  "dependencies": {
    "acme-client": "^5.0.0",
    "cloudflare": "^4.0.0"
  }
}
```

### ۱۱.۷ Domain Hijacking Prevention

- TXT verification قبل از verified=true
- Re-verify cron job هر ۳۰ روز
- اگر verificationToken TXT record حذف شود → `verified = false` → custom domain deactivates
- Audit log برای هر verification attempt

---

## ۱۲) Platform Admin Specification

### ۱۲.۱ Features Matrix

| Feature | UI | API | Service | Database | Permission | Audit |
|---|---|---|---|---|---|---|
| **Dashboard** | `/admin/platform/dashboard` | `GET /api/platform/system/health` | `systemService` | (read) | `platform.system.read` | - |
| **Tenants List** | `/admin/platform/tenants` | `GET /api/platform/tenants` | `tenantService.list` | `tenants` | `platform.tenant.read` | - |
| **Create Tenant** | `/admin/platform/tenants/new` | `POST /api/platform/tenants` | `tenantService.create` | `tenants`, `users`, `tenant_users`, `subscriptions` | `platform.tenant.create` | ✅ |
| **Edit Tenant** | `/admin/platform/tenants/{id}/edit` | `PATCH /api/platform/tenants/{id}` | `tenantService.update` | `tenants` | `platform.tenant.update` | ✅ |
| **Suspend Tenant** | `/admin/platform/tenants/{id}/suspend` | `POST /api/platform/tenants/{id}/suspend` | `tenantService.suspend` | `tenants.status` | `platform.tenant.suspend` | ✅ |
| **Resume Tenant** | `/admin/platform/tenants/{id}/resume` | `POST /api/platform/tenants/{id}/resume` | `tenantService.resume` | `tenants.status` | `platform.tenant.suspend` | ✅ |
| **Archive Tenant** | `/admin/platform/tenants/{id}/archive` | `POST /api/platform/tenants/{id}/archive` | `tenantService.archive` | `tenants.deletedAt` | `platform.tenant.delete` | ✅ |
| **Impersonate** | (redirect) | `POST /api/platform/tenants/{id}/impersonate` | `impersonation.start` | `platform_audit_logs` | `platform.tenant.impersonate` | ✅ |
| **Plans List** | `/admin/platform/plans` | `GET /api/platform/plans` | `planService.list` | `plans` | `platform.plan.read` | - |
| **Create Plan** | `/admin/platform/plans/new` | `POST /api/platform/plans` | `planService.create` | `plans` | `platform.plan.create` | ✅ |
| **Edit Plan** | `/admin/platform/plans/{id}/edit` | `PATCH /api/platform/plans/{id}` | `planService.update` | `plans` | `platform.plan.update` | ✅ |
| **Subscriptions List** | `/admin/platform/subscriptions` | `GET /api/platform/subscriptions` | `subscriptionService.list` | `subscriptions` | `platform.subscription.read` | - |
| **Create Subscription** | (modal) | `POST /api/platform/subscriptions` | `subscriptionService.create` | `subscriptions` | `platform.subscription.create` | ✅ |
| **Update Subscription** | (modal) | `PATCH /api/platform/subscriptions/{id}` | `subscriptionService.update` | `subscriptions` | `platform.subscription.update` | ✅ |
| **Cancel Subscription** | (button) | `POST /api/platform/subscriptions/{id}/cancel` | `subscriptionService.cancel` | `subscriptions.status` | `platform.subscription.cancel` | ✅ |
| **Domains List** | `/admin/platform/domains` | `GET /api/platform/domains` | `domainService.list` | `domains` | `platform.domain.read` | - |
| **Verify Domain** | (button) | `POST /api/platform/tenants/{id}/domains/{domainId}/verify` | `domainService.verify` | `domains.verified` | `platform.domain.verify` | ✅ |
| **Delete Domain** | (button) | `DELETE /api/platform/tenants/{id}/domains/{domainId}` | `domainService.delete` | `domains` | `platform.domain.delete` | ✅ |
| **Users** | `/admin/platform/users` | `GET/POST /api/platform/users` | `userService` | `platform_admins` | `platform.user.create/update` | ✅ |
| **Audit Logs** | `/admin/platform/audit-logs` | `GET /api/platform/audit-logs` | `auditLogService.list` | `platform_audit_logs` | `platform.audit.read` | - |
| **Usage** | `/admin/platform/usage` | `GET /api/platform/usage` | `usageService` | (aggregated) | `platform.billing.read` | - |
| **System Health** | `/admin/platform/system/health` | `GET /api/platform/system/health` | `healthService` | - | `platform.system.read` | - |

### ۱۲.۲ Platform Login

- URL: `admin.platform.com/login`
- Session cookie: `saite_platform_session`
- TOTP: required for `super_admin`, optional for others
- 2FA: TOTP

### ۱۲.۳ Platform Impersonation

```typescript
// src/server/platform/impersonation.ts
export async function startImpersonation(
  adminId: string,
  tenantId: string,
  durationMinutes: number = 15
): Promise<{ token: string; expiresAt: Date }> {
  // 1. Log audit
  await prisma.platformAuditLog.create({
    data: {
      adminId,
      action: 'impersonate.start',
      targetType: 'tenant',
      targetId: tenantId,
      result: 'success',
    },
  });
  
  // 2. Create impersonation token (short-lived)
  const token = await createImpersonationToken(adminId, tenantId, durationMinutes);
  return { token, expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000) };
}
```

---

## ۱۳) Tenant Admin Specification

### ۱۳.۱ Permissions (Allowed vs Forbidden)

| Resource | Tenant A Admin (allowed) | Tenant B (forbidden) | Platform Settings (forbidden) |
|---|---|---|---|
| `/api/products` | Tenant A products only | ❌ 403 | ❌ 403 |
| `/api/products/{id}` | if `product.tenantId === 'A'` | ❌ 403 | ❌ 403 |
| `/api/orders` | Tenant A orders only | ❌ 403 | ❌ 403 |
| `/api/customers` | Tenant A customers only | ❌ 403 | ❌ 403 |
| `/api/inventory` | Tenant A inventory | ❌ 403 | ❌ 403 |
| `/api/finance/invoices` | Tenant A invoices | ❌ 403 | ❌ 403 |
| `/api/marketing/coupons` | Tenant A coupons | ❌ 403 | ❌ 403 |
| `/api/admin/...` | Tenant A | ❌ 403 | ❌ 403 |
| `/api/platform/...` | ❌ 403 | ❌ 403 | ❌ 403 |
| `/api/tenant/domains` | Tenant A's domains | ❌ 403 | ❌ 403 |
| `/api/tenant/users` | Tenant A's users | ❌ 403 | ❌ 403 |
| `/api/billing/...` | Tenant A's billing | ❌ 403 | ❌ 403 |

### ۱۳.۲ Implementation (در Route Handler)

```typescript
// src/app/api/products/route.ts
export const GET = async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return error('Tenant required', 400);
  
  const guard = await requireTenantPermission('catalog:read');
  if (!guard.ok) return guard.response;
  
  return withTenantContext(
    { tenantId, tenantSlug: '...', tenantStatus: 'active', source: 'request' },
    async () => {
      const result = await productsService.list({});
      return NextResponse.json(result);
    }
  );
};
```

### ۱۳.۳ IDOR Prevention Test

```typescript
// tests/integration/tenant-isolation.test.ts
it('Tenant A cannot access Tenant B product by ID', async () => {
  // Setup: Product in Tenant B
  const productB = await createTestProduct({ tenantId: tenantB });
  
  // Request as Tenant A
  const res = await fetch(`/api/products/${productB.id}`, {
    headers: { 'x-tenant-id': tenantA },
  });
  
  expect(res.status).toBe(404);  // Not 403, to avoid revealing existence
});
```

---

## ۱۴) Subscription Specification

### ۱۴.۱ Models (از §۳.۲)

- `Plan`
- `Subscription`
- `SubscriptionBillingEvent`

### ۱۴.۲ Plan Features / Limits Schema (JSON)

```typescript
// src/lib/plans/types.ts
export interface PlanFeatures {
  // Catalog
  basic_catalog: boolean;
  inventory_tracking: boolean;
  variants: boolean;
  bulk_import: boolean;
  
  // Orders
  basic_orders: boolean;
  advanced_orders: boolean;
  manual_orders: boolean;
  
  // Customers
  customer_profiles: boolean;
  customer_segments: boolean;
  
  // Marketing
  coupons: boolean;
  email_marketing: boolean;
  sms_marketing: boolean;
  abandoned_cart: boolean;
  
  // Finance
  invoices: boolean;
  wallet: boolean;
  taxes: boolean;
  
  // Reports
  basic_reports: boolean;
  advanced_reports: boolean;
  custom_reports: boolean;
  
  // Content
  blog: boolean;
  pages: boolean;
  
  // Domain
  custom_domain: boolean;
  subdomain: boolean;
  
  // AI
  ai_advisor: boolean;
  ai_seo: boolean;
  
  // Support
  email_support: boolean;
  priority_support: boolean;
  phone_support: boolean;
  
  // Platform
  multi_user: boolean;
  api_access: boolean;
  webhooks: boolean;
  
  // Catch-all
  [key: string]: boolean;
}

export interface PlanLimits {
  maxProducts: number;        // -1 = unlimited
  maxUsers: number;
  maxStorageMb: number;
  maxOrdersPerMonth: number;
  maxCategories: number;
  maxCoupons: number;
  maxCampaignsPerMonth: number;
  maxEmailPerMonth: number;
  maxSmsPerMonth: number;
  maxDomains: number;
  [key: string]: number;
}
```

### ۱۴.۳ Example Plans

```json
[
  {
    "code": "free",
    "name": "رایگان",
    "priceRial": 0,
    "interval": "monthly",
    "features": ["basic_catalog", "basic_orders", "coupons", "blog"],
    "limits": {
      "maxProducts": 50,
      "maxUsers": 1,
      "maxStorageMb": 100,
      "maxOrdersPerMonth": 50,
      "maxCategories": 5,
      "maxCoupons": 5,
      "maxDomains": 0
    },
    "trialDays": 0
  },
  {
    "code": "starter",
    "name": "استارتاپی",
    "priceRial": 2000000,
    "interval": "monthly",
    "features": ["basic_catalog", "basic_orders", "coupons", "blog", "email_support", "subdomain"],
    "limits": {
      "maxProducts": 500,
      "maxUsers": 2,
      "maxStorageMb": 1000,
      "maxOrdersPerMonth": 500,
      "maxCategories": 20,
      "maxCoupons": 20,
      "maxDomains": 1
    },
    "trialDays": 14
  },
  {
    "code": "pro",
    "name": "حرفه‌ای",
    "priceRial": 5000000,
    "interval": "monthly",
    "features": ["basic_catalog", "basic_orders", "coupons", "email_marketing", "blog", "pages", "email_support", "subdomain", "custom_domain", "ai_advisor", "advanced_reports"],
    "limits": {
      "maxProducts": 5000,
      "maxUsers": 10,
      "maxStorageMb": 10000,
      "maxOrdersPerMonth": 5000,
      "maxCategories": 100,
      "maxCoupons": 100,
      "maxDomains": 5
    },
    "trialDays": 14
  }
]
```

---

## ۱۵) Plan Enforcement

### ۱۵.۱ Enforcement Pattern

```typescript
// src/server/subscriptions/quota-enforcer.ts
import { prisma } from '@/server/shared/db';
import { tenantContext } from '@/server/tenants/with-tenant-context';
import { redis } from '@/server/shared/redis';
import { getActiveSubscription } from './lifecycle';

export class QuotaExceededError extends Error {
  constructor(
    public resource: string,
    public limit: number,
    public current: number
  ) {
    super(`سقف ${resource} (${limit}) تکمیل شده است. ${current} مورد استفاده شده. لطفاً پلن خود را ارتقا دهید.`);
    this.name = 'QuotaExceededError';
  }
}

export type QuotaResource = 
  | 'product' | 'order' | 'user' | 'storage' | 'category' 
  | 'coupon' | 'campaign' | 'email' | 'sms' | 'domain';

export async function enforceQuota(
  resource: QuotaResource,
  increment: number = 1
): Promise<void> {
  const ctx = tenantContext.require();
  const sub = await getActiveSubscription(ctx.tenantId);
  
  if (!sub) {
    throw new QuotaExceededError('subscription', 0, 0);
  }
  
  const limitKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}s` as keyof typeof sub.plan.limits;
  const limit = (sub.plan.limits as any)[limitKey];
  
  if (limit === -1) return; // unlimited
  
  const current = await getCurrentUsage(ctx.tenantId, resource);
  
  if (current + increment > limit) {
    throw new QuotaExceededError(resource, limit, current);
  }
}

export async function getCurrentUsage(
  tenantId: string,
  resource: QuotaResource
): Promise<number> {
  const cacheKey = `tenant:${tenantId}:usage:${resource}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return parseInt(cached, 10);
  
  let count: number;
  
  switch (resource) {
    case 'product':
      count = await prisma.product.count({ where: { tenantId } });
      break;
    case 'order': {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      count = await prisma.order.count({ 
        where: { tenantId, createdAt: { gte: startOfMonth } } 
      });
      break;
    }
    case 'user':
      count = await prisma.tenantUser.count({ 
        where: { tenantId, status: 'active' } 
      });
      break;
    case 'storage':
      // محاسبه از S3 — slow, cached برای ۱ ساعت
      count = await getStorageUsageBytes(tenantId);
      break;
    case 'category':
      count = await prisma.product.findMany({ 
        where: { tenantId }, 
        select: { category: true }, 
        distinct: ['category'] 
      }).then(r => r.length);
      break;
    case 'coupon':
      count = await prisma.coupon.count({ where: { tenantId } });
      break;
    case 'campaign':
      count = await prisma.campaign.count({ 
        where: { tenantId, createdAt: { gte: getStartOfMonth() } } 
      });
      break;
    case 'email':
      count = await prisma.emailLog.count({ 
        where: { tenantId, createdAt: { gte: getStartOfMonth() } } 
      });
      break;
    case 'sms':
      count = await prisma.smsLog.count({ 
        where: { tenantId, createdAt: { gte: getStartOfMonth() } } 
      });
      break;
    case 'domain':
      count = await prisma.domain.count({ 
        where: { tenantId, verified: true } 
      });
      break;
  }
  
  await redis.set(cacheKey, count, 'EX', 300);  // 5 min cache
  return count;
}

function getStartOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getStorageUsageBytes(tenantId: string): Promise<number> {
  // از S3/MinIO لیست و مجموع
  // cached برای ۱ ساعت
  const cacheKey = `tenant:${tenantId}:usage:storage:bytes`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return parseInt(cached, 10);
  
  // استفاده از S3 SDK listObjectsV2
  // ...
  
  return 0; // placeholder
}
```

### ۱۵.۲ استفاده در Route Handler

```typescript
// src/app/api/products/route.ts
export const POST = async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) return NextResponse.json({ error: 'Tenant required' }, { status: 400 });
  
  const guard = await requireTenantPermission('catalog:write');
  if (!guard.ok) return guard.response;
  
  try {
    await withTenantContext(
      { tenantId, tenantSlug: '...', tenantStatus: 'active', source: 'request' },
      async () => {
        // ⭐ Quota check
        await enforceQuota('product', 1);
        
        const body = await req.json();
        const product = await productsService.create(body, guard.tenantUser.id);
        return NextResponse.json(product, { status: 201 });
      }
    );
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ 
        error: err.message, 
        code: 'QUOTA_EXCEEDED' 
      }, { status: 402 });  // Payment Required
    }
    throw err;
  }
};
```

### ۱۵.۳ Cache Invalidation پس از Write

```typescript
// src/server/subscriptions/usage-invalidator.ts
export async function invalidateUsageCache(tenantId: string, resource: QuotaResource) {
  await redis.del(`tenant:${tenantId}:usage:${resource}`);
}

// در productsService.create:
await invalidateUsageCache(ctx.tenantId, 'product');
```

### ۱۵.۴ Feature Gate

```typescript
// src/server/subscriptions/feature-gate.ts
export class FeatureNotAvailableError extends Error {
  constructor(public feature: string) {
    super(`قابلیت '${feature}' در پلن فعلی شما فعال نیست. لطفاً ارتقا دهید.`);
    this.name = 'FeatureNotAvailableError';
  }
}

export async function requireFeature(feature: string): Promise<void> {
  const ctx = tenantContext.require();
  const sub = await getActiveSubscription(ctx.tenantId);
  
  if (!sub) throw new FeatureNotAvailableError(feature);
  
  const features = sub.plan.features as any;
  if (features[feature] !== true && !features['*']) {
    throw new FeatureNotAvailableError(feature);
  }
}

// استفاده:
export const POST = async (req) => {
  await requireFeature('custom_domain');
  // ...
};
```

---

## ۱۶) Cache Migration Specification

### ۱۶.۱ Cache Key Audit (از Repository واقعی)

| محل | Cache Key فعلی | Cache Key جدید | Tenant Scoped? | Invalidation Strategy |
|---|---|---|---|---|
| `src/server/modules/products/service.ts:48` | `${prefix}:${key}` (prefix: `products:list`) | `tenant:{id}:products:list:${key}` | ✅ | `cacheInvalidateByPrefix('tenant:{id}:products:list')` |
| `src/server/modules/shipping/service.ts:78` | `${prefix}:${key}` (prefix: `shipping:rates`) | `tenant:{id}:shipping:rates:${key}` | ✅ | `cacheInvalidateByPrefix('tenant:{id}:shipping:rates')` |
| `src/server/seo-tools/gateway.ts:45` | (built in function) | `tenant:{id}:seo:${key}` | ✅ | `cacheInvalidateByPrefix('tenant:{id}:seo')` |
| `src/server/ai/features/sales-advisor/session-store.ts:147,161` | `chat:${sessionId}` | `tenant:{id}:chat:${sessionId}` (session per tenant) | ✅ | TTL فقط |
| `src/lib/auth/server/rate-limit-store.ts:183,188` | `${KEY_PREFIX}${key}` (`ratelimit:`) | `ratelimit:tenant:{id}:${key}` | ✅ | TTL فقط |

### ۱۶.۲ Implementation

```typescript
// src/server/tenants/cache-key.ts
import { tenantContext } from './with-tenant-context';

export function getTenantCachePrefix(resource: string): string {
  const ctx = tenantContext.get();
  if (!ctx) {
    throw new Error('Cache called outside tenant context');
  }
  return `tenant:${ctx.tenantId}:${resource}`;
}

export function buildTenantCacheKey(resource: string, key: string): string {
  return `${getTenantCachePrefix(resource)}:${key}`;
}
```

تغییر در `src/server/modules/products/service.ts`:

```typescript
import { buildTenantCacheKey } from '@/server/tenants/cache-key';

// قبل:
const cacheKey = buildCacheKey({ ...query, page, perPage }, fields);
// مثل: 'products:list|q:laptop|cat:printer'

// بعد:
const cacheKey = buildTenantCacheKey('products:list', 
  buildCacheKey({ ...query, page, perPage }, fields)
);
// مثل: 'tenant:t_abc:products:list|q:laptop|cat:printer'
```

### ۱۶.۳ Invalidation

```typescript
// src/server/modules/products/service.ts
async create(input, actorId) {
  // ... existing
  await cacheInvalidateByPrefix(`tenant:${tenantContext.require().tenantId}:products:list`);
  return product;
}
```

---

## ۱۷) Storage Migration Specification

### ۱۷.۱ فایل‌های مرتبط (از Repository)

| فایل | تغییر |
|---|---|
| `src/server/upload/service.ts` | Inject tenant folder |
| `src/server/upload/providers/local.ts` | Path = `tenants/{tenantId}/{folder}/{filename}` |
| `src/server/upload/providers/s3.ts` | Key = `tenants/{tenantId}/{folder}/{filename}` |

### ۱۷.۲ Implementation

```typescript
// src/server/upload/service.ts (تغییر یافته)
import { tenantContext } from '@/server/tenants/with-tenant-context';

export const uploadService = {
  async upload(opts: {
    file: Buffer;
    filename: string;
    mimetype: string;
    folder?: string;
  }) {
    const ctx = tenantContext.require();
    const tenantFolder = `tenants/${ctx.tenantId}/${opts.folder || 'general'}`;
    
    // Validate folder name (already done in provider)
    return provider.upload({
      ...opts,
      folder: tenantFolder,
    });
  },
  
  async delete(key: string) {
    // تأیید key متعلق به tenant
    const ctx = tenantContext.get();
    if (ctx && !key.startsWith(`tenants/${ctx.tenantId}/`)) {
      throw new Error('Access denied: key not in tenant scope');
    }
    return provider.delete(key);
  },
  
  getUrl(key: string) {
    return provider.getUrl(key);
  },
};
```

### ۱۷.۳ localDiskProvider تغییرات

```typescript
// src/server/upload/providers/local.ts (تغییر یافته)
const UPLOAD_SUBDIR = 'public/uploads';
// folder now includes tenant prefix from uploadService

export const localDiskProvider = {
  async upload(opts) {
    // folder = 'tenants/t_abc/products' (از uploadService)
    const dir = join(process.cwd(), UPLOAD_SUBDIR, opts.folder);
    // ...
    
    return {
      url: `${PUBLIC_URL}/${UPLOAD_SUBDIR}/${folder}/${key}`,
      key: `${folder}/${key}`,  // 'tenants/t_abc/products/uuid.webp'
    };
  },
  
  async delete(key: string) {
    const path = join(process.cwd(), UPLOAD_SUBDIR, key);
    // تأیید path traversal
    const normalized = normalize(path);
    const baseDir = join(process.cwd(), UPLOAD_SUBDIR);
    if (!normalized.startsWith(baseDir)) {
      throw new Error('Path traversal detected');
    }
    await unlink(path);
  },
};
```

### ۱۷.4 ساختار پوشه‌ها

```
public/uploads/
├── tenants/
│   ├── t_default_legacy/  (default tenant)
│   │   ├── products/
│   │   │   └── {productId}/
│   │   │       └── {uuid}.webp
│   │   ├── content/
│   │   └── general/
│   ├── t_abc/  (tenant A)
│   └── t_xyz/  (tenant B)
└── platform/  (platform assets)
```

### ۱۷.5 Tenant Deletion

```typescript
// src/server/platform/tenant-deletion.ts
export async function deleteTenantData(tenantId: string): Promise<void> {
  // 1. Soft delete
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { deletedAt: new Date(), status: 'archived' },
  });
  
  // 2. بعد از ۳۰ روز grace period: hard delete
  // - DB: CASCADE در FK → خودکار
  // - S3: listObjects + deleteObjects با prefix 'tenants/{tenantId}/'
  // - Redis: invalidate all tenant keys
  // - Audit log
}
```

---

## ۱۸) Background Jobs & Events

### ۱۸.۱ EventBus تغییرات

```typescript
// src/server/shared/event-bus.ts (تغییر یافته)
import { tenantContext } from '@/server/tenants/with-tenant-context';

export const eventBus = {
  async publish(type: string, payload: Record<string, unknown>, opts?: { tenantId?: string }) {
    const ctx = tenantContext.get();
    const tenantId = opts?.tenantId ?? ctx?.tenantId ?? null;
    
    await prisma.outboxEvent.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        aggregateId: (payload.productId as string) || (payload.orderId as string) || 'unknown',
        tenantId,
        source: tenantId ? 'tenant' : 'platform',
      },
    });
  },
};
```

### ۱۸.۲ Worker تغییرات

```typescript
// src/server/jobs/workers/outbox-worker.ts (تغییر یافته)
async function processOutboxEvent(event: OutboxEvent) {
  try {
    if (event.tenantId) {
      // Tenant event
      const tenant = await prisma.tenant.findUnique({ 
        where: { id: event.tenantId } 
      });
      if (!tenant) {
        logger.error({ eventId: event.id }, 'Tenant not found');
        return;
      }
      
      await withTenantContext(
        {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          tenantStatus: tenant.status as any,
          source: 'background_job',
        },
        async () => {
          await handleEventByType(event);
        }
      );
    } else {
      // Platform event
      await withPlatformContext(async () => {
        await handleEventByType(event);
      });
    }
  } catch (err) {
    logger.error({ err, eventId: event.id }, 'Event processing failed');
  }
}
```

### ۱۸.۳ Job Payloads

```typescript
// src/server/jobs/queues.ts
export interface JobData {
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}
```

### ۱۸.۴ Cron Jobs جدید

```typescript
// src/server/jobs/dispatchers/subscription-expiry-dispatcher.ts (جدید)
import { prisma } from '@/server/shared/db';
import { subscriptionLifecycle } from '@/server/subscriptions/lifecycle';

export function startSubscriptionExpiryDispatcher() {
  setInterval(async () => {
    const expiring = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        trialEndsAt: { lte: new Date() },
      },
    });
    
    for (const sub of expiring) {
      await subscriptionLifecycle.expireTrial(sub.id);
    }
    
    // ... handle past_due, grace_period
  }, 60 * 60 * 1000); // هر ساعت
}
```

### ۱۸.۵ لیست Cron Jobs (نهایی)

| Job | Frequency | محل | تغییر |
|---|---|---|---|
| Outbox Dispatcher | 5s | `src/server/jobs/dispatchers/outbox-dispatcher.ts` | ✅ tenantId |
| Inventory Expiry | 60s | `src/server/jobs/dispatchers/inventory-expiry-dispatcher.ts` | بدون تغییر |
| Log Retention | روزانه | `src/server/jobs/dispatchers/log-retention-dispatcher.ts` | بدون تغییر |
| **Subscription Expiry** (جدید) | ساعتی | `src/server/jobs/dispatchers/subscription-expiry-dispatcher.ts` | جدید |
| **Trial Reminder** (جدید) | روزانه | `src/server/jobs/dispatchers/trial-reminder-dispatcher.ts` | جدید |
| **Domain Re-verify** (جدید) | هفتگی | `src/server/jobs/dispatchers/domain-reverify-dispatcher.ts` | جدید |
| **SSL Renewal Check** (جدید) | روزانه | `src/server/jobs/dispatchers/ssl-renewal-dispatcher.ts` | جدید |
| **Usage Snapshot** (جدید) | روزانه | `src/server/jobs/dispatchers/usage-snapshot-dispatcher.ts` | جدید |

---

## ۱۹) API Change Map

### ۱۹.۱ Existing APIs (Tenant-Aware Required)

| API | Required Change | Authorization | RLS |
|---|---|---|---|
| `GET /api/products` | wrap with `withTenantContext` | `requireTenantPermission('catalog:read')` | ✅ (Product) |
| `POST /api/products` | wrap + `enforceQuota('product')` | `requireTenantPermission('catalog:write')` | ✅ |
| `GET /api/products/{id}` | wrap + check `product.tenantId === ctx.tenantId` | `requireTenantPermission('catalog:read')` | ✅ |
| `PATCH /api/products/{id}` | wrap + check | `requireTenantPermission('catalog:write')` | ✅ |
| `DELETE /api/products/{id}` | wrap + check | `requireTenantPermission('catalog:write')` | ✅ |
| `GET /api/products/by-slug/{slug}` | wrap + filter by tenant | public + rate-limit | ✅ |
| `GET /api/orders` | wrap (filter customerId از session) | `requireTenantPermission('orders:read')` | ✅ |
| `POST /api/orders` | wrap + `enforceQuota('order')` | customer session | ✅ |
| `GET /api/orders/{id}` | wrap + check tenantId | customer or admin | ✅ |
| `PATCH /api/orders/{id}` | wrap | customer or admin | ✅ |
| `GET /api/inventory` | wrap | `requireTenantPermission('reports:read')` | ✅ |
| `GET /api/inventory/alerts` | wrap | `requireTenantPermission('reports:read')` | ✅ |
| `GET /api/finance/invoices` | wrap | `requireTenantPermission('finance:read')` | ✅ |
| `GET /api/finance/invoices/{id}` | wrap + check | `requireTenantPermission('finance:read')` | ✅ |
| `GET /api/finance/transactions` | wrap | `requireTenantPermission('finance:read')` | ✅ |
| `GET /api/marketing/coupons` | wrap | `requireTenantPermission('marketing:read')` | ✅ |
| `POST /api/marketing/coupons` | wrap + `enforceQuota('coupon')` | `requireTenantPermission('marketing:write')` | ✅ |
| `POST /api/marketing/coupons/validate` | wrap (coupon از همان tenant) | public + rate-limit | ✅ |
| `GET /api/marketing/campaigns` | wrap | `requireTenantPermission('marketing:read')` | ✅ |
| `GET /api/content/pages` | wrap | public | ✅ |
| `GET /api/content/pages/{slug}` | wrap | public | ✅ |
| `GET /api/content/posts` | wrap | public | ✅ |
| `GET /api/content/posts/{slug}` | wrap | public | ✅ |
| `GET /api/content/menu` | wrap | public | ✅ |
| `GET /api/ai/advisor` | wrap + tenant-aware retrieval | public + rate-limit | N/A (AI) |
| `POST /api/ai/chat` | wrap + tenant-aware session | customer session | N/A |
| `GET /api/comms/email-logs` | wrap | `requireTenantPermission('comms:read')` | ✅ |
| `GET /api/comms/sms-logs` | wrap | `requireTenantPermission('comms:read')` | ✅ |
| `POST /api/upload` | wrap + tenant folder | `requireTenantPermission('content:write')` + `enforceQuota('storage')` | ✅ |
| `POST /api/payments` | wrap | customer session | ✅ |
| `POST /api/payments/webhook/zarinpal` | lookup tenantId از orderId | webhook | ✅ |
| `GET /api/shipping/shipments` | wrap | `requireTenantPermission('orders:read')` | ✅ |
| `GET /api/shipping/shipments/{id}` | wrap + check | `requireTenantPermission('orders:read')` | ✅ |
| `GET /api/shipping/rates` | wrap | public | ✅ |
| `GET /api/admin/products/seo/*` | wrap | `requireTenantPermission('catalog:write')` | ✅ |
| `GET /api/admin/emojis` | wrap | `requireTenantPermission('content:write')` | ✅ |
| `POST /api/customers/session` | wrap + tenantId from host | public | ✅ (Customer) |
| `GET /api/customers/session` | wrap | customer session | ✅ |
| `DELETE /api/customers/session` | wrap | customer session | ✅ |
| `POST /api/admin/api/session` | جداسازی platform vs tenant | - | - |

### ۱۹.۲ APIs جدید (Platform Admin)

(در §۱۲ فهرست شد)

### ۱۹.۳ APIs جدید (Tenant)

| Endpoint | Description |
|---|---|
| `POST /api/auth/login` | Tenant user login |
| `POST /api/auth/signup` | Tenant user signup (اگر self-service) |
| `POST /api/auth/logout` | Logout |
| `POST /api/auth/switch-tenant` | برای multi-tenant user |
| `GET /api/tenant/users` | List tenant users |
| `POST /api/tenant/users` | Invite user |
| `DELETE /api/tenant/users/{id}` | Remove user |
| `GET /api/tenant/domains` | List domains |
| `GET /api/tenant/billing/portal` | Billing portal |
| `GET /api/tenant/billing/invoices` | Billing invoices |

---

## ۲۰) Frontend Change Map

### ۲۰.۱ Routes

| Route | Change | Phase |
|---|---|---|
| `/` (storefront) | Tenant-aware (از host) | Phase 6 |
| `/products` | Tenant-aware | Phase 6 |
| `/products/[slug]` | Tenant-aware | Phase 6 |
| `/cart` | Tenant-aware (clear on switch) | Phase 6 |
| `/checkout` | Tenant-aware | Phase 6 |
| `/login` (customer) | Tenant-aware | Phase 4 |
| `/signup` (customer) | Tenant-aware | Phase 4 |
| `/admin/login` | جداسازی host-based | Phase 4 |
| `/admin/(panel)/...` | Tenant-aware | Phase 6 |
| `/admin/platform/...` (جدید) | Platform Admin UI | Phase 5 |
| `/{tenant}.platform.com/admin/...` | Tenant Admin | Phase 6 |

### ۲۰.۲ Components

| Component | Change | Phase |
|---|---|---|
| `src/components/admin/admin-shell.tsx` | بدون تغییر | - |
| `src/components/admin/admin-sidebar.tsx` | Tenant switcher (اگر multi-tenant) | Phase 6 |
| `src/components/admin/admin-nav-link.tsx` | Tenant-scoped links | Phase 6 |
| `src/lib/admin/nav.ts` | Tenant-scoped nav items | Phase 6 |
| `src/components/admin/finance/subscriptions-client.tsx` | جایگزین localStorage با API | Phase 8 |
| `src/components/admin/tenant-switcher.tsx` (جدید) | Multi-tenant UI | Phase 6 |
| `src/components/admin/billing/*` (جدید) | Billing UI | Phase 8 |

### ۲۰.۳ API Client

```typescript
// src/lib/api-client.ts (تغییر یافته)
// - X-Tenant header به‌صورت خودکار (از host در client)
// - یا از cookie در server-side

export async function httpJson<T>(path: string, init?: RequestInit): Promise<T> {
  // Server-side: tenantId از ALS
  // Client-side: tenantId از cookie یا window.location.host
  // (در واقعیت، client نیازی به ارسال tenantId ندارد چون backend از host می‌خواند)
  
  // فقط header اضافه شود:
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...init?.headers,
  };
  
  return fetch(url, { ...init, headers });
}
```

### ۲۰.۴ State Management

```typescript
// src/store/cart-store.ts (تغییر یافته)
interface CartState {
  tenantId: string | null;  // 🔑 bind cart to tenant
  items: CartItem[];
  // ...
}

// در cart actions:
addItem(item) {
  const tenantId = getCurrentTenantId();
  if (this.tenantId && this.tenantId !== tenantId) {
    // Tenant switched — clear cart
    this.items = [];
  }
  this.tenantId = tenantId;
  this.items.push(item);
}
```

---

## ۲۱) Security Change Map

| Risk | Affected File(s) | Required Fix | Test | Severity | Phase |
|---|---|---|---|---|---|
| **IDOR** (cross-tenant access) | تمام API routes | `withTenantContext` + RLS | `tenant-isolation.test.ts` | Critical | Phase 2-3 |
| **Tenant ID Tampering** | `src/proxy.ts` | Tenant از host + DB lookup، نه از client | `api-isolation.test.ts` | Critical | Phase 1 |
| **Host Header Attack** | `src/server/tenants/tenant-resolver.ts` | Only verified domains | `tenant-isolation.test.ts` | High | Phase 1 |
| **Domain Takeover** | `src/server/domains/verifier.ts` | TXT + re-verify cron | `domain.test.ts` | High | Phase 7 |
| **Privilege Escalation** (Tenant→Platform) | `src/lib/auth/server/admin-session.ts` | Session isolation + cookie name | `rbac.test.ts` | Critical | Phase 4 |
| **Privilege Escalation** (User→Owner) | `src/lib/auth/server/require-role.ts` | `requireTenantPermission` با role check | `rbac.test.ts` | High | Phase 4 |
| **Platform Admin Abuse** | `src/server/platform/impersonation.ts` | Audit + TTL | `platform-audit.test.ts` | High | Phase 5 |
| **Cache Poisoning** | `src/server/shared/cache.ts` | Tenant prefix | `cache-isolation.test.ts` | High | Phase 9 |
| **Storage Leakage** | `src/server/upload/service.ts` | tenant folder + path traversal check | `storage-isolation.test.ts` | High | Phase 9 |
| **Background Job Leakage** | `src/server/jobs/workers/*` | `withTenantContext` per job | `job-isolation.test.ts` | Medium | Phase 2-3 |
| **Webhook Tenant Confusion** | `src/app/api/payments/webhook/*` | lookup tenantId از orderId | `webhook.test.ts` | Medium | Phase 8 |
| **JWT Tenant Confusion** | `src/lib/auth/server/session-token.ts` | tenantId claim + verify | `auth.test.ts` | High | Phase 4 |
| **SQL/ORM Bypass** | تمام Repository | RLS + Extension | `rls.test.ts` | Critical | Phase 3 |
| **RLS Bypass** | `prisma/migrations/*` | FORCE RLS + non-superuser | `rls.test.ts` | Critical | Phase 3 |
| **Session fixation** | `src/lib/auth/server/admin-session.ts` | session regeneration on login | `auth.test.ts` | Medium | Phase 4 |
| **CSRF** | `src/proxy.ts` | SameSite=strict cookie (already) | e2e | Low | Phase 4 |
| **Open redirect** | `src/lib/auth/safe-redirect.ts` (موجود) | domain allowlist | e2e | Low | Phase 4 |
| **Path traversal** | `src/server/upload/providers/local.ts` | normalize + base check | `storage-isolation.test.ts` | Medium | Phase 9 |
| **Mass assignment** | تمام API | Zod validation (already) | unit | Medium | Phase 2 |
| **Session token in URL** | - | Never (use cookie) | - | N/A | - |

---

## ۲۲) Testing Specification

### ۲۲.۱ Test Files (ایجاد در Phase 10)

| فایل | Coverage | Priority |
|---|---|---|
| `tests/integration/tenant-isolation.test.ts` | تمام مدل‌ها | P0 |
| `tests/integration/rls.test.ts` | تمام RLS policies | P0 |
| `tests/integration/cache-isolation.test.ts` | تمام cache keyها | P0 |
| `tests/integration/storage-isolation.test.ts` | تمام upload paths | P0 |
| `tests/integration/api-isolation.test.ts` | تمام API routes | P0 |
| `tests/integration/auth-tenant.test.ts` | Session flow | P0 |
| `tests/integration/platform-isolation.test.ts` | Platform access | P0 |
| `tests/integration/subscription-lifecycle.test.ts` | Trial/active/past_due | P0 |
| `tests/integration/quota-enforcement.test.ts` | تمام quotaها | P0 |
| `tests/integration/domain-verification.test.ts` | TXT + ACME | P0 |
| `tests/server/als.test.ts` | ALS propagation | P0 |
| `tests/server/cache-key.test.ts` | Cache key prefix | P0 |
| `tests/server/tenant-resolver.test.ts` | Host resolution | P0 |
| `e2e/multi-tenant.spec.ts` | Multi-tenant user flow | P0 |
| `e2e/custom-domain.spec.ts` | Domain setup flow | P0 |
| `e2e/subscription-flow.spec.ts` | Plan upgrade | P0 |
| `e2e/platform-admin.spec.ts` | Platform UI | P0 |

### ۲۲.۲ Test Pattern (Tenant Isolation)

```typescript
// Template
describe('Tenant Isolation: <Resource>', () => {
  let tenantA: string;
  let tenantB: string;
  
  beforeEach(async () => {
    ({ tenantA, tenantB } = await setupTwoTenants());
  });
  
  afterEach(async () => {
    await cleanupTenants(tenantA, tenantB);
  });
  
  it('A cannot read B resource by ID', async () => {
    const resourceB = await createInTenant(tenantB, { /* ... */ });
    const res = await fetch(`/api/${resource}/${resourceB.id}`, {
      headers: { 'x-tenant-id': tenantA },
    });
    expect(res.status).toBe(404);
  });
  
  it('A cannot list B resources', async () => {
    await createInTenant(tenantB, { /* ... */ });
    const res = await fetch(`/api/${resource}`, {
      headers: { 'x-tenant-id': tenantA },
    });
    const data = await res.json();
    expect(data.items).toHaveLength(0);
  });
  
  it('A cannot update B resource', async () => {
    const resourceB = await createInTenant(tenantB, { /* ... */ });
    const res = await fetch(`/api/${resource}/${resourceB.id}`, {
      method: 'PATCH',
      headers: { 'x-tenant-id': tenantA },
      body: JSON.stringify({ /* ... */ }),
    });
    expect(res.status).toBe(404);
  });
  
  it('A cannot delete B resource', async () => {
    const resourceB = await createInTenant(tenantB, { /* ... */ });
    const res = await fetch(`/api/${resource}/${resourceB.id}`, {
      method: 'DELETE',
      headers: { 'x-tenant-id': tenantA },
    });
    expect(res.status).toBe(404);
  });
});
```

### ۲۲.۳ Test Pattern (RLS)

```typescript
describe('PostgreSQL RLS', () => {
  it('rejects cross-tenant SELECT without bypass', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`;
      const result = await tx.$queryRaw`SELECT * FROM products WHERE "id" = ${productB.id}`;
      expect(result).toHaveLength(0);
    });
  });
  
  it('rejects cross-tenant INSERT', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantA}, true)`;
        return tx.product.create({ data: { ...data, tenantId: tenantB } });
      })
    ).rejects.toThrow();
  });
  
  it('allows platform admin bypass', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.bypass_tenant_isolation', 'on', true)`;
      const result = await tx.product.findMany();
      // همه محصولات (از همه tenantها)
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
```

---

## ۲۳) Migration Phases (بهینه‌سازی‌شده)

### ترتیب نهایی (پیشنهاد)

| Phase | نام | هدف | تخمین | وابستگی |
|---|---|---|---|---|
| **0** | Foundation | جداول جدید + default tenant | ۲ روز | - |
| **0.5** | Traefik Setup | زیرساخت reverse proxy (موازی با ۱) | ۲ روز | - |
| **1** | Tenant Context (No DB Change) | tenantId nullable + ALS | ۳ روز | 0 |
| **2** | Database Multi-Tenancy | tenantId NOT NULL + composite uniques | ۵ روز | 1 |
| **3** | RLS + Prisma Extension | Defense in depth | ۴ روز | 2 |
| **4** | Authentication (Platform/Tenant) | Session isolation | ۴ روز | 1 |
| **5** | Platform Admin (API + UI) | Platform control plane | ۷ روز | 4 |
| **6** | Tenant Admin (User Mgmt) | Multi-tenant user | ۵ روز | 4 |
| **7** | Custom Domains | DNS + SSL | ۵ روز | 0.5 |
| **8** | Plans & Subscriptions | Quota + Billing | ۷ روز | 5 |
| **9** | Storage & Cache Isolation | tenant folder/prefix | ۳ روز | 2 |
| **10** | Security Tests | IDOR/RLS/Cache/Storage | ۵ روز | 3, 4, 9 |
| **11** | Production Deployment | Traefik + PgBouncer + MinIO | ۳ روز | 0.5, 7, 8 |
| **12** | Load Test | Verify 100 concurrent | ۲ روز | 11 |
| **13** | Staging Sign-off | Final verification | ۲ روز | 12 |
| **14** | Production Cutover | DNS switch + monitoring | ۱ روز | 13 |

**تخمین کل: ~ ۱۲ هفته با تیم ۲-۳ نفره.**

### تغییر ترتیب (توصیه)

اگر Traefik Setup (Phase 0.5) زمان‌بر باشد، می‌توان آن را به Phase 7 (Custom Domains) منتقل کرد. دلیل: Traefik migration یک تغییر زیرساختی بزرگ است که اگر در production شکست بخورد، بازگشت سخت است.

**توصیه اصلاح‌شده:** Traefik در فاز ۱۱ (Production Deployment) انجام شود، نه در Phase 0.5. در عوض، برای development، فعلاً از nginx موجود استفاده شود (با host override در `/etc/hosts`).

---

## ۲۴) Dependencies Between Phases

| Phase | Depends On | Blocks | Affected Components | Risk | Rollback |
|---|---|---|---|---|---|
| **0** | - | 1, 2, 3, 4, 5, 6, 7, 8, 9 | `prisma/schema.prisma`, `prisma/seed.ts` | Medium | DROP tables |
| **0.5** | - | 11 | `docker-compose.prod.yml`, `nginx/` | High | Restore nginx config |
| **1** | 0 | 2, 3, 4, 6 | `prisma/schema.prisma`, `src/proxy.ts`, `src/server/tenants/*` | Medium | DROP columns, remove ALS code |
| **2** | 1 | 3, 8, 9 | تمام Repositoryها, تمام API routes, `prisma/schema.prisma` | **High** | Restore constraints, remove tenantId filters |
| **3** | 2 | 10 | `src/server/shared/db.ts`, `prisma/migrations/*` | **Critical** | DISABLE RLS, remove Extension |
| **4** | 1 | 5, 6 | `src/lib/auth/*`, `src/server/auth/*`, `src/app/admin/api/session/route.ts` | High | Restore old session, remove tenantId |
| **5** | 4 | 8, 11 | `src/app/(platform)/*`, `src/app/api/platform/*`, `src/server/platform/*` | Medium | Drop platform code |
| **6** | 4 | - | `src/app/(storefront)/*`, `src/app/api/auth/*`, `src/app/api/tenant/*` | Medium | Drop tenant code |
| **7** | 0.5 | 11 | `src/server/domains/*`, `src/proxy.ts`, `docker-compose.prod.yml` | High | Restore nginx, drop Domain model |
| **8** | 5 | 11 | `src/server/subscriptions/*`, `src/server/billing/*`, `src/app/api/billing/*` | High | Drop plan/subscription |
| **9** | 2 | 10, 11 | `src/server/upload/*`, `src/server/shared/cache.ts` | Medium | Revert cache key |
| **10** | 3, 4, 9 | 11 | Test files only | Low | Drop tests |
| **11** | 0.5, 7, 8 | 12, 13 | `docker-compose.prod.yml`, `nginx/`, `prisma/migrations/*` | High | Restore docker-compose |
| **12** | 11 | 13 | - | Low | - |
| **13** | 12 | 14 | - | Low | - |
| **14** | 13 | - | DNS, monitoring | Critical | DNS restore |

---

## ۲۵) Rollback Plan

### ۲۵.۱ per Phase

| Phase | Rollback Strategy |
|---|---|
| **0** | DROP جداول `tenants`, `users`, `tenant_users`, `plans`, `subscriptions`, `domains`, `platform_admins`, `platform_audit_logs`, `processed_webhooks` |
| **1** | DROP columns `tenantId` (همه ۲۳ مدل). حذف فایل‌های `src/server/tenants/` |
| **2** | DROP composite uniques → recreate original uniques. Revert NOT NULL to nullable. DROP composite indexes. Revert Prisma Extension |
| **3** | `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`. DROP policies. DROP FUNCTION (اگر ایجاد شده) |
| **4** | Revert session-token.ts. Revert admin-secret.ts. Revert customer-scope.ts. DROP `users`, `tenant_users`, `platform_admins` (اگر فقط برای این ساخته شدند) |
| **5** | Delete `src/app/(platform)/*` and `src/app/api/platform/*` |
| **6** | Delete `src/app/(storefront)/*` and `src/app/api/auth/*`, `src/app/api/tenant/*` |
| **7** | Restore nginx config. DROP جدول `domains` |
| **8** | DROP جداول `plans`, `subscriptions`, `subscription_billing_events`. Delete billing code |
| **9** | Revert upload paths. Revert cache keys |
| **10** | Drop test files |
| **11** | Restore docker-compose.prod.yml. Restore nginx. DROP PgBouncer, MinIO, Traefik |
| **12-14** | Restore previous deployment. DNS revert |

### ۲۵.۲ Backup Strategy

```bash
# قبل از هر phase:
pg_dump -Fc -d saite_prod -f /backup/pre_phase_${PHASE}_$(date +%Y%m%d_%H%M%S).dump

# Rollback:
pg_restore -d saite_prod --clean --if-exists /backup/pre_phase_${PHASE}_*.dump
```

### ۲۵.۳ Feature Flag Rollback (اختیاری)

```typescript
// برای Phase 2-3 (high risk):
const ROLLOUT_PERCENTAGE = process.env.TENANT_ROLLOUT_PERCENTAGE || 0;

export async function shouldEnforceRLS(): Promise<boolean> {
  return ROLLOUT_PERCENTAGE > 0;
}

// در proxy.ts:
if (await shouldEnforceRLS()) {
  await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
}
```

---

## ۲۶) Definition of Done

### ۲۶.۱ Phase 0 — Foundation

- [ ] `prisma/schema.prisma` شامل ۱۱ model جدید
- [ ] `prisma migrate deploy` موفق
- [ ] `prisma/seed.ts` شامل default tenant + plan_legacy
- [ ] جدول `tenants` با یک ردیف `t_default_legacy` وجود دارد
- [ ] `psql -c "SELECT * FROM tenants"` یک ردیف برمی‌گرداند
- [ ] `psql -c "SELECT * FROM plans"` شامل `plan_legacy` است
- [ ] تست: `npm run type-check` بدون خطا

### ۲۶.۲ Phase 1 — Tenant Context

- [ ] ۲۳ مدل Prisma دارای `tenantId String?`
- [ ] `prisma migrate deploy` موفق
- [ ] `prisma/seed.ts` با default tenant migrate موفق
- [ ] تمام ردیف‌های قدیمی `tenantId = 't_default_legacy'` دارند
- [ ] Verification query: `SELECT COUNT(*) FROM products WHERE "tenantId" IS NULL` = 0
- [ ] `src/server/tenants/tenant-context.ts` ALS ایجاد شد
- [ ] `src/server/tenants/tenant-resolver.ts` ایجاد شد
- [ ] `src/server/tenants/with-tenant-context.ts` ایجاد شد
- [ ] `src/proxy.ts` شامل `resolveTenantFromHost` است
- [ ] تست: `npm run type-check` بدون خطا
- [ ] تست: `npm run build` موفق

### ۲۶.۳ Phase 2 — Database Multi-Tenancy

- [ ] تمام ۲۳ مدل دارای `tenantId String` (NOT NULL)
- [ ] تمام FK به Tenant اضافه شد
- [ ] Unique constraints composite: `(tenantId, slug)`, `(tenantId, sku)`, `(tenantId, email)`, `(tenantId, code)`, `(tenantId, slug)` (Page/Post), `(tenantId, invoiceNumber)`
- [ ] Composite indexes اضافه شد
- [ ] `src/server/shared/db.ts` شامل Prisma Client Extension است
- [ ] تمام Repositoryها tenantId filter می‌زنند
- [ ] تمام ~۳۵ API routes با `withTenantContext` wrap شدند
- [ ] `npm run type-check` و `npm run build` موفق
- [ ] `npm test` (فقط تست‌های موجود) موفق

### ۲۶.۴ Phase 3 — RLS

- [ ] Migration `enable_rls` اجرا شد
- [ ] تمام ۲۳ جدول دارای ENABLE + FORCE ROW LEVEL SECURITY
- [ ] تمام policies ایجاد شد
- [ ] User `saite_app` non-superuser ساخته شد
- [ ] `DATABASE_URL` به `saite_app` تغییر کرد
- [ ] `withTenantContext` از `set_config` استفاده می‌کند
- [ ] `withPlatformContext` برای bypass
- [ ] تست SQL: SET LOCAL + query → فقط tenant خودش
- [ ] تست: Platform admin bypass کار می‌کند
- [ ] `npm run build` موفق

### ۲۶.۵ Phase 4 — Authentication

- [ ] `User`, `TenantUser`, `PlatformAdmin`, `PlatformSession` models اضافه شدند
- [ ] `src/lib/auth/server/session-token.ts` شامل `tenantId?` claim است
- [ ] `src/server/auth/platform-session.ts` ایجاد شد
- [ ] `src/server/auth/user-session.ts` ایجاد شد
- [ ] `src/server/auth/customer-session.ts` شامل tenantId
- [ ] `src/lib/auth/customer-scope.ts:13` `canAccessOrder` با tenantId
- [ ] `src/lib/auth/server/require-role.ts` شامل `requireTenantPermission`, `requirePlatformPermission`
- [ ] `src/app/admin/api/session/route.ts` host-based split
- [ ] `src/app/admin/login/page.tsx` host-aware
- [ ] `src/app/admin/(panel)/layout.tsx` tenant guard
- [ ] `npm run build` موفق

### ۲۶.۶ Phase 5 — Platform Admin

- [ ] `src/app/(platform)/layout.tsx` ایجاد شد
- [ ] `src/app/(platform)/login/page.tsx` ایجاد شد
- [ ] ۸+ صفحات Platform Admin
- [ ] ۱۵+ API routes Platform
- [ ] `src/server/platform/tenant-service.ts` ایجاد شد
- [ ] `src/server/platform/plan-service.ts` ایجاد شد
- [ ] `src/server/platform/subscription-service.ts` ایجاد شد
- [ ] `src/server/platform/audit-log.ts` ایجاد شد
- [ ] `src/server/platform/impersonation.ts` ایجاد شد
- [ ] `src/lib/admin/platform-nav.ts` ایجاد شد
- [ ] `npm run build` موفق

### ۲۶.۷ Phase 6 — Tenant Admin

- [ ] `src/app/(storefront)/layout.tsx` ایجاد شد
- [ ] `src/app/api/auth/login/route.ts` ایجاد شد
- [ ] `src/app/api/auth/switch-tenant/route.ts` ایجاد شد
- [ ] `src/app/api/tenant/users/route.ts` ایجاد شد
- [ ] `src/server/tenants/onboarding.ts` ایجاد شد
- [ ] Multi-tenant user support
- [ ] `npm run build` موفق

### ۲۶.۸ Phase 7 — Custom Domains

- [ ] Traefik در `docker-compose.prod.yml` (اگر این فاز انتخاب شد) یا Phase 11
- [ ] `src/server/domains/service.ts` ایجاد شد
- [ ] `src/server/domains/verifier.ts` DNS lookup
- [ ] `src/server/domains/ssl-provisioner.ts` ACME
- [ ] `src/app/api/platform/tenants/{id}/domains/*` routes
- [ ] TXT verification flow
- [ ] DNS-01 challenge via Cloudflare
- [ ] `src/proxy.ts` بهبود tenant resolution
- [ ] `package.json` شامل `acme-client`, `cloudflare`
- [ ] `npm run build` موفق

### ۲۶.۹ Phase 8 — Plans & Subscriptions

- [ ] `src/server/subscriptions/quota-enforcer.ts` ایجاد شد
- [ ] `src/server/subscriptions/feature-gate.ts` ایجاد شد
- [ ] `src/server/subscriptions/usage-tracker.ts` ایجاد شد
- [ ] `src/server/subscriptions/lifecycle.ts` ایجاد شد
- [ ] `src/server/billing/webhook-handler.ts` ایجاد شد
- [ ] `src/server/billing/idempotency.ts` ایجاد شد
- [ ] `src/app/api/billing/webhook/[provider]/route.ts` ایجاد شد
- [ ] `enforceQuota` در تمام POST/PUT routes
- [ ] `requireFeature` در custom domain route
- [ ] `src/server/jobs/dispatchers/subscription-expiry-dispatcher.ts` ایجاد شد
- [ ] `src/components/admin/finance/subscriptions-client.tsx` دیگر localStorage نیست
- [ ] `npm run build` موفق

### ۲۶.۱۰ Phase 9 — Storage & Cache

- [ ] `src/server/upload/service.ts` tenant folder
- [ ] `src/server/upload/providers/local.ts` tenant path
- [ ] `src/server/upload/providers/s3.ts` tenant key
- [ ] `src/server/shared/cache.ts` tenant prefix helper
- [ ] `src/server/tenants/cache-key.ts` ایجاد شد
- [ ] تمام cache calls شامل tenantId
- [ ] تمام rate-limit calls شامل tenantId
- [ ] `npm run build` موفق

### ۲۶.۱۱ Phase 10 — Security Tests

- [ ] `tests/integration/tenant-isolation.test.ts` ایجاد شد
- [ ] `tests/integration/rls.test.ts` ایجاد شد
- [ ] `tests/integration/cache-isolation.test.ts` ایجاد شد
- [ ] `tests/integration/storage-isolation.test.ts` ایجاد شد
- [ ] `tests/integration/api-isolation.test.ts` ایجاد شد
- [ ] `tests/integration/auth-tenant.test.ts` ایجاد شد
- [ ] تمام تست‌ها pass

### ۲۶.۱۲ Phase 11 — Production

- [ ] `docker-compose.prod.yml` شامل Traefik + PgBouncer + MinIO
- [ ] `nginx/nginx.conf` deprecate
- [ ] `scripts/backup.sh` per-tenant
- [ ] `scripts/create-app-user.sh`
- [ ] `.env.example` کامل
- [ ] Smoke test در staging

### ۲۶.۱۳ Phase 12 — Load Test

- [ ] ۱۰۰ concurrent tenant requests pass
- [ ] Response time p95 < 500ms
- [ ] DB CPU < 70%

### ۲۶.۱۴ Phase 13 — Staging Sign-off

- [ ] تمام Checklistهای بالا pass
- [ ] Stakeholder review

### ۲۶.۱۵ Phase 14 — Production Cutover

- [ ] DNS switch
- [ ] Monitoring alert
- [ ] Rollback plan ready

---

## ۲۷) Final Implementation Order (Coding Agent Sequence)

```
FIRST
  ↓
1. Read SAAS_READINESS_AUDIT.md
2. Read SAAS_ARCHITECTURE_BLUEPRINT.md
3. Read SAAS_IMPLEMENTATION_SPEC.md (این فایل)
  ↓
4. PHASE 0: Foundation
   - prisma/schema.prisma: add 11 new models
   - prisma/migrations/*/migration.sql: create tables
   - prisma/seed.ts: default tenant + plan_legacy
   - src/server/tenants/types.ts
  ↓
5. PHASE 1: Tenant Context
   - prisma/schema.prisma: add tenantId (nullable) to 23 models
   - prisma/migrations/*/migration.sql: ADD COLUMN nullable
   - prisma/migrations/*/migration.sql: backfill default tenant
   - src/server/tenants/tenant-context.ts (ALS)
   - src/server/tenants/tenant-resolver.ts
   - src/server/tenants/with-tenant-context.ts
   - src/proxy.ts: add resolveTenantFromHost
  ↓
6. PHASE 2: Database Multi-Tenancy
   - prisma/schema.prisma: tenantId NOT NULL, FK to Tenant
   - prisma/schema.prisma: composite unique constraints
   - prisma/schema.prisma: composite indexes
   - prisma/migrations/*/migration.sql: NOT NULL
   - prisma/migrations/*/migration.sql: composite uniques
   - prisma/migrations/*/migration.sql: composite indexes
   - src/server/shared/db.ts: Prisma Client Extension
   - src/server/modules/*/repository.ts: tenantId in all queries
   - src/app/api/**/route.ts: wrap with withTenantContext (35+ files)
  ↓
7. PHASE 3: RLS
   - prisma/migrations/*/migration.sql: ENABLE + FORCE RLS, policies
   - scripts/create-app-user.sh
   - src/server/shared/db.ts: use saite_app user
   - src/server/tenants/with-tenant-context.ts: set_config
   - src/server/platform/database-access.ts: withPlatformContext
  ↓
8. PHASE 4: Authentication
   - prisma/schema.prisma: User, TenantUser, PlatformAdmin, PlatformSession models
   - src/lib/auth/server/session-token.ts: tenantId? claim
   - src/lib/auth/server/admin-session.ts: split platform/tenant
   - src/lib/auth/server/admin-secret.ts: env vs DB
   - src/lib/auth/server/require-role.ts: requireTenantPermission, requirePlatformPermission
   - src/lib/auth/customer-scope.ts: tenantId in canAccessOrder
   - src/server/auth/customer-session.ts: tenantId
   - src/server/auth/platform-session.ts (new)
   - src/server/auth/user-session.ts (new)
   - src/app/admin/api/session/route.ts: host-based split
   - src/app/admin/login/page.tsx: host-aware
   - src/app/admin/(panel)/layout.tsx: tenant guard
  ↓
9. PHASE 5: Platform Admin
   - src/app/(platform)/layout.tsx (new)
   - src/app/(platform)/admin/platform/* (new pages)
   - src/app/api/platform/**/route.ts (new)
   - src/server/platform/tenant-service.ts
   - src/server/platform/plan-service.ts
   - src/server/platform/subscription-service.ts
   - src/server/platform/audit-log.ts
   - src/server/platform/impersonation.ts
   - src/lib/admin/platform-nav.ts
  ↓
10. PHASE 6: Tenant Admin
    - src/app/(storefront)/layout.tsx (new)
    - src/app/api/auth/login/route.ts (new)
    - src/app/api/auth/switch-tenant/route.ts (new)
    - src/app/api/tenant/users/route.ts (new)
    - src/server/tenants/onboarding.ts
    - src/components/admin/tenant-switcher.tsx (new)
  ↓
11. PHASE 7: Custom Domains
    - prisma/schema.prisma: Domain (already in 0)
    - src/server/domains/service.ts
    - src/server/domains/verifier.ts
    - src/server/domains/ssl-provisioner.ts
    - src/app/api/platform/tenants/{id}/domains/* (new)
    - src/proxy.ts: improve tenant resolution
    - package.json: acme-client, cloudflare
  ↓
12. PHASE 8: Plans & Subscriptions
    - src/server/subscriptions/quota-enforcer.ts
    - src/server/subscriptions/feature-gate.ts
    - src/server/subscriptions/usage-tracker.ts
    - src/server/subscriptions/lifecycle.ts
    - src/server/billing/webhook-handler.ts
    - src/server/billing/idempotency.ts
    - src/app/api/billing/webhook/[provider]/route.ts
    - src/app/api/admin/products/route.ts: enforceQuota
    - src/app/api/orders/route.ts: enforceQuota
    - src/app/api/tenant/users/route.ts: enforceQuota
    - src/server/jobs/dispatchers/subscription-expiry-dispatcher.ts
    - src/components/admin/finance/subscriptions-client.tsx: replace localStorage
  ↓
13. PHASE 9: Storage & Cache
    - src/server/upload/service.ts: tenant folder
    - src/server/upload/providers/local.ts: tenant path
    - src/server/upload/providers/s3.ts: tenant key
    - src/server/shared/cache.ts: tenant prefix helper
    - src/server/tenants/cache-key.ts (new)
    - src/server/modules/products/service.ts: tenant cache
    - src/server/modules/shipping/service.ts: tenant cache
    - src/server/seo-tools/gateway.ts: tenant cache
    - src/server/ai/features/sales-advisor/session-store.ts: tenant session
    - src/lib/auth/server/rate-limit-store.ts: tenant rate limit
  ↓
14. PHASE 10: Security Tests
    - tests/integration/tenant-isolation.test.ts
    - tests/integration/rls.test.ts
    - tests/integration/cache-isolation.test.ts
    - tests/integration/storage-isolation.test.ts
    - tests/integration/api-isolation.test.ts
    - tests/integration/auth-tenant.test.ts
    - tests/integration/platform-isolation.test.ts
    - tests/integration/subscription-lifecycle.test.ts
    - tests/integration/quota-enforcement.test.ts
    - tests/integration/domain-verification.test.ts
    - tests/server/als.test.ts
    - tests/server/cache-key.test.ts
    - tests/server/tenant-resolver.test.ts
    - e2e/multi-tenant.spec.ts
    - e2e/custom-domain.spec.ts
    - e2e/subscription-flow.spec.ts
    - e2e/platform-admin.spec.ts
  ↓
15. PHASE 11: Production Deployment
    - docker-compose.prod.yml: Traefik + PgBouncer + MinIO
    - nginx/: deprecate
    - scripts/backup.sh: per-tenant
    - scripts/create-app-user.sh
    - .env.example: complete
  ↓
16. PHASE 12-14: Load Test + Staging + Production Cutover
  ↓
PRODUCTION
```

---

## ۲۸) Human Decisions Required

این تصمیمات باید قبل از شروع پیاده‌سازی توسط شما تأیید شوند:

### ۲۸.۱ Business Decisions

| # | تصمیم | گزینه‌ها | پیشنهاد من | HUMAN DECISION |
|---|---|---|---|---|
| 1 | **دامنه اصلی Platform** | `platform.com` / `saite.app` / `mysaite.io` / دیگر | `platform.com` (نیاز به خرید) | **REQUIRED** |
| 2 | **مدل Billing** | Zarinpal/IDPay فقط / Stripe / دستی | فعلاً Zarinpal/IDPay + manual | **REQUIRED** |
| 3 | **سیاست Trial** | ۱۴ روز / ۳۰ روز / بدون trial | ۱۴ روز | **REQUIRED** |
| 4 | **سیاست Grace Period** | ۳ روز / ۷ روز / ۱۴ روز | ۷ روز | **REQUIRED** |
| 5 | **سیاست حذف Tenant** | soft delete با ۳۰ روز grace / hard delete فوری / بدون حذف | soft delete با ۳۰ روز | **REQUIRED** |
| 6 | **سیاست Backup** | روزانه / هفتگی / ماهانه | روزانه + ۳۰ روز retention | **REQUIRED** |
| 7 | **Storage Provider** | MinIO (self-hosted) / ArvanCloud S3 / AWS S3 | MinIO برای شروع، ArvanCloud برای prod | **REQUIRED** |
| 8 | **DNS Provider** | Cloudflare / ArvanCloud DNS / Route53 | Cloudflare (بهترین ACME integration) | **REQUIRED** |
| 9 | **Self-Service Signup** | بله (Tenant خودش ثبت‌نام کند) / فقط دستی توسط Platform Admin | فقط دستی (فاز اول) | **REQUIRED** |
| 10 | **Plan های اولیه** | free/starter/pro/enterprise | starter/pro/enterprise | **REQUIRED** |

### ۲۸.۲ Technical Decisions

| # | تصمیم | گزینه‌ها | پیشنهاد من | HUMAN DECISION |
|---|---|---|---|---|
| 11 | **Multi-Tenancy Model** | A. Shared DB + tenantId / B. Schema per Tenant / C. DB per Tenant | **A (Shared DB + RLS)** | تأیید شده در Blueprint |
| 12 | **RLS Strategy** | FORCE RLS + non-superuser / RLS off + app filter | FORCE RLS | تأیید شده در Blueprint |
| 13 | **Authentication Strategy** | HMAC session (current) / JWT / NextAuth | HMAC session (موجود) | تأیید شده |
| 14 | **Reverse Proxy** | nginx (current) / Traefik / Caddy | Traefik (برای ACME per-domain) | تأیید شده |
| 15 | **Connection Pooler** | بدون / PgBouncer | PgBouncer (transaction mode) | تأیید شده |
| 16 | **Object Storage** | Local / S3 / MinIO | MinIO برای dev، S3-compatible برای prod | تأیید شده |
| 17 | **ایمیل Provider** | Console (current) / SMTP / Resend | SMTP | **REQUIRED** |
| 18 | **Monitoring** | بدون / Prometheus + Grafana / Datadog | Prometheus + Grafana (فاز ۳+) | **REQUIRED** |
| 19 | **Logging** | Pino (current) / Loki / ELK | Pino (موجود) + optional Loki | **REQUIRED** |
| 20 | **CDN** | بدون / Cloudflare / ArvanCloud | Cloudflare (فاز ۲+) | **REQUIRED** |
| 21 | **Rate Limit per Tenant** | per-IP / per-tenant / هردو | هردو | تأیید شده |
| 22 | **Background Jobs** | BullMQ (current) / Temporal / Sidekiq | BullMQ (موجود) | تأیید شده |
| 23 | **آیا User می‌تواند در چند Tenant باشد؟** | بله / خیر | بله (از ابتدا) | **REQUIRED** |
| 24 | **آیا Self-Service Tenant Signup؟** | بله / فقط Platform Admin ایجاد کند | فقط Platform Admin (فاز ۱) | **REQUIRED** |
| 25 | **آیا Custom Domain در همهٔ Planها؟** | فقط pro+ / همه | فقط Pro و بالاتر | **REQUIRED** |

---

## ۲۹) Final Risk Register

| # | Risk | Severity | Probability | Impact | Mitigation | Phase |
|---|---|---|---|---|---|---|
| R1 | **RLS policy اشتباه → query fail** | Critical | Medium | Critical | تست کامل در staging با copy production data. هر policy یک تست. | 3 |
| R2 | **Prisma Client Extension bug → data leak** | Critical | Medium | Critical | RLS به‌عنوان defense. Audit ماهانه. Code review. | 2-3 |
| R3 | **Migration backfill ناقص** | Critical | Low | High | Pre-migration verification query. Constraint NOT NULL fail-fast. | 1-2 |
| R4 | **DNS propagation slow** | High | Medium | Medium | TTL پایین (300s). Wildcard cert قبل از subdomain. | 7 |
| R5 | **Traefik misconfig** | High | Medium | High | تست در staging. Blue-green deploy. Documentation. | 11 |
| R6 | **Multi-tenant test coverage ناقص** | Critical | High | Critical | Phase 10 اجباری. هر query باید تست tenant isolation داشته باشد. | 10 |
| R7 | **JWT token size بزرگ** | Low | Low | Low | Minify payload. حذف claims غیرضروری. | 4 |
| R8 | **PgBouncer + Prisma incompatibility** | High | Medium | Medium | تست PgBouncer در Phase 0.5. Prepared statements مدیریت شود. | 11 |
| R9 | **Customer session interference** | High | Low | High | Cookie name متفاوت per scope. Path scope متفاوت. | 4 |
| R10 | **Backup data size grows** | Medium | Medium | Medium | Per-tenant backup. S3 lifecycle policy. Compression. | 11 |
| R11 | **Billing webhook duplicate** | High | Medium | Medium | `ProcessedWebhook` table با unique eventId. | 8 |
| R12 | **SSL cert renewal fail** | Critical | Low | Critical | Traefik auto-retry. Monitoring cert expiration (30d). | 7 |
| R13 | **Domain hijacking** | Critical | Low | Critical | TXT verification. Re-verify cron. Audit log. | 7 |
| R14 | **Platform Admin credential leak** | Critical | Low | Critical | TOTP اجباری برای super_admin. Audit log. Short session. | 4-5 |
| R15 | **Customer با چند Tenant → confusion** | Low | Medium | Low | Tenant switcher واضح. Last tenant in cookie. | 6 |
| R16 | **Quota enforcement race condition** | High | Medium | High | Cache usage count. Re-check در create. Use transactions. | 8 |
| R17 | **Cache invalidation race** | High | Medium | High | Pattern-based invalidation. Slight delay acceptable. | 9 |
| R18 | **Storage path traversal** | High | Low | High | normalize + base check. RLS-like permission. | 9 |
| R19 | **Outbox event tenant context loss** | High | Medium | High | Worker sets ALS context. RLS enforces. | 2-3 |
| R20 | **Custom DNS provider change** | Medium | Low | Medium | Abstract DNS provider. Multiple providers supported. | 7 |

---

## ۳۰) پاسخ به سؤال نهایی

> **آیا بعد از اجرای این Specification، یک Coding Agent می‌تواند بدون نیاز به حدس زدن درباره معماری، پروژه Saite را Phase به Phase به Multi-Tenant SaaS تبدیل کند؟**

### ✅ **بله**، اگر تمام HUMAN DECISIONS (بخش ۲۸) قبل از شروع مشخص شوند.

### آنچه این Specification فراهم می‌کند:
1. ✅ **نام فایلٔ واقعی** برای هر تغییر (از Repository استخراج شده)
2. ✅ **مدل‌های جدید Prisma** با SQL کامل
3. ✅ **Migration scripts** با SQL کامل
4. ✅ **TypeScript code templates** برای الگوهای کلیدی (ALS, RLS, Prisma Extension, Guards)
5. ✅ **File-Level Map** با Priority، Risk، و Phase
6. ✅ **API-Level Map** با Required Change، Authorization، RLS
7. ✅ **Test Patterns** برای Tenant Isolation و RLS
8. ✅ **Rollback Strategy** per Phase
9. ✅ **Definition of Done** per Phase
10. ✅ **Dependencies** بین Phaseها
11. ✅ **Risk Register** با Mitigation

### اطلاعاتی که هنوز ممکن است کم باشد:

1. **Performance Benchmark:** اندازه‌گیری واقعی query time با ۱,۰۰۰ tenant — **NOT VERIFIED**. پیشنهاد: یک Load Test در Phase 12 انجام شود.

2. **دقیق‌ترین Plan pricing و features:** اعداد دقیق (مثلاً maxProducts) باید توسط Human تأیید شود — **HUMAN DECISION REQUIRED** (بخش ۲۸).

3. **DNS Provider:** Cloudflare یا ArvanCloud؟ — **HUMAN DECISION REQUIRED** (بخش ۲۸).

4. **ایمیل/SMS Provider برای Billing:** SMTP credentials کجا قرار داده شود؟ — **HUMAN DECISION REQUIRED**.

5. **سیاست‌های Backup retention:** ۳۰ روز یا ۹۰ روز؟ — **HUMAN DECISION REQUIRED**.

6. **اگر در حین پیاده‌سازی یک Edge Case کشف شود** (مثلاً یک فیلد که در Schema نیست ولی در کد استفاده شده): Agent باید آن را به لیست TECHNICAL_DEBT اضافه کند و به انسان گزارش دهد.

### چه چیزی در این Specification **عمداً** نیست:

1. **Frontend UI کامل:** فقط structure و component-level changes. طراحی دقیق UI/UX به Frontend Designer سپرده می‌شود.
2. **محتوای ایمیل/SMS:** فقط flow مشخص شده، متن ایمیل نوشته نشده.
3. **Copywriting و localization:** فقط structure.
4. **Performance tuning:** baseline در Phase 12 اندازه‌گیری می‌شود.

---

## Repository Coverage

### فایل‌های بررسی‌شده (برای این Specification)
- ✅ `prisma/schema.prisma` (۵۸۶ خط) — تمام ۲۳ مدل + indexes + enums
- ✅ `prisma/seed.ts`
- ✅ `src/proxy.ts` (۱۶۶ خط)
- ✅ `src/lib/security-headers.ts` (۲۷۴ خط)
- ✅ `src/lib/auth/rbac.ts` (۱۷۷ خط)
- ✅ `src/lib/auth/server/session-token.ts` (۱۳۱ خط)
- ✅ `src/lib/auth/server/session-token-core.ts` (۵۶ خط)
- ✅ `src/lib/auth/server/admin-session.ts` (۱۱۰ خط)
- ✅ `src/lib/auth/server/admin-secret.ts`
- ✅ `src/lib/auth/server/require-role.ts` (۱۱۱ خط)
- ✅ `src/lib/auth/customer-scope.ts` (۱۶ خط)
- ✅ `src/server/shared/db.ts` (۳۵ خط)
- ✅ `src/server/shared/cache.ts`
- ✅ `src/server/shared/event-bus.ts`
- ✅ `src/server/shared/event-types.ts`
- ✅ `src/server/modules/products/repository.ts` (۲۱۸ خط)
- ✅ `src/server/modules/orders/repository.ts` (۷۳ خط)
- ✅ `src/server/modules/orders/service.ts` (۱۸۳ خط)
- ✅ `src/server/modules/orders/state-machine.ts`
- ✅ `src/server/modules/inventory/repository.ts` (۱۲۵ خط)
- ✅ `src/server/modules/finance/repository.ts`
- ✅ `src/server/modules/marketing/repository.ts`
- ✅ `src/server/modules/shipping/repository.ts`
- ✅ `src/server/modules/shipping/service.ts`
- ✅ `src/server/modules/content/repository.ts`
- ✅ `src/server/seo-tools/gateway.ts`
- ✅ `src/server/ai/features/sales-advisor/session-store.ts`
- ✅ `src/server/upload/service.ts`
- ✅ `src/server/upload/providers/local.ts`
- ✅ `src/server/upload/providers/s3.ts`
- ✅ `src/server/payments/service.ts`
- ✅ `src/server/communications/*` (4 فایل)
- ✅ تمام ۴۰ API route handlers (نمونه‌ها: products, orders, inventory, customers, content, marketing, finance, comms, shipping, upload, payments, ai, admin)
- ✅ تمام ۶۴ page.tsx / layout.tsx در `src/app/`
- ✅ `src/app/admin/(panel)/layout.tsx` (۵۵ خط)
- ✅ `src/app/admin/layout.tsx` (۲۷ خط)
- ✅ `src/app/admin/api/session/route.ts` (۲۸۹ خط)
- ✅ `src/app/admin/(panel)/finance/subscriptions/page.tsx`
- ✅ `src/components/admin/admin-shell.tsx`
- ✅ `src/components/admin/admin-sidebar.tsx`
- ✅ `src/components/admin/finance/subscriptions-client.tsx` (۲۰۲ خط)
- ✅ `next.config.ts` (۷۱ خط)
- ✅ `Dockerfile` (۵۱ خط)
- ✅ `docker-compose.prod.yml` (۱۷۸ خط)
- ✅ `docker-compose.dev.yml` (۵۴ خط)
- ✅ `nginx/nginx.conf` (کامل)
- ✅ `.env.example` (۱۸۴ خط)
- ✅ `package.json`
- ✅ `SAAS_READINESS_AUDIT.md` (۹۸۴ خط)
- ✅ `SAAS_ARCHITECTURE_BLUEPRINT.md` (۳۴۹۳ خط)

### پوشش
- ✅ تمام ۲۳ مدل Prisma بررسی شد
- ✅ تمام ۴۰ API route handler بررسی شد
- ✅ تمام ۶۴ page/layout frontend بررسی شد
- ✅ تمام ماژول‌های server بررسی شد
- ✅ تمام auth files بررسی شد
- ✅ تمام infrastructure (Docker, nginx) بررسی شد
- ⚠️ تست‌های موجود (`tests/`): فقط header برای tenant search، نه بررسی عمیق
- ⚠️ E2E tests (`e2e/`): فقط file listing
- ⚠️ برخی components کلاینتی بزرگ: بررسی نشد

### محدودیت‌ها
- این Specification **سند طراحی** است، نه کد تولید‌شده.
- تمام SQL و TypeScript snippets **الگو** هستند، نه production-ready.
- مقادیر Plan و Quota **پیشنهاد** هستند، باید توسط Human تأیید شوند.

---

**End of Specification.**
