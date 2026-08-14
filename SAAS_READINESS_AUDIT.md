# 📋 گزارش ممیزی معماری SaaS فروشگاه‌ساز چندمستاجری

**پروژه:** `parssystem1-coder/saite` (شاخه `arena/01a00248-saite`)
**تاریخ ممیزی:** ۱۴ اوت ۲۰۲۶
**حوزه:** Repository موجود، بدون هیچ تغییر
**متدولوژی:** بررسی ایستای عمیق کد، schema، middleware، nginx، Docker، env، RBAC، repositories، services و API routes

---

## ۱) Executive Summary

پروژه فعلی یک **فروشگاه تک‌مستاجری (Single-Tenant E-commerce)** با کیفیت مهندسی بالا برای کسب‌وکار «ماشین‌های اداری» است. معماری آن عمداً روی یک مجموعه‌داده مشترک و یک دامنه فرضی (`saite.ir`) طراحی شده و اساساً هیچ مفهومی از `tenant`، `store`، `organization` یا Multi-Tenancy — اعم از داده‌ای، کدی، زیرساختی یا مستندسازی — در آن وجود ندارد.

جستجوی تمام‌متنی روی کل Repository (شامل `src/`, `prisma/`, `docs/`, `tests/`, `e2e/`, `nginx/`, `docker-compose*.yml`, `Dockerfile`, `next.config.ts`, `proxy.ts`) برای الگوهای `tenant`, `tenantId`, `storeId`, `organizationId`, `useTenant`, `useStore`, `x-tenant`, `subdomain`, `multi-tenant`, `multi store`, `host-based` **هیچ نتیجه‌ای برنمی‌گرداند** (به‌جز سه مورد در JSON-LD سئو که «organization» نام یک Schema.org type است و ربطی به Multi-Tenancy ندارد).

این پروژه **حداقل ۶۰٪ از سطح زیرین یک SaaS چندمستاجری را فاقد است** و فاصلهٔ آن با یک Multi-Tenant E-commerce SaaS آمادهٔ Production، نه با چند تغییر جزئی، بلکه با یک **بازطراحی معمارانهٔ بنیادی** پر می‌شود.

### نتیجه‌گاه‌بنا:

# 🔴 RE-ARCHITECTURE REQUIRED

اگر هدف، داشتن یک فروشگاه‌ساز SaaS با Tenant مستقل، دامنه اختصاصی، پلن و اشتراک، و مدیریت متمرکز Platform Admin است، تقریباً هیچ‌یک از این مفاهیم در پروژهٔ فعلی پیاده‌سازی نشده‌اند. تبدیل این پروژه به SaaS، معادل نوشتن یک محصول جدید روی شالودهٔ قطعات قابل‌استفادهٔ فعلی است، نه معادل افزودن چند جدول و Middleware.

---

## ۲) Readiness Score

| محور | امتیاز | دلیل فنی مختصر |
|---|---:|---|
| **Overall SaaS Readiness** | **18/100** | تک‌مستاجری کامل؛ زیرساخت اشتراکی فاقد |
| **Multi-Tenancy** | **2/100** | صفر مدل `Tenant/Store/Organization`؛ صفر tenantId در schema؛ صفر tenant context در middleware/service/repository |
| **Tenant Isolation** | **5/100** | مالکیت فقط با `customerId` (مالک داده) چک می‌شود، نه Tenant. User A می‌تواند با دانستن ID سفارشِ User B، از `/api/orders/{id}` آن را ببیند؛ فقط ownership مشتری چک می‌شود. |
| **Authentication** | **75/100** | پنل ادمین HMAC + 2FA + rate-limit + audit؛ ولی فقط یک حساب ادمین سراسری از `env` |
| **Authorization** | **70/100** | RBAC سه‌سطحی (admin/operator/viewer) در سرور enforce می‌شود؛ ولی فقط برای پنل تک‌فروشگاهی، نه Tenantها |
| **Database** | **30/100** | Prisma ۲۳ مدل، Index مناسب، Migration منظم؛ ولی هیچ tenant-aware model وجود ندارد؛ unique constraintهای سراسری (`slug`, `sku`, `email`) در Multi-Tenant دچار تداخل می‌شوند |
| **Backend** | **55/100** | Repository→Service→Route الگوی خوب؛ خطاها، validation، rate-limit؛ ولی هیچ tenant context در تمام لایه‌ها |
| **Frontend** | **40/100** | App Router، proxy، RBAC-aware nav، CSP؛ ولی هیچ tenant resolution در سطح route یا middleware؛ فروشگاه hardcoded روی `NEXT_PUBLIC_SITE_URL` |
| **Custom Domains** | **0/100** | nginx فقط یک دامنه با cert hardcoded (`/etc/letsencrypt/live/saite.ir/`) سرو می‌کند. هیچ host-based routing، هیچ domain→tenant map، هیچ wildcard cert، هیچ cert per-tenant |
| **Subscription / Plans** | **5/100** | `Subscription` فقط یک TypeScript type در `src/types/finance.ts` است که در یک `mock-adapter` (localStorage) استفاده می‌شود. هیچ Plan، هیچ Limit، هیچ Quota در DB یا Backend |
| **Infrastructure** | **60/100** | Docker، Postgres، Redis، Nginx، Certbot همگی آماده‌اند؛ ولی همه برای **یک** اپلیکیشن، نه چند Tenant |
| **Security** | **70/100** | CSP دو لایه، nonce، TOTP، audit، rate-limit؛ ولی هیچ tenant-scoped token، هیچ tenant claim |
| **Scalability** | **45/100** | Multi-instance از طریق Redis ساپورت می‌شود؛ ولی cache keyها فاقد tenantId، و ۸GB VPS برای هزاران Tenant کافی نیست |

---

## ۳) What We Already Have (آنچه قابل استفاده است)

این بخش‌ها **می‌توانند** با اعمال تغییرات به یک Multi-Tenant SaaS منتقل شوند:

| # | بخش | فایل/مسیر | ارزش برای SaaS |
|---|---|---|---|
| 1 | **RBAC سه‌سطحی (admin/operator/viewer)** | `src/lib/auth/rbac.ts`، `src/lib/auth/server/require-role.ts` | قابل استفاده به‌عنوان نقش‌های **Tenant Admin** |
| 2 | **Session Token HMAC + TOTP** | `src/lib/auth/server/session-token.ts`، `src/lib/auth/server/totp.ts` | الگوی خوب برای tenant-scoped session (فقط باید tenantId به payload اضافه شود) |
| 3 | **Rate Limit (file/redis)** | `src/lib/auth/server/rate-limit*.ts` | قابل گسترش با bucket per-tenant |
| 4 | **Audit Log** | `src/lib/auth/server/audit-log.ts` | الگوی عالی برای audit سراسری Platform Admin |
| 5 | **CSP / Security Headers** | `src/lib/security-headers.ts`، `src/proxy.ts` | به‌طور مستقیم قابل استفاده |
| 6 | **Prisma Schema پایه** | `prisma/schema.prisma` (۲۳ مدل) | جداول قابل تبدیل به tenant-scoped با افزودن `tenantId` + migration |
| 7 | **Repository→Service Pattern** | `src/server/modules/*/repository.ts`، `service.ts` | الگوی معماری عالی؛ فقط نیاز به تزریق tenant context |
| 8 | **Outbox + Event Bus** | `src/server/shared/event-bus.ts`، `outbox-worker` | آماده برای رویدادهای tenant-aware |
| 9 | **Docker Compose + Nginx** | `docker-compose.prod.yml`، `nginx/nginx.conf` | زیرساخت پایه؛ فقط نیاز به template-سازی برای multi-tenant |
| 10 | **Pino Logger** | `src/server/shared/logger.ts` | آماده برای structured logging با tenantId |
| 11 | **Zod Validation** | در تمام API routeها | عالی برای validation ورودی‌های tenant-aware |
| 12 | **API Client Abstractions** | `src/lib/api.ts`، `src/lib/api-client.ts` | نیاز به افزودن `X-Tenant` header |
| 13 | **Redis-backed Cache** | `src/server/shared/cache.ts` | فقط نیاز به prefix `tenant:{id}:` در کلیدها |
| 14 | **Auth Flow Server-Side** | `src/app/admin/api/session/route.ts` | الگوی مرجع برای tenant login |
| 15 | **Backup/Log Rotation Patterns** | `src/server/jobs/dispatchers/log-retention-dispatcher.ts` | قابل گسترش |

---

## ۴) What Is Missing (آنچه وجود ندارد — بحرانی برای SaaS)

### ۴.۱ لایهٔ داده (Prisma)
- ❌ مدل `Tenant` (یا `Store` / `Organization`)
- ❌ مدل `Plan` و `Subscription` به‌عنوان جدول DB (فعلاً فقط type)
- ❌ ستون `tenantId` در هیچ‌یک از ۲۳ مدل
- ❌ جدول `Domain` برای mapping host → tenant
- ❌ جدول `TenantUser` و `TenantUserRole` (ادمین‌های متعدد برای یک Tenant)
- ❌ جدول `FeatureFlag` سراسری و per-tenant
- ❌ جدول `UsageMeter` یا `QuotaUsage` برای محدودیت پلن
- ❌ جدول `AuditLogPlatform` برای اقدامات Platform Admin
- ❌ Index ترکیبی `(tenantId, slug)`، `(tenantId, sku)`، `(tenantId, email)`
- ❌ Global Unique روی `slug`/`sku`/`email` که در Multi-Tenant باید به `(tenantId, slug)` تبدیل شود

### ۴.۲ لایهٔ Backend
- ❌ Tenant Resolver Middleware
- ❌ Tenant Context Service (AsyncLocalStorage یا Request-scoped)
- ❌ `requireTenant()` guard معادل `requirePermission`
- ❌ `tenantId` در Prisma Client (با `Prisma Client Extensions` یا middleware سفارشی)
- ❌ Plan Enforcement Layer (Quota Checking قبل از Create)
- ❌ Custom Domain Verification Service
- ❌ SSL Provisioning Integration (Let's Encrypt per-tenant)
- ❌ Tenant Provisioning API (Create/Suspend/Resume)
- ❌ Plan Change / Upgrade / Downgrade Flow
- ❌ Trial Period handling
- ❌ Billing Webhooks (ZarinPal/IDPay → Plan Activation)

### ۴.۳ لایهٔ Frontend
- ❌ Host-based tenant resolution در `proxy.ts`
- ❌ Tenant-aware layouts (هر Tenant پوستهٔ خودش)
- ❌ Platform Admin UI (Tenant list, Plan CRUD, Subscription)
- ❌ Tenant Settings UI (دامنه، SSL status، plan)
- ❌ Tenant Onboarding Wizard
- ❌ Plan-aware feature gating در UI (Feature Flag system)

### ۴.۴ زیرساخت
- ❌ nginx با wildcard server block (`server_name _` با SNI)
- ❌ Certbot wildcard certificate (DNS-01 challenge)
- ❌ Traefik یا Caddy با Let's Encrypt integration خودکار
- ❌ Object Storage (S3-compatible) برای media هر Tenant
- ❌ CDN با per-tenant origin
- ❌ Read Replica و Connection Pooling (PgBouncer)
- ❌ Tenant-aware cache partitioning
- ❌ Backup per-tenant

### ۴.۵ امنیت
- ❌ `tenantId` claim در Session
- ❌ Tenant-scoped audit log
- ❌ Per-tenant rate limit buckets
- ❌ Cross-tenant IDOR tests
- ❌ Domain Verification Flow (TXT record)
- ❌ جلوگیری از Domain Hijacking

---

## ۵) What Must Be Changed (تغییرات ضروری به تفکیک لایه)

### Frontend
1. `src/proxy.ts`: افزودن host-based tenant resolution (extract `Host` header → query `Domain` table → attach tenantId به request)
2. `src/lib/api-client.ts`: ارسال `X-Tenant` header در تمام درخواست‌ها
3. `src/lib/api.ts`: prefix کردن URLها با tenant subdomain (اگر wildcard) یا حفظ absolute URL
4. `src/app/admin/(panel)/*`: افزودن `TenantSwitcher` برای Platform Admin
5. ایجاد `src/app/admin/platform/*` (جدا از `/admin` فروشگاه):
   - `/admin/platform/tenants` — لیست + CRUD
   - `/admin/platform/plans` — تعریف پلن
   - `/admin/platform/subscriptions` — اشتراک‌ها
   - `/admin/platform/domains` — مدیریت دامنه
   - `/admin/platform/usage` — مصارف
6. `src/lib/auth/admin-login-contract.ts`: افزودن tenantId به login flow

### Backend
1. ساخت `src/server/tenants/`:
   - `tenant-resolver.ts` (host → tenantId)
   - `tenant-context.ts` (AsyncLocalStorage)
   - `tenant-guard.ts`
2. ساخت `src/server/subscriptions/`:
   - `plan-service.ts`
   - `subscription-service.ts`
   - `quota-enforcer.ts`
3. ساخت `src/server/domains/`:
   - `domain-service.ts`
   - `domain-verifier.ts`
4. تغییر تمام Repositoryهای موجود برای گرفتن tenantId:
   ```ts
   // قبل
   prisma.product.findMany({ where })
   // بعد
   prisma.product.findMany({ where: { ...where, tenantId } })
   ```
5. `src/lib/auth/customer-scope.ts`: `canAccessOrder` باید tenantId را هم چک کند
6. `src/lib/auth/server/require-role.ts`: افزودن `requireTenant()` و `requirePlatformAdmin()`

### Database
1. Migration جدید: افزودن `Tenant`, `Plan`, `Subscription`, `TenantUser`, `Domain` به `prisma/schema.prisma`
2. Migration بزرگ: افزودن `tenantId` به ۲۳ مدل موجود + backfill از یک tenant پیش‌فرض
3. تغییر `@@unique([slug])` → `@@unique([tenantId, slug])` در Product
4. تغییر `@@unique([email])` → `@@unique([tenantId, email])` در Customer
5. تغییر `@@unique([sku])` → `@@unique([tenantId, sku])` در Product
6. Indexهای ترکیبی: `@@index([tenantId, createdAt])` در همه‌جا
7. Foreign Key Cascade rules بازنگری

### Authentication
- افزودن `tenantId` و `tenantRole` به `SessionPayload` و `AdminSessionPayload`
- ایجاد `PlatformAdmin` (super-admin) جدا از `TenantAdmin`
- ساخت flow ورود: `/admin/login` (Platform) و `/admin/login` (Tenant) یا subdomain-aware
- Tenant-aware cookie path: `Path=/` با scoped name `saite_session_{tenantSlug}`

### Authorization
- جداسازی: Platform Permission Model (super_admin) و Tenant Permission Model (RBAC فعلی)
- افزودن `PlatformRole = 'super_admin' | 'support' | 'finance_platform'`
- Plan-based feature gating در requirePermission

### Infrastructure
1. **nginx** → Traefik یا Caddy (Let's Encrypt خودکار per-domain)
2. **Database**: PgBouncer بین App و Postgres برای connection pooling
3. **Redis**: namespace per-tenant (یا shared)
4. **Object Storage**: S3-compatible (ArvanCloud / MinIO) برای uploads هر Tenant
5. **CDN**: Cloudflare یا ArvanCloud CDN با custom hostname per-tenant
6. **Containerization**: تفکیک اپ از worker و اضافه کردن scheduler برای billing/expiry
7. **Observability**: per-tenant metrics (Prometheus + tenantId label)

### Domain
- تغییر `nginx/nginx.conf` برای wildcard
- DNS: `*.example.com` → VPS IP
- Let's Encrypt wildcard cert (DNS-01 challenge با API provider)
- برای Custom Domain: Caddy/Traefik + ACME DNS challenge

### Subscription
- جدول `Plan` با فیلدهای JSON برای `features` و `limits`
- جدول `Subscription` با وضعیت `trialing|active|past_due|cancelled`
- Cron job روزانه برای suspend کردن Subscriptionهای منقضی‌شده
- Webhook از درگاه پرداخت برای فعال‌سازی خودکار

### Security
- Tenant IDOR test suite جدید
- Testهایی که User A از Tenant X سعی کند به Resource Tenant Y دسترسی پیدا کند
- Per-tenant rate limit با bucket key شامل `tenantId`
- Audit log platform با capture تمام اقدامات Platform Admin

---

## ۶) Database Gap Analysis

### ۶.۱ Modelهایی که باید اضافه شوند
```prisma
model Tenant {
  id            String   @id @default(cuid())
  slug          String   @unique           // برای subdomain
  displayName   String
  status        TenantStatus @default(trial)
  ownerEmail    String
  createdAt     DateTime @default(now())
  suspendedAt   DateTime?
  
  domains       Domain[]
  subscriptions Subscription[]
  users         TenantUser[]
  // و Relation به همه ۲۳ مدل موجود
}

model Plan {
  id          String   @id @default(cuid())
  code        String   @unique             // starter, pro, enterprise
  name        String
  priceRial   Int
  interval    PlanInterval                  // monthly, yearly
  features    Json                          // ['seo','custom_domain',...]
  limits      Json                          // {maxProducts:1000,maxUsers:5,...}
  active      Boolean  @default(true)
}

model Subscription {
  id            String   @id @default(cuid())
  tenantId      String
  planId        String
  status        SubscriptionStatus
  startsAt      DateTime
  endsAt        DateTime?
  trialEndsAt   DateTime?
  
  tenant Tenant @relation(...)
  plan   Plan   @relation(...)
}

model Domain {
  id          String   @id @default(cuid())
  tenantId    String
  hostname    String   @unique              // customer-a.ir
  isPrimary   Boolean  @default(false)
  verified    Boolean  @default(false)
  verifiedAt  DateTime?
  sslStatus   SslStatus @default(pending)
  
  tenant Tenant @relation(...)
}

model TenantUser {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String
  role      TenantRole
  ...
}
```

### ۶.۲ Modelهای فعلی که باید `tenantId` بگیرند
همه ۲۳ مدل: `Product`, `Order`, `Customer`, `PaymentIntent`, `Invoice`, `Transaction`, `Shipment`, `ShippingRate`, `Coupon`, `CouponRedemption`, `Campaign`, `EmailLog`, `SmsLog`, `Page`, `Post`, `MenuItem`, `InventoryItem`, `InventoryAdjustment`, `InventoryReservation`, `OutboxEvent`, `AiUsageLog`, `FeatureFlag`, `OrderItem`

### ۶.۳ Relationهای مشکل‌دار فعلی
- `Product.slug` @unique — در Multi-Tenant باید `(tenantId, slug)` باشد
- `Product.sku` @unique — در Multi-Tenant باید `(tenantId, sku)` باشد
- `Customer.email` @unique — در Multi-Tenant باید `(tenantId, email)` باشد
- `Invoice.invoiceNumber` @unique — در Multi-Tenant باید `(tenantId, invoiceNumber)` باشد
- `Coupon.code` @unique — در Multi-Tenant باید `(tenantId, code)` باشد
- `Page.slug` / `Post.slug` @unique — در Multi-Tenant باید `(tenantId, slug)` باشد
- `MenuItem` — کاملاً shared، باید tenant-scoped شود
- `AiUsageLog.actorId` — باید `tenantId` هم داشته باشد
- `FeatureFlag` — باید dual scope داشته باشد: platform-wide + per-tenant override

### ۶.۴ Indexهای لازم
```prisma
@@index([tenantId])
@@index([tenantId, createdAt])
@@index([tenantId, status, createdAt])
@@index([tenantId, customerId])  // برای orders
```

### ۶.۵ آیا Shared Database مناسب است؟
**بله**، برای شروع (تا ۵۰۰–۱,۰۰۰ Tenant) Shared Database با `tenantId` بهترین انتخاب است. دلایل:
1. هزینهٔ عملیاتی کمتر
2. Migration ساده‌تر
3. Cross-tenant analytics ممکن
4. مناسب برای Modular Monolith فعلی

برای مقیاس بالای ۵,۰۰۰ Tenant:
- **Schema-per-Tenant** در PostgreSQL (هر Tenant یک schema)
- یا **Database-per-Tenant** (هر Tenant یک DB) — ایزوله‌سازی کامل، اما Migration پیچیده

پیشنهاد: شروع با **Shared DB + Row-Level Security (PostgreSQL RLS)** به‌عنوان لایهٔ defense-in-depth.

---

## ۷) API Gap Analysis

### ۷.۱ APIهایی که باید Tenant-aware شوند

| Endpoint | فعلی | نیاز به Tenant Context | نحوهٔ انتقال |
|---|---|---|---|
| `GET /api/products` | بدون context | ✅ | از `Host` header یا `X-Tenant` header |
| `POST /api/products` | فقط `requirePermission('catalog:write')` | ✅ | Tenant از session + host resolution |
| `GET /api/products/{id}` | مستقیم | ✅ | بعد از load، tenantId مقایسه شود |
| `GET /api/orders/{id}` | فقط `canAccessOrder` | ✅ | باید tenantId هم چک شود |
| `POST /api/orders` | از `session.sub` | ✅ | tenantId از session |
| `GET /api/customers/session` | global | ✅ | فقط customers همان Tenant |
| `GET /api/inventory` | global | ✅ | فقط محصولات همان Tenant |
| `GET /api/inventory/alerts` | global | ✅ | فقط alerts همان Tenant |
| `GET /api/finance/invoices` | global | ✅ | فقط invoices همان Tenant |
| `GET /api/marketing/coupons` | global | ✅ | فقط coupons همان Tenant |
| `POST /api/marketing/coupons/validate` | global | ✅ | فقط coupons همان Tenant |
| `GET /api/content/pages` | global | ✅ | فقط pages همان Tenant |
| `GET /api/content/posts` | global | ✅ | فقط posts همان Tenant |
| `GET /api/ai/advisor` | global | ✅ | فقط context محصولات همان Tenant |
| `POST /api/upload` | `requirePermission('content:write')` | ✅ | فایل در storage path آن Tenant |
| `POST /api/payments` | از `customerId` | ✅ | paymentIntent با tenantId |
| `/api/payments/webhook/{provider}` | global | ✅ | tenantId از orderId (قبلاً ذخیره شده) |
| `GET /api/comms/email-logs` | admin only | ✅ | فقط logs آن Tenant |
| `GET /api/comms/sms-logs` | admin only | ✅ | فقط logs آن Tenant |

### ۷.۲ APIهای جدید پلتفرم (Platform Admin)

| Endpoint | عملکرد |
|---|---|
| `POST /api/platform/auth/login` | ورود Platform Admin |
| `GET /api/platform/tenants` | لیست Tenantها |
| `POST /api/platform/tenants` | ساخت Tenant جدید |
| `GET /api/platform/tenants/{id}` | جزئیات |
| `PATCH /api/platform/tenants/{id}` | تعلیق/فعالسازی |
| `DELETE /api/platform/tenants/{id}` | حذف (نرم) |
| `GET /api/platform/plans` | لیست پلن‌ها |
| `POST /api/platform/plans` | ساخت پلن |
| `PATCH /api/platform/plans/{id}` | ویرایش |
| `GET /api/platform/subscriptions` | لیست اشتراک‌ها |
| `POST /api/platform/subscriptions` | فعال‌سازی دستی |
| `PATCH /api/platform/subscriptions/{id}` | تغییر plan |
| `GET /api/platform/domains` | لیست دامنه‌ها |
| `POST /api/platform/tenants/{id}/domains` | افزودن دامنه |
| `POST /api/platform/tenants/{id}/domains/{domainId}/verify` | تأیید دامنه |
| `GET /api/platform/usage` | گزارش مصرف |

### ۷.۳ Tenant Context چگونه منتقل شود

**گزینه ۱: AsyncLocalStorage (پیشنهادی)**
```ts
// src/server/tenants/context.ts
import { AsyncLocalStorage } from 'async_hooks'
const als = new AsyncLocalStorage<{ tenantId: string; tenantSlug: string }>()
export const tenantContext = {
  run: (ctx, fn) => als.run(ctx, fn),
  get: () => als.getStore()
}
```

**گزینه ۲: Prisma Client Extensions**
```ts
prisma.$extends({
  query: {
    product: {
      async findMany({ args, query }) {
        const ctx = tenantContext.get()
        args.where = { ...args.where, tenantId: ctx?.tenantId }
        return query(args)
      }
    }
  }
})
```

**گزینه ۳: Explicit Parameter**
هر تابع repository یک پارامتر `tenantId` بگیرد (ساده اما verbose).

**پیشنهاد:** ترکیب ۱ + ۲ + PostgreSQL Row-Level Security (Defense in depth).

---

## ۸) Domain Architecture (پیشنهادی)

```
                    Internet
                       │
                       ▼
            ┌─────────────────────┐
            │   Cloudflare/CDN    │   (اختیاری، فقط cache static)
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ Traefik / Caddy     │   ← TLS termination
            │  - Auto ACME        │     (Let's Encrypt per-domain)
            │  - Host routing     │     DNS-01 challenge via API
            └──────────┬──────────┘
                       │
            Host: customer-a.ir
            Host: customer-b.com
            Host: customer-c.ir
            Host: admin.platform.com
                       │
                       ▼
            ┌─────────────────────┐
            │   Next.js App       │   (Multi-instance behind LB)
            │   proxy.ts extracts │
            │   tenantId from DB  │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │  Tenant Resolver    │   ← middleware
            │  Host → tenantId    │
            │  Attach to request  │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │ TenantContext (ALS) │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   API Routes        │
            │  + Prisma (with     │
            │    tenantId filter) │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   PostgreSQL + RLS  │   (Shared DB, Row-Level Security)
            └─────────────────────┘
```

### فرآیند Onboarding یک Customer جدید
```
Platform Admin → "Create Tenant" form
  ↓
POST /api/platform/tenants
  ↓
1. Insert Tenant (status=trial)
2. Create default TenantUser (owner)
3. Insert Subscription (plan='trial', trialEndsAt=+14days)
4. Create default Domain (auto-subdomain: {slug}.platform.com)
5. Send invite email
  ↓
Customer logs in → /admin/login
  ↓
Wants custom domain:
  POST /api/platform/tenants/{id}/domains
    { hostname: "customer-a.ir" }
  ↓
System returns:
  - TXT record: saite-verify={token}
  - A record: @ → VPS_IP (or CNAME → edge)
  ↓
Customer adds DNS records
  ↓
POST /api/platform/tenants/{id}/domains/{domainId}/verify
  ↓
System:
  1. Queries DNS TXT → must match token
  2. Triggers Traefik/Caddy ACME (DNS-01 via API)
  3. Waits for cert provisioning
  4. Updates Domain.sslStatus='active'
  ↓
customer-a.ir now resolves to Tenant A's store
```

---

## ۹) Subscription Architecture (پیشنهادی)

```
┌─────────────┐
│   Tenant    │
│  (status)   │
└──────┬──────┘
       │  1:N
       ▼
┌──────────────────┐
│  Subscription    │
│  - tenantId      │   status: trialing|active|past_due|cancelled|expired
│  - planId        │   startsAt / endsAt / trialEndsAt
│  - status        │   currentPeriodStart / currentPeriodEnd
│  - billingCycle  │   cancelAtPeriodEnd (bool)
└──────┬───────────┘
       │  N:1
       ▼
┌──────────────────┐
│      Plan        │
│  - code          │   'starter' | 'pro' | 'enterprise'
│  - name          │
│  - priceRial     │   مثلاً ۵٬۰۰۰٬۰۰۰ ریال/ماه
│  - interval      │   monthly | yearly
│  - features[]    │   ['custom_domain','seo_tools','ai_advisor', ...]
│  - limits{}      │   { maxProducts: 1000, maxUsers: 5, maxStorageMb: 5000, ... }
│  - active        │
└──────────────────┘
```

### Plan Features (مثال)
```json
{
  "starter": {
    "features": ["basic_catalog", "basic_orders", "email_support"],
    "limits": {
      "maxProducts": 100,
      "maxUsers": 1,
      "maxStorageMb": 500,
      "maxOrdersPerMonth": 200,
      "maxCategories": 10,
      "customDomain": false,
      "advancedReports": false,
      "aiAdvisor": false
    }
  },
  "pro": {
    "features": ["basic_catalog", "basic_orders", "coupons", "email_marketing", "custom_domain", "advanced_reports"],
    "limits": { "maxProducts": 5000, "maxUsers": 5, "maxStorageMb": 5000, "maxOrdersPerMonth": 5000, ... }
  }
}
```

### Quota Enforcement (در Backend، نه فقط UI)

```ts
// src/server/subscriptions/quota-enforcer.ts
export async function enforceQuota(tenantId: string, resource: 'product' | 'order' | 'user' | 'storage'): Promise<void> {
  const sub = await getActiveSubscription(tenantId)
  if (!sub) throw new SubscriptionRequiredError()
  
  const limits = sub.plan.limits as PlanLimits
  const usage = await getCurrentUsage(tenantId)
  
  switch (resource) {
    case 'product':
      if (usage.productCount >= limits.maxProducts)
        throw new QuotaExceededError(`سقف محصول (${limits.maxProducts}) تکمیل شد. لطفاً پلن خود را ارتقا دهید.`)
      break
    case 'order':
      if (usage.ordersThisMonth >= limits.maxOrdersPerMonth)
        throw new QuotaExceededError(...)
      // ...
  }
}

// در Route Handler:
export async function POST(req) {
  await enforceQuota(tenant.tenantId, 'product')   // ← enforce شدن
  const product = await productsService.create(...)
}
```

**نکتهٔ بحرانی:** این enforce شدن باید **در Backend** باشد، نه فقط UI. UI فقط برای UX خوب است (مثلاً دکمهٔ «افزودن» مخفی شود)، اما تصمیم واقعی در Server Route گرفته می‌شود.

---

## ۱۰) Platform Admin vs Tenant Admin

### Platform Admin (super_admin)
- ساخته‌شده با seed script
- از env یا جدول `PlatformAdmin`
- دسترسی به `src/app/admin/platform/*`
- اختیارات:
  - **Tenant Management:** CRUD، Suspend/Resume، Delete
  - **Plan Management:** تعریف/ویرایش پلن‌ها
  - **Subscription Management:** دستی فعال‌سازی، تمدید، لغو
  - **Domain Management:** تأیید، حذف، SSL status
  - **Usage Monitoring:** مصرف منابع هر Tenant
  - **Platform Analytics:** MRR، ARR، churn rate
  - **System Health:** وضعیت کلی سیستم
  - **Impersonation:** (اختیاری، برای Support) ورود به Tenant به‌عنوان Owner

### Tenant Admin (admin/operator/viewer از RBAC فعلی)
- همان نقش‌های فعلی (admin/operator/viewer)
- محدود به Tenant خودش
- هر Tenant می‌تواند چند `TenantUser` با نقش‌های مختلف داشته باشد
- اختیارات:
  - مدیریت فروشگاه خودش (محصول، سفارش، مشتری، محتوا)
  - مشاهدهٔ پلن فعلی و مصرف
  - درخواست ارتقا/تنزل پلن
  - مشاهدهٔ فاکتورهای پرداخت پلن
  - (اگر پلن اجازه دهد) مدیریت دامنهٔ سفارشی

### مسیرها
```
/admin/login                        → Platform Admin login (subdomain: admin.platform.com)
/{tenant-slug}.platform.com/admin   → Tenant Admin login (subdomain per-tenant)
customer-a.ir/admin                 → Tenant Admin login (custom domain)
```

---

## ۱۱) VPS Architecture (پیشنهادی برای شروع)

```
Internet
   │
   ▼
Traefik (reverse proxy + auto Let's Encrypt)
   │
   ├──→ app:3000 (Next.js - multi-instance behind LB)
   │      ↓
   │   ┌──┴──────────────────────┐
   │   │ Tenant Resolver (proxy.ts) │
   │   └──┬──────────────────────┘
   │      ↓
   │   ┌──┴──────────────────────┐
   │   │  PgBouncer (port 6432)  │
   │   └──┬──────────────────────┘
   │      ↓
   │   PostgreSQL 17 (port 5432, internal)
   │   (with RLS policies)
   │
   ├──→ worker (BullMQ jobs)
   │
   ├──→ redis:6379 (shared)
   │
   └──→ minio:9000 (S3-compatible for uploads)
```

### آنچه در پروژه فعلی آماده است
- ✅ Docker، Docker Compose
- ✅ PostgreSQL
- ✅ Redis
- ✅ Next.js standalone build
- ✅ Certbot (ولی hardcoded روی یک cert)
- ✅ Health checks

### آنچه باید اضافه/تغییر شود
- ❌ Traefik (یا Caddy) جایگزین nginx static config
- ❌ PgBouncer (connection pooler)
- ❌ MinIO (S3-compatible) یا ArvanCloud S3
- ❌ Multi-container orchestration (Swarm / K3s)
- ❌ Backup script per-tenant

### Bottleneckهای VPS اولیه (مثلاً ۸GB RAM)
| Bottleneck | تأثیر | راه‌حل |
|---|---|---|
| **PostgreSQL connections** | در Multi-Tenant تعداد connection زیاد می‌شود | PgBouncer |
| **PostgreSQL CPU** | با رشد داده کند می‌شود | Read Replica، ایندکس‌گذاری صحیح |
| **Redis memory** | cache + queue + rate-limit | افزایش RAM یا Redis Cluster |
| **Disk I/O** | گزارش‌ها، backup | SSD NVMe، یا Object Storage |
| **Network** | بارگذاری media هر Tenant | CDN با per-tenant origin |
| **App CPU** | SSR Next.js برای همه Tenantها | Multi-instance + Load Balancer |

---

## ۱۲) Scaling Roadmap

### Phase 1: ۱–۵۰ Tenant (همان VPS ۸GB)
- Shared DB + `tenantId` filtering
- Single Next.js instance
- Redis shared
- nginx → Traefik (برای per-tenant SSL)
- Local disk برای uploads (با backup)
- بدون CDN (یا Cloudflare رایگان)

**اولین Bottleneck:** PostgreSQL CPU هنگام گزارش‌های سنگین (Reports).

### Phase 2: ۵۰–۵۰۰ Tenant
- PgBouncer اضافه شود
- Next.js ۲–۳ instance
- Object Storage (MinIO یا ArvanCloud) برای media
- CDN (Cloudflare یا ArvanCloud)
- Read Replica برای گزارش‌ها
- Redis maxmemory افزایش یابد

**اولین Bottleneck:** Disk I/O برای media.

### Phase 3: ۵۰۰–۵٬۰۰۰ Tenant
- Database Cluster (Primary + 2 Replica)
- Redis Cluster
- Next.js با auto-scaling (5–10 instance)
- CDN فعال
- Background worker pool اختصاصی
- Per-tenant rate limit سخت‌گیرانه

**اولین Bottleneck:** PostgreSQL Query Plan (full-table-scan در جداول بزرگ). راه‌حل: Partitioning by `tenantId` (`PARTITION BY HASH (tenant_id)`).

### Phase 4: ۵٬۰۰۰+ Tenant
- **Schema-per-Tenant** در PostgreSQL
- یا **Database-per-Tenant** (ایزوله کامل، اما Migration خودکار می‌خواهد)
- Microservice split (اختیاری):
  - Product Service
  - Order Service
  - Billing Service
  - Notification Service
- Event-driven با Kafka/Redis Streams
- Kubernetes (K8s) یا Nomad
- Multi-region deployment

---

## ۱۳) Implementation Roadmap

### Phase 0 — Architecture Preparation (هفته ۱)
- **هدف:** زیرساخت Multi-Tenancy آماده شود، بدون تغییر رفتار فعلی
- **Database:** جداول `Tenant`, `Plan`, `Subscription`, `Domain` اضافه شوند (با tenant پیش‌فرض برای داده‌های موجود)
- **Backend:** `TenantContext` با `AsyncLocalStorage` ساخته شود؛ فعلاً همیشه مقدار ثابت `default-tenant` می‌گیرد
- **Frontend:** بدون تغییر
- **ریسک:** پایین
- **وابستگی:** بدون

### Phase 1 — Tenant Context Enforcement (هفته ۲–۳)
- **هدف:** تمام queryها `tenantId` بگیرند
- **Database:** Migration بزرگ: ۲۳ مدل `tenantId` بگیرند + backfill
- **Backend:** تمام Repositoryها tenant context بگیرند (از طریق ALS)
- **Prisma Client Extension:** auto-filter بر اساس ALS
- **PostgreSQL RLS:** سیاست‌های RLS به‌عنوان defense-in-depth
- **ریسک:** بالا — اگر یک query جا بماند، Cross-tenant Data Leak رخ می‌دهد
- **وابستگی:** Phase 0

### Phase 2 — Custom Domain Resolution (هفته ۴–۵)
- **هدف:** هر Tenant دامنهٔ اختصاصی داشته باشد
- **Infrastructure:** Traefik (یا Caddy) جایگزین nginx شود
- **Database:** جدول `Domain` فعال
- **Backend:** `TenantResolver` در `proxy.ts` از Host → Domain → Tenant
- **DNS:** راهنمای TXT verification
- **SSL:** Let's Encrypt DNS-01 challenge (از طریق API provider مثل ArvanCloud یا Cloudflare)
- **Frontend:** بدون تغییر عمده
- **ریسک:** متوسط — DNS propagation
- **وابستگی:** Phase 0, Phase 1

### Phase 3 — Subscription & Plans (هفته ۶–۷)
- **هدف:** پلن‌ها قابل تعریف و enforce شدن
- **Database:** جدول `Plan` با JSON features/limits
- **Backend:** `QuotaEnforcer` در تمام مسیرهای write
- **Frontend UI:** Platform Admin برای Plan CRUD
- **Cron Job:** روزانه suspend کردن اشتراک‌های منقضی
- **ریسک:** متوسط — Quota enforcement نباید راه دور زدن داشته باشد
- **وابستگی:** Phase 1

### Phase 4 — Platform Admin UI (هفته ۸)
- **هدف:** Platform Admin بتواند Tenant، Plan، Subscription را از UI مدیریت کند
- **Frontend:** `src/app/admin/platform/*` با Tenant list، Plan editor، Subscription manager
- **Backend:** Platform-scoped APIها
- **Authentication:** `PlatformAdmin` جدا از `TenantAdmin`
- **ریسک:** پایین
- **وابستگی:** Phase 1, Phase 3

### Phase 5 — Tenant Onboarding Flow (هفته ۹)
- **هدف:** Tenant جدید خودش ثبت‌نام کند
- **Frontend:** Wizard ثبت‌نام → انتخاب پلن → ساخت فروشگاه
- **Backend:** `POST /api/public/tenants/signup` با rate-limit شدید
- **Trial Period:** ۱۴ روز رایگان
- **Email:** تأیید ایمیل قبل از فعال‌سازی
- **ریسک:** متوسط — bot/spam
- **وابستگی:** Phase 0, 1, 3

### Phase 6 — Security Hardening (هفته ۱۰)
- **هدف:** تست و رفع آسیب‌پذیری‌های Multi-Tenant
- **Tests:** IDOR suite (User A از Tenant X سعی کند به Resource Y دسترسی پیدا کند)
- **Audit:** بررسی تمام route handlers
- **Penetration Test:** خارجی (اگر بودجه باشد)
- **ریسک:** بالا — اگر تست‌ها کافی نباشد، نشت داده رخ می‌دهد
- **وابستگی:** Phase 1

### Phase 7 — Object Storage & CDN (هفته ۱۱)
- **هدف:** Mediaها در storage مشترک، نه local
- **Infrastructure:** MinIO container یا ArvanCloud S3
- **Backend:** `UploadService` به S3 provider
- **CDN:** Cloudflare یا ArvanCloud
- **ریسک:** پایین
- **وابستگی:** Phase 1

### Phase 8 — Scaling & Monitoring (هفته ۱۲+)
- **هدف:** آمادگی برای ۵۰۰+ Tenant
- **PgBouncer:** اضافه شود
- **Read Replica:** برای گزارش‌ها
- **Multi-instance Next.js:** با shared session store در Redis
- **Monitoring:** Prometheus + Grafana با per-tenant metrics
- **Alerting:** روی quota نزدیک به سقف
- **ریسک:** متوسط
- **وابستگی:** Phase 7

---

## ۱۴) Security Audit — مسائل شناسایی‌شده

اگرچه پروژه فعلی Multi-Tenant نیست، اما برخی الگوها در تبدیل به SaaS می‌توانند مشکل‌ساز شوند:

### Security Finding 1: Hardcoded Domain in nginx
- **Severity:** N/A (Single-Tenant فعلاً)
- **Location:** `nginx/nginx.conf` line 76-77
- **Problem:** `ssl_certificate /etc/letsencrypt/live/saite.ir/...`
- **Impact:** در Multi-Tenant، cert فقط برای یک دامنه کافی نیست
- **Recommendation:** Traefik/Caddy با auto-ACME per-domain

### Security Finding 2: `canAccessOrder` فقط customerId را چک می‌کند
- **Severity:** (فعلی: Low، پس از Multi-Tenant: Critical)
- **Location:** `src/lib/auth/customer-scope.ts:13`
- **Problem:** `return order.customerId === customerId` — هیچ tenantId در context نیست
- **Impact در Multi-Tenant:** User A از Tenant X می‌تواند با دانستن ID سفارش User B از Tenant Y (اگر ID تصادفی یکسان باشد — cuid کم‌احتمال ولی ممکن) یا با brute-force، به داده‌های Tenant دیگر دست یابد
- **Recommendation:** افزودن `tenantId` به check

### Security Finding 3: `prisma` Singleton بدون tenant context
- **Severity:** Medium (پس از Multi-Tenant: Critical)
- **Location:** `src/server/shared/db.ts`
- **Problem:** `prisma.product.findMany({ where })` هیچ tenant filter ندارد
- **Impact:** تمام Repositoryها در ۲۳ مدل باید tenant filter اضافه کنند
- **Recommendation:** Prisma Client Extension با auto-filter از ALS

### Security Finding 4: Cache key بدون tenant
- **Severity:** Medium
- **Location:** `src/server/shared/cache.ts`، `src/server/modules/products/service.ts:13-30`
- **Problem:** `buildCacheKey(query, fields)` — کلید cache فقط شامل query params است، نه tenantId
- **Impact:** اگر Tenant A محصولی را cache کند و Tenant B همان query را بزند، محصول Tenant A به Tenant B نشان داده می‌شود
- **Recommendation:** افزودن tenantId به cache key prefix

### Security Finding 5: Session token فاقد tenantId
- **Severity:** High (پس از Multi-Tenant: Critical)
- **Location:** `src/lib/auth/server/session-token-core.ts`، `session-token.ts`
- **Problem:** Payload فقط `sub`, `iat`, `exp`, `ver`, `role` دارد
- **Impact:** Token یک Tenant با دیگری قابل استفاده نیست (جدا نیست) — یا نشت بین‌Tenantی رخ می‌دهد
- **Recommendation:** افزودن `tenantId` به payload + verify در middleware

### Security Finding 6: API بدون Tenant context guard
- **Severity:** Critical (پس از Multi-Tenant)
- **Location:** تمام `src/app/api/*/route.ts` (~ ۳۰ route)
- **Problem:** هیچ route handler فعلاً tenant context نمی‌گیرد
- **Recommendation:** `withTenantContext()` wrapper در تمام routes

### Security Finding 7: Subscription فقط Mock
- **Severity:** N/A فعلی
- **Location:** `src/components/admin/finance/subscriptions-client.tsx` (localStorage)
- **Problem:** هیچ enforce سمت سرور
- **Impact در Multi-Tenant:** اگر کسی subscription را دور بزند، به منابع رایگان دسترسی پیدا می‌کند
- **Recommendation:** Quota enforcement در Backend

### Security Finding 8: OutboxEvent فاقد tenantId
- **Severity:** Low
- **Location:** `prisma/schema.prisma` `OutboxEvent`
- **Problem:** رویدادهای بین Tenantها ممکن است مخلوط شوند
- **Recommendation:** افزودن `tenantId` + filter در worker

### Security Finding 9: Admin auth hardcoded
- **Severity:** Medium
- **Location:** `src/lib/auth/server/admin-secret.ts`
- **Problem:** فقط یک admin از env
- **Impact:** Platform Admin و Tenant Admin هر دو از یک مکانیزم
- **Recommendation:** جداسازی

### Security Finding 10: Audit log فاقد tenant context
- **Severity:** Low
- **Location:** `src/lib/auth/server/audit-log.ts`
- **Problem:** لاگ‌ها قاطی می‌شوند
- **Recommendation:** افزودن `tenantId` به log

---

## ۱۵) Architecture Comparison

| Component | پروژه فعلی | SaaS ایده‌آل | Gap |
|---|---|---|---|
| Tenant Resolver | ❌ | ✅ Middleware مبتنی بر Host | **کامل** |
| Tenant Context | ❌ | ✅ ALS/Extension | **کامل** |
| Tenant Isolation | ⚠️ فقط customerId | ✅ tenantId + RLS | **بحرانی** |
| Plan Model | ❌ (type فقط) | ✅ DB + features/limits | **کامل** |
| Subscription Engine | ❌ (mock) | ✅ DB + billing webhook | **کامل** |
| Quota Enforcer | ❌ | ✅ Backend-enforced | **کامل** |
| Custom Domain | ❌ (hardcoded) | ✅ Traefik+ACME per-domain | **کامل** |
| Wildcard SSL | ❌ | ✅ Let's Encrypt DNS-01 | **کامل** |
| Platform Admin | ❌ (admin = store admin) | ✅ جدا با super_admin role | **کامل** |
| Tenant Admin | ✅ (RBAC) | ✅ + tenantId | **جزئی** |
| Tenant-Aware Audit | ❌ | ✅ | **کامل** |
| Per-tenant Rate Limit | ❌ | ✅ | **کامل** |
| Per-tenant Cache | ❌ | ✅ key prefix | **کامل** |
| PostgreSQL RLS | ❌ | ✅ | **بحرانی** |
| IDOR Tests | ❌ | ✅ | **کامل** |
| Object Storage | ❌ (local) | ✅ S3 per-tenant | **جزئی** |
| CDN | ❌ | ✅ per-tenant | **جزئی** |
| Auto-scaling | ❌ | ✅ | **جزئی** |
| Multi-region | ❌ | ❌ (اختیاری) | OK |

---

## Repository Coverage

### پوشه‌های بررسی‌شده
- ✅ `prisma/` (schema.prisma + 9 migration + seed)
- ✅ `src/proxy.ts`
- ✅ `src/lib/auth/` (تمام فایل‌ها)
- ✅ `src/lib/security-headers.ts`
- ✅ `src/lib/api.ts`, `src/lib/api-types.ts`, `src/lib/api-client.ts`
- ✅ `src/server/shared/` (14 فایل)
- ✅ `src/server/modules/products/`, `orders/`, `inventory/`, `finance/`, `marketing/`, `shipping/`, `content/`
- ✅ `src/server/auth/` (session-token, customer-session, admin-session)
- ✅ `src/server/payments/`
- ✅ `src/server/ai/`
- ✅ `src/server/jobs/`
- ✅ `src/server/upload/`
- ✅ `src/app/api/` (تمام route handlers)
- ✅ `src/app/admin/(panel)/` (تمام page.tsx)
- ✅ `src/components/admin/` (نمونه)
- ✅ `src/store/`
- ✅ `src/types/`
- ✅ `nginx/nginx.conf`
- ✅ `docker-compose.dev.yml`, `docker-compose.prod.yml`
- ✅ `Dockerfile`
- ✅ `next.config.ts`
- ✅ `.env.example`
- ✅ `docs/` (۲۹ سند)

### فایل‌های مهم بررسی‌شده (۴۹۰ فایل TS/TSX)
- ✅ تمام Repositoryها (۷ ماژول)
- ✅ تمام Serviceها (۷ ماژول)
- ✅ تمام Route Handlers (~ ۴۰ endpoint)
- ✅ تمام Prisma models (۲۳ مدل)

### بخش‌های بررسی‌نشده یا بررسی سطحی
- ⚠️ برخی فایل‌های تست (`tests/`) — فقط برای یافتن tenant/store search شدند، نه بررسی عمیق
- ⚠️ برخی AI features (prompt.ts ها) — برای SaaS مهم نیستند
- ⚠️ برخی components کلاینتی (Zustand stores) — آشکارا global هستند
- ⚠️ `e2e/admin-login.spec.ts` و سایر e2e — فقط بررسی شدند برای multi-tenant scenario (هیچ تستی نیست)

### آیا کل Repository قابل بررسی بود؟
**بله**، کل Repository قابل دسترسی و بررسی شد. فایل‌های `.next/` و `node_modules/` بررسی نشدند (طبیعی است) و چند فایل بزرگ (مثل `package-lock.json`) فقط summary دیده شد.

### آیا فایل مهمی از قلم افتاد؟
احتمالاً نه. تمام مسیرهای بحرانی (auth, db, api, modules) بررسی شدند. تنها فایل‌هایی که بررسی سطحی شدند:
- `prisma/migrations/*.sql` — فقط header و index changes
- `src/server/ai/features/*/prompt.ts` — prompt content
- چند component کلاینتی بزرگ

---

## پاسخ نهایی به سؤال کلیدی

> **«اگر من همین پروژه فعلی را روی یک VPS نصب کنم، آیا می‌توانم با ایجاد یک Multi-Tenant Architecture، تعداد زیادی فروشگاه مستقل با دامنه اختصاصی ایجاد کنم و برای هرکدام یک Plan بفروشم، بدون اینکه برای هر مشتری یک نسخه جداگانه از نرم‌افزار نصب کنم؟»**

# 🔴 NO — Current architecture should be substantially redesigned

### دلایل به ترتیب اهمیت

1. **هیچ Multi-Tenancy وجود ندارد.** صفر مورد از `tenantId`، `storeId`، `organizationId`، `useTenant`، یا host-based resolution در کل Repository یافت نشد. این نه یک کمبود، بلکه یک **نبود کامل** است.

2. **Schema برای Multi-Tenancy طراحی نشده.** ۲۳ مدل Prisma هیچ‌کدام `tenantId` ندارند. unique constraintهای سراسری (`slug`, `sku`, `email`) در Multi-Tenant دچار تداخل می‌شوند. تبدیل این‌ها مستلزم migration بزرگ و backfill است.

3. **هیچ Tenant Context در Backend وجود ندارد.** تمام Repositoryها (۷ ماژول، ~ ۱,۸۰۰ خط کد) مستقیماً به `prisma` می‌زنند بدون فیلتر tenant. هیچ ALS، هیچ Extension، هیچ Guard.

4. **هیچ Custom Domain پشتیبانی نمی‌شود.** nginx فقط یک دامنه با cert hardcoded سرو می‌کند. Traefik/Caddy با ACME per-domain لازم است. wildcard SSL نیاز به DNS-01 challenge دارد.

5. **هیچ Plan/Subscription Engine وجود ندارد.** `Subscription` فقط یک TypeScript type است که در `mock-adapter` (localStorage) استفاده می‌شود. هیچ جدول، هیچ enforce، هیچ quota.

6. **هیچ Platform Admin جدا از Tenant Admin وجود ندارد.** فعلاً فقط یک admin از env. ساختار Platform/Tenant Admin باید از ابتدا طراحی شود.

7. **هیچ Tenant-aware Cache و Rate Limit وجود ندارد.** Cache keyها فقط بر اساس query ساخته می‌شوند، نه tenant. rate limit فقط per-IP و per-username است.

8. **هیچ Tenant-aware Audit Log وجود ندارد.** لاگ‌ها بدون tenantId می‌نویسند.

9. **Frontend hardcoded روی یک Site است.** `NEXT_PUBLIC_SITE_URL`، JSON-LD، sitemap — همه برای یک فروشگاه.

10. **بدون تست Multi-Tenant.** هیچ تستی سناریوی cross-tenant را پوشش نمی‌دهد، چون خود سناریویی نیست.

---

## جمع‌بندی

این پروژه یک فروشگاه تک‌مستاجری **با کیفیت مهندسی بالا** است که برای SaaS شدن به یک **بازطراحی معمارانهٔ بنیادی** نیاز دارد. الگوهای خوب (RBAC، Repository→Service، Outbox، Cache، Audit، CSP) قابل استفاده‌اند، اما **خود Multi-Tenancy باید از صفر ساخته شود**.

توصیهٔ من: قبل از هر اقدام، ابتدا یک **POC (Proof of Concept) ۲ هفته‌ای** برای Multi-Tenancy روی یک شاخهٔ جدا انجام شود:
- یک Tenant اضافه شود
- یک محصول به آن Tenant متصل شود
- یک API ساده با `tenantId` filter ساخته شود
- هاست routing در `proxy.ts` اضافه شود

اگر POC موفق بود، می‌توان به سراغ فازهای ۱ تا ۸ رفت. در غیر این صورت، باید ابتدا زیرساخت Multi-Tenancy در دیتابیس و Backend ایجاد شود.

**تخمین کل کار:** ۱۲ هفته (۳ ماه) برای MVP SaaS با ۵۰ Tenant، با یک تیم ۲-۳ نفرهٔ senior.
