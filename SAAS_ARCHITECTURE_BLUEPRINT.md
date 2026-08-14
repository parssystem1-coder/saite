# 🏗 SAAS_ARCHITECTURE_BLUEPRINT.md

> **پروژه:** `parssystem1-coder/saite` (شاخه `arena/01a00248-saite`)
> **تاریخ:** ۱۴ اوت ۲۰۲۶
> **وضعیت:** طراحی معماری (بدون تغییر کد)
> **مخاطب:** تیم توسعه / AI Coding Agent که مرحله‌به‌مرحله Multi-Tenant را پیاده می‌کند
> **پیش‌نیاز:** مطالعهٔ `SAAS_READINESS_AUDIT.md`

---

## ۱) Executive Summary

این سند، طراحیٔ اجرایی تبدیل پروژهٔ Saite از یک فروشگاه تک‌مستاجری به یک **Multi-Tenant E-commerce SaaS** را ارائه می‌دهد. این طراحی بر اساس کد واقعی Repository، گزارش ممیزی قبلی، و محدودیت‌های تکنولوژی فعلی (Next.js ۱۶، Prisma ۶، PostgreSQL ۱۷، Redis، BullMQ، Docker) است.

### تصمیم کلیدی
**معماری پیشنهادی: Hybrid — Shared Database + `tenant_id` + PostgreSQL Row-Level Security (RLS) + Prisma Client Extensions + AsyncLocalStorage (ALS) + Traefik (با Let's Encrypt DNS-01)**

### دلایل این انتخاب (خلاصه)
- **امنیت:** RLS به‌عنوان defense-in-depth در سطح DB مستقل از کد
- **هزینه:** Shared DB بسیار ارزان‌تر از DB-per-tenant
- **عملیات:** Migration یک‌جا، Backup یک‌جا، Monitoring یک‌جا
- **مقیاس‌پذیری:** تا ۵,۰۰۰+ Tenant بدون بازطراحی
- **سازگاری:** با Prisma، PgBouncer، و معماری Monolith فعلی سازگار است

### محدودهٔ کار
- ۲۳ مدل Prisma → tenant-scoped می‌شوند (نه حذف، با افزودن `tenantId`)
- ۳۰+ Route Handler → با `withTenantContext()` wrap می‌شوند
- زیرساخت: nginx → **Traefik**، افزودن **PgBouncer** و **MinIO**
- ۱۴ Phase پیاده‌سازی، تخمین ۱۲ هفته

---

## ۲) Current Architecture Summary

### استک واقعی پروژه (بر اساس Repository)
| لایه | تکنولوژی فعلی | منبع |
|---|---|---|
| Framework | Next.js 16.3 (App Router) | `package.json` |
| Runtime | Node.js ≥ 22, React 19.2 | `package.json` |
| ORM | Prisma 6.19 + `@prisma/client` | `prisma/schema.prisma` |
| DB | PostgreSQL 17 (extension: pg_trgm, pgvector) | `prisma/schema.prisma`, `docker-compose.prod.yml` |
| Cache & Queue | Redis 7 (`ioredis` + `bullmq` ^6) | `src/server/shared/redis.ts` |
| Auth | HMAC-SHA256 session (custom), TOTP | `src/lib/auth/server/session-token.ts` |
| Reverse Proxy | nginx (alpine) | `nginx/nginx.conf` |
| TLS | Certbot (hardcoded cert for `saite.ir`) | `docker-compose.prod.yml` |
| Process Mgr | Docker Compose | `docker-compose.prod.yml` |
| Storage | Local disk `public/uploads/` | `src/server/upload/providers/local.ts` |
| Mail/SMS | ConsoleProvider (logs only) | `src/server/communications/providers/console.ts` |
| Payment | Zarinpal + IDPay (adapters) + Mock | `src/server/payments/` |
| AI | Anthropic Claude + OpenAI Embeddings | `src/server/ai/gateway.ts` |
| Logging | Pino (JSONL) | `src/server/shared/logger.ts` |

### الگوهای معماری فعلی
- **Repository → Service → Route Handler** (در `src/server/modules/*`)
- **Outbox Pattern** (در `outbox_events` table + `outbox-worker.ts`)
- **Event Bus** (publish/subscribe مبتنی بر DB outbox)
- **RBAC سه‌سطحی** (`admin` / `operator` / `viewer`) در `src/lib/auth/rbac.ts`
- **CSP دو لایه** (public بدون nonce، admin با nonce+strict-dynamic)
- **Rate Limit** per-IP و per-username (file/Redis store)

### محدودیت‌های بحرانی فعلی
- ❌ هیچ `tenantId` / `storeId` / `organizationId` در ۲۳ مدل (جستجوی تمام‌متنی: ۰ نتیجه)
- ❌ `nginx/nginx.conf:76-77` — cert hardcoded روی `/etc/letsencrypt/live/saite.ir/`
- ❌ `src/server/shared/db.ts` — Prisma singleton بدون context
- ❌ `src/lib/auth/customer-scope.ts:13` — `canAccessOrder` فقط customerId
- ❌ `Subscription` فقط TypeScript type، نه جدول DB
- ❌ `src/components/admin/finance/subscriptions-client.tsx` — localStorage mock
- ❌ Cache key فاقد tenantId (در `src/server/modules/products/service.ts:13-30`)

### نقاط قوت قابل استفاده
- ✅ Repository→Service الگوی تمیز (تزریق context آسان)
- ✅ Outbox Pattern (eventهای بین‌Tenantی)
- ✅ RBAC سه‌سطحی (Tenant Admin نقش‌ها)
- ✅ Session Token + TOTP (الگوی تمیز)
- ✅ Audit Log (الگوی مناسب)
- ✅ CSP + Security Headers (مستقیم قابل استفاده)
- ✅ Pino logger (ساختاریافته)
- ✅ Docker multi-stage + standalone build

---

## ۳) Target SaaS Architecture

### دیاگرام کلی
```
                          Internet
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Cloudflare CDN    │ (اختیاری، فاز ۲+)
                    └──────────┬──────────┘
                              │ DNS
                              ▼
              ┌──────────────────────────────┐
              │   Traefik (Reverse Proxy)    │
              │  - TLS termination           │
              │  - Auto ACME (DNS-01)        │
              │  - Host → Backend routing    │
              │  - Rate limit (L4)           │
              └──────────┬───────────────────┘
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
   app:3000         app:3000          platform:3000
   (Tenant store)   (Tenant store)    (Super-admin)
   (Multi-instance behind LB)
       │                 │
       └────────┬────────┘
                ▼
       ┌────────────────────────┐
       │   Next.js Application  │
       │  ┌──────────────────┐  │
       │  │ src/proxy.ts     │  │ ← Tenant Resolver (Host → tenantId)
       │  │ + ALS Context    │  │    via Domain table lookup
       │  └──────────────────┘  │
       │  ┌──────────────────┐  │
       │  │ Route Handlers   │  │ ← withTenantContext() wrapper
       │  │ + Prisma Ext     │  │    auto-filter by tenantId
       │  └──────────────────┘  │
       └────────┬───────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
   PgBouncer:6432   redis:6379
       │                 │
       ▼                 │
   PostgreSQL 17          │
   (with RLS)             │
                          ▼
                    MinIO:9000
                    (S3-compatible)
                          │
                          ▼
                    tenant/
                    ├── t_abc123/
                    └── t_xyz789/
```

### اصول بنیادین
1. **Tenant Context در سرور (نه در client):** Tenant ID فقط روی سرور از Host header + DB lookup استخراج می‌شود. Client هرگز tenantId را به‌صورت صریح ارسال نمی‌کند.
2. **Defense in Depth:** سه لایهٔ مستقل: (الف) Application-level filter، (ب) Prisma Client Extension، (ج) PostgreSQL RLS.
3. **Stateless Application:** تمام state در DB/Redis. هر instance Next.js می‌تواند هر request را handle کند.
4. **AsyncLocalStorage برای context:** در هر request، یک `tenantId` در ALS ذخیره می‌شود که در همهٔ لایه‌ها (service, repository, prisma extension) در دسترس است.
5. **Plan-aware Quota:** تمام عملیات write ابتدا از `QuotaEnforcer` عبور می‌کنند.

---

## ۴) Multi-Tenancy Model Comparison

### Model A: Shared Database + Shared Schema + `tenant_id`
| محور | ارزیابی |
|---|---|
| **Security** | ⚠️ متوسط. به application-level filtering وابسته است. اگر یک query جا بماند، نشت داده رخ می‌دهد. |
| **Isolation** | ⚠️ Logical (Row-level) |
| **Cost** | ✅ پایین (یک DB) |
| **Complexity** | ✅ ساده برای شروع |
| **Migration** | ✅ ساده (یک DB) |
| **Backup** | ✅ ساده (یک DB) |
| **Restore** | ✅ ساده |
| **Scalability** | ✅ تا ۵,۰۰۰+ Tenant (با partitioning) |
| **Performance** | ✅ خوب (Index مناسب) |
| **Maintenance** | ✅ آسان |
| **VPS requirements** | ✅ پایین |
| **Tenant capacity** | ۱,۰۰۰–۱۰,۰۰۰ |
| **Prisma complexity** | ✅ پایین (با Extension ساده) |
| **Deployment** | ✅ ساده |
| **ریسک کلیدی** | نشت داده با یک اشتباه کدنویسی |

### Model B: Shared Database + Schema Per Tenant
| محور | ارزیابی |
|---|---|
| **Security** | ✅ خوب. Schema-level isolation در PostgreSQL |
| **Isolation** | ✅ قوی |
| **Cost** | ✅ پایین (همان DB instance) |
| **Complexity** | ⚠️ متوسط. هر tenant یک schema → Prisma باید dynamic باشد |
| **Migration** | ❌ پیچیده. باید روی N schema اجرا شود |
| **Backup** | ⚠️ متوسط. می‌توان per-schema |
| **Restore** | ✅ آسان‌تر از DB-per-tenant |
| **Scalability** | ⚠️ محدود. PostgreSQL shared buffer برای همه |
| **Performance** | ⚠️ متوسط |
| **Maintenance** | ❌ سخت |
| **Tenant capacity** | ۱۰۰–۵۰۰ |
| **Prisma complexity** | ❌ بالا. Prisma client باید per-schema ساخته شود |
| **Deployment** | ⚠️ پیچیده |
| **ریسک کلیدی** | Prisma ecosystem برای multi-schema آماده نیست |

### Model C: Database Per Tenant
| محور | ارزیابی |
|---|---|
| **Security** | ✅ عالی. هر tenant یک DB instance |
| **Isolation** | ✅ کامل |
| **Cost** | ❌ بالا (N DB) |
| **Complexity** | ❌ بالا. Connection management، Migration automation |
| **Migration** | ❌ بسیار پیچیده. باید N migration اجرا شود |
| **Backup** | ✅ عالی. per-tenant backup |
| **Restore** | ✅ عالی |
| **Scalability** | ⚠️ خوب. هر tenant مستقل scale می‌شود |
| **Performance** | ✅ عالی |
| **Maintenance** | ❌ بسیار سخت |
| **VPS requirements** | ❌ بالا |
| **Tenant capacity** | ۱۰–۱۰۰ (با همین معماری) |
| **Prisma complexity** | ❌ بسیار بالا. multi-connection management |
| **Deployment** | ❌ پیچیده |
| **ریسک کلیدی** | هزینهٔ عملیاتی بسیار بالا |

### Model D: Hybrid (Shared DB + Enterprise Dedicated)
| محور | ارزیابی |
|---|---|
| **امنیت** | ✅ بهترین (هر tier ایزولاسیون مناسب خودش) |
| **هزینه** | ⚠️ متوسط (Enterprise tier گران‌تر) |
| **پیچیدگی** | ❌ بالا. دو مسیر کد |
| **Tenant capacity** | ✅ نامحدود |
| **Prisma complexity** | ❌ بالا. باید dual-connection |

### تحلیل نهایی

| Model | مناسب برای فاز اول؟ | دلیل |
|---|---|---|
| **A (Shared + tenantId + RLS)** | ✅ **بله** | ساده، کم‌هزینه، سریع، RLS defense-in-depth می‌دهد |
| B (Schema per Tenant) | ❌ نه | Prisma ecosystem آماده نیست |
| C (DB per Tenant) | ❌ نه | هزینه و پیچیدگی بسیار بالا |
| D (Hybrid) | 🔵 **فاز ۴+** | وقتی تعداد Enterprise customer زیاد شود |

---

## ۵) Recommended Architecture

### 🟢 انتخاب: Model A (Shared DB + `tenant_id`) + **PostgreSQL Row-Level Security (RLS)** به‌عنوان Defense in Depth

### دلایل فنی (با استناد به کد واقعی)

1. **سازگاری با Prisma:**
   - `prisma/schema.prisma` ۲۳ مدل دارد. افزودن `tenantId String` به همه + ایجاد relation به `Tenant` با Prisma Client Extension برای auto-filter، ساده‌ترین تغییر است.
   - Schema-per-Tenant نیاز به ساخت Prisma Client runtime دارد که خارج از قابلیت‌های Prisma 6 است.

2. **سازگاری با PgBouncer:**
   - Shared DB با transaction-level pool سازگار است.
   - Schema-per-Tenant و DB-per-Tenant نیاز به per-tenant connection دارند.

3. **سازگاری با RLS:**
   - PostgreSQL RLS روی یک DB کار می‌کند. در Schema-per-tenant، RLS باید per-schema تعریف شود (پیچیده).

4. **هزینهٔ عملیاتی:**
   - یک DB instance، یک Migration، یک Backup job.

5. **Migration آسان:**
   - ۲۳ مدل فعلی فقط `tenantId` می‌گیرند + ۵ مدل جدید (`Tenant`, `Plan`, `Subscription`, `Domain`, `TenantUser`).
   - Backfill از یک tenant پیش‌فرض ساده است.

6. **Performance:**
   - با Index ترکیبی `(tenantId, ...)`، Query Plan عالی می‌شود.
   - در ۵,۰۰۰+ Tenant، `PARTITION BY HASH (tenant_id)` می‌توان اضافه کرد.

7. **Prisma + RLS Compatibility:**
   - Prisma 5+ از RLS-aware queries پشتیبانی می‌کند (از طریق `set_config('app.tenant_id', ...)` در transaction).

### چرا نه B (Schema per Tenant)؟
- `prisma/schema.prisma` نمی‌تواند runtime dynamic schema داشته باشد بدون ابزار سفارشی.
- Migration در N schema = N×زمان Migration.
- Prisma Client per schema = memory overhead.

### چرا نه C (DB per Tenant)?
- هزینهٔ Connection و RAM برای ۱۰۰+ tenant غیرقابل‌قبول.
- Backup per-tenant = پیچیدگی عملیاتی بالا.

### معماری RLS چگونه کار می‌کند
```sql
-- 1. جدول Tenant
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  ...
);

-- 2. فعال‌سازی RLS روی جدول tenant-scoped
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- 3. Policy: فقط ردیف‌های tenant جاری
CREATE POLICY tenant_isolation_policy ON products
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- 4. Policy: Platform admin bypass
CREATE POLICY platform_admin_bypass ON products
  USING (current_setting('app.bypass_tenant_isolation', true) = 'on');

-- 5. در هر request:
BEGIN;
  SET LOCAL app.current_tenant_id = 't_abc123';
  -- Prisma query اجرا می‌شود
  -- RLS به‌صورت خودکار فقط ردیف‌های t_abc123 را برمی‌گرداند
COMMIT;
```

> **نکتهٔ بحرانی:** `SET LOCAL` فقط در transaction جاری اعمال می‌شود و با `COMMIT`/`ROLLBACK` پاک می‌شود. این تضمین می‌کند که اگر connection به request دیگر reuse شود، tenant context نشت نمی‌کند.

---

## ۶) Tenant Domain Model

### ۶.۱ طراحی `Tenant`
```prisma
model Tenant {
  id                  String        @id @default(cuid())
  slug                String        @unique  // برای {slug}.platform.com
  displayName         String
  legalName           String?
  status              TenantStatus  @default(trial)
  ownerEmail          String        // ایمیل مالک اولیه
  ownerPhone          String?
  timezone            String        @default("Asia/Tehran")
  locale              String        @default("fa-IR")
  currency            String        @default("IRR")
  brandColor          String?
  logoUrl             String?
  faviconUrl          String?
  metadata            Json?         // free-form data
  trialEndsAt         DateTime?
  suspendedAt         DateTime?
  suspendedReason     String?
  deletedAt           DateTime?     // soft delete
  dataRegion          String        @default("ir")  // برای GDPR-like
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  // Relations
  domains             Domain[]
  subscriptions       Subscription[]
  tenantUsers         TenantUser[]
  products            Product[]
  orders              Order[]
  customers           Customer[]
  // ... و ۲۰ relation دیگر

  @@index([status])
  @@index([deletedAt])
  @@map("tenants")
}

enum TenantStatus {
  trial        // ۱۴ روز اول
  active       // فعال
  past_due     // پرداخت ناموفق
  suspended    // معلق (ادمین suspend کرده یا billing)
  cancelled    // لغو شده توسط owner
  archived     // آرشیو شده (soft deleted)
}
```

### ۶.۲ طراحی `TenantUser` (Many-to-Many با Role)
```prisma
model TenantUser {
  id        String       @id @default(cuid())
  tenantId  String
  userId    String       // FK به User (کاربر سراسری)
  role      TenantRole   @default(member)
  status    TenantUserStatus @default(active)
  invitedAt DateTime     @default(now())
  joinedAt  DateTime?
  invitedBy String?      // userId دعوت‌کننده

  tenant    Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@index([userId])
  @@index([tenantId, status])
  @@map("tenant_users")
}

enum TenantRole {
  owner         // مالک (فقط یکی در هر tenant، قابل انتقال)
  admin         // ادمین کل فروشگاه
  manager       // مدیر محصول/سفارش
  support       // پشتیبانی (فقط orders + customers)
  finance       // مالی (invoices + reports)
  content       // محتوا (products + content)
  member        // عمومی (فقط read)
}

enum TenantUserStatus {
  invited       // دعوت‌نامه ارسال شده
  active        // فعال
  suspended     // تعلیق
  removed       // حذف
}
```

### ۶.۳ طراحی `User` (سراسری، نه tenant-scoped)
```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique  // سراسری، نه tenant-scoped
  phone         String?
  name          String?
  passwordHash  String?
  emailVerified DateTime?
  twoFactorEnabled Boolean    @default(false)
  twoFactorSecret String?     // TOTP
  status        UserStatus    @default(active)
  lastLoginAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  tenantMemberships  TenantUser[]
  sessions            UserSession[]
  apiKeys             ApiKey[]

  @@map("users")
}

enum UserStatus {
  active
  suspended
  deleted
}
```

### ۶.۴ طراحی `PlatformAdmin` (جدا از User)
```prisma
model PlatformAdmin {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String
  passwordHash  String
  role          PlatformRole  @default(super_admin)
  twoFactorEnabled Boolean    @default(false)
  twoFactorSecret String?
  status        PlatformAdminStatus @default(active)
  lastLoginAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  sessions      PlatformSession[]
  actions       PlatformAuditLog[]

  @@map("platform_admins")
}

enum PlatformRole {
  super_admin    // همه‌چیز
  support        // فقط read + impersonation
  finance        // فقط billing + plans
  engineer       // فقط technical metrics
}

enum PlatformAdminStatus {
  active
  suspended
  deleted
}
```

### ۶.۵ طراحی `PlatformAuditLog` (برای هر اقدام Platform Admin)
```prisma
model PlatformAuditLog {
  id          String   @id @default(cuid())
  adminId     String
  action      String   // 'tenant.suspend', 'plan.create', 'impersonate.start', ...
  targetType  String?  // 'tenant' | 'plan' | 'subscription' | 'domain'
  targetId    String?
  payload     Json?    // مقادیر تغییر یافته
  ipAddress   String?
  userAgent   String?
  result      String   // 'success' | 'denied' | 'error'
  createdAt   DateTime @default(now())

  admin       PlatformAdmin @relation(fields: [adminId], references: [id])

  @@index([adminId, createdAt])
  @@index([targetType, targetId, createdAt])
  @@index([action, createdAt])
  @@map("platform_audit_logs")
}
```

### ۶.۶ تصمیم: `User → tenantId` یا `User → TenantMembership → Tenant`؟

| الگو | مزایا | معایب |
|---|---|---|
| `User.tenantId` | ساده | یک کاربر فقط یک Tenant. آینده‌نگری ضعیف |
| **`TenantMembership` (N:N)** | ✅ یک کاربر در N Tenant. مناسب برای آینده. Role per-tenant | پیچیده‌تر |

**انتخاب: `TenantMembership`** — چون هدف نهایی SaaS است و یک نفر (مثلاً یک فریلنسر) ممکن است چند فروشگاه داشته باشد.

### ۶.۷ Backward Compatibility
- فاز ۱ Migration: تمام کاربران فعلی به یک tenant پیش‌فرض (`default-tenant`) منتقل می‌شوند.
- `AdminSessionPayload` فعلی (`src/lib/auth/server/session-token.ts:55`) با افزودن `tenantId?: string` و `tenantRole?: TenantRole` به‌صورت اختیاری backward compatible می‌ماند.

---

## ۷) Platform Admin Architecture

### ۷.۱ جداسازی از Tenant Admin

| جنبه | Platform Admin | Tenant Admin |
|---|---|---|
| **مدل DB** | `PlatformAdmin` (جدا) | `TenantUser` (N:N) |
| **Session** | `PlatformSession` (HMAC با claim `kind: 'platform'`) | `UserSession` با `tenantId` و `tenantRole` |
| **Cookie name** | `saite_platform_session` | `saite_user_session` |
| **Cookie path** | `/admin/platform` | `/` |
| **Login route** | `admin.platform.com/login` | `{tenant}.platform.com/login` یا `{custom-domain}/login` |
| **API base** | `/api/platform/*` | `/api/*` (همه tenant-aware) |
| **Layout** | `src/app/admin/platform/layout.tsx` | `src/app/admin/(panel)/layout.tsx` (موجود) |
| **Nav structure** | Tenants, Plans, Subscriptions, Domains, System | Products, Orders, Customers, ... |

### ۷.۲ Platform Admin Modules
```
/admin/platform/
├── layout.tsx                  ← گارد Platform Admin
├── login/page.tsx
├── dashboard/page.tsx          ← آمار کلی Platform
├── tenants/
│   ├── page.tsx                ← لیست Tenantها
│   ├── new/page.tsx
│   ├── [id]/page.tsx
│   ├── [id]/edit/page.tsx
│   ├── [id]/suspend/page.tsx
│   └── [id]/impersonate/page.tsx
├── plans/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/edit/page.tsx
├── subscriptions/
│   ├── page.tsx
│   └── [id]/page.tsx
├── domains/
│   ├── page.tsx
│   └── [id]/verify/page.tsx
├── users/page.tsx              ← Platform Adminها
├── audit-logs/page.tsx
├── system/
│   ├── health/page.tsx
│   ├── metrics/page.tsx
│   └── feature-flags/page.tsx
└── settings/page.tsx
```

### ۷.۳ Cross-Tenant Access توسط Platform Admin

**قانون:** Platform Admin **هرگز** نباید context tenant جاری را با Tenant دیگر مخلوط کند. هر اقدام cross-tenant باید:

1. **Explicit:** ادمین باید صریحاً tenantId را وارد کند (مثلاً در URL `/api/platform/tenants/{id}/...`)
2. **Controlled:** از طریق `requirePlatformAdmin()` guard (نه `requireTenant()`)
3. **Audited:** هر اقدام در `PlatformAuditLog` ثبت می‌شود با `targetType='tenant'` و `targetId=tenantId`
4. **Bypass RLS:** با `SET LOCAL app.bypass_tenant_isolation = 'on'` در transaction

```typescript
// src/server/platform/impersonation.ts
export async function impersonateTenant(adminId: string, tenantId: string): Promise<ImpersonationToken> {
  // 1. بررسی مجوز
  await requirePlatformPermission('tenant.impersonate');

  // 2. ثبت audit
  await platformAuditLog.create({
    adminId,
    action: 'impersonate.start',
    targetType: 'tenant',
    targetId: tenantId,
  });

  // 3. ساخت توکن کوتاه‌مدت (۱۵ دقیقه)
  return createImpersonationToken(adminId, tenantId);
}
```

### ۷.۴ Platform Admin Authentication
- استفاده از همان الگوی HMAC فعلی در `src/lib/auth/server/session-token.ts`
- ولی در یک فایل جدا: `src/lib/auth/server/platform-session.ts`
- `secret` جدا: `PLATFORM_SESSION_SECRET` (تا ۳۲ کاراکتر، در production الزامی)
- TOTP اختیاری ولی برای super_admin اجباری

### ۷.۵ Platform Guard Pattern
```typescript
// src/lib/auth/server/require-platform.ts
export async function requirePlatformPermission(
  permission: PlatformPermission
): Promise<{ ok: true; admin: PlatformAdmin } | { ok: false; response: NextResponse }> {
  const session = await getPlatformSession();
  if (!session) return { ok: false, response: unauthorized('no-session') };
  if (!hasPlatformPermission(session.role, permission)) {
    return { ok: false, response: unauthorized('forbidden') };
  }
  return { ok: true, admin: session };
}
```

---

## ۸) Tenant Admin Architecture

### ۸.۱ Tenant Admin (TenantUser) Structure

هر Tenant می‌تواند چند `TenantUser` داشته باشد با نقش‌های:

| Role | دسترسی | توضیح |
|---|---|---|
| **owner** | همه‌چیز + Billing + حذف Tenant | فقط یک نفر. قابل انتقال |
| **admin** | همه‌چیز به‌جز Billing | مدیر کل فروشگاه |
| **manager** | catalog:write + orders:write + customers:write | مدیر عملیات |
| **finance** | orders:read + finance:read + finance:write + reports:read | حسابدار |
| **content** | catalog:read + catalog:write + content:write | مدیر محتوا |
| **support** | orders:read + customers:read + comms:write | پشتیبانی |
| **member** | فقط read | مشاهده‌گر |

### ۸.۲ Multi-Role per User
اگر User در چند Tenant باشد:
- Login → انتخاب Tenant
- یا redirect به آخرین Tenant فعال
- یا context switcher در header

### ۸.۳ Tenant Admin Authentication Flow
```
1. User ثبت‌نام می‌کند → User (سراسری) ساخته می‌شود
2. Platform Admin او را به یک Tenant دعوت می‌کند → TenantUser (status=invited)
3. User invite link را باز می‌کند → TenantUser.status = active
4. User لاگین می‌کند:
   - اگر فقط یک Tenant → مستقیم وارد
   - اگر چند Tenant → Tenant Selection Page
5. Session ایجاد می‌شود با tenantId + tenantRole
```

### ۸.۴ Existing RBAC Compatibility
الگوی فعلی در `src/lib/auth/rbac.ts`:
- ۳ نقش: `viewer`, `operator`, `admin`
- ۱۰ resource: catalog, orders, customers, finance, reports, marketing, comms, content, settings, users
- actions: read, write, manage

**این ساختار حفظ می‌شود** ولی به‌جای استفاده مستقیم، به `TenantRole` map می‌شود:

```typescript
const TenantRolePermissions: Record<TenantRole, Permission[]> = {
  owner: [...ADMIN_PERMISSIONS, 'billing:write', 'tenant:delete', 'users:invite'],
  admin: ADMIN_PERMISSIONS,
  manager: [...OPERATOR_PERMISSIONS],
  finance: [...VIEWER_PERMISSIONS, 'finance:write', 'reports:read'],
  content: [...VIEWER_PERMISSIONS, 'catalog:write', 'content:write'],
  support: [...VIEWER_PERMISSIONS, 'orders:read', 'customers:read', 'comms:write'],
  member: VIEWER_PERMISSIONS,
};
```

---

## ۹) Tenant Resolution

### ۹.۱ مسیرهای Resolution

```
Request → Traefik → proxy.ts → TenantResolver → TenantContext (ALS) → Service/Repository
```

### ۹.۲ استخراج Tenant از Host Header

```typescript
// src/server/tenants/tenant-resolver.ts

interface TenantResolution {
  tenantId: string;
  tenantSlug: string;
  source: 'subdomain' | 'custom_domain' | 'platform_admin';
  domainId?: string;
}

export async function resolveTenantFromHost(host: string): Promise<TenantResolution | null> {
  // 1. حذف port
  const hostname = host.split(':')[0].toLowerCase();

  // 2. Platform host patterns → null (no tenant)
  if (isPlatformHost(hostname)) return null;  // admin.platform.com, api.platform.com

  // 3. Wildcard subdomain: {slug}.platform.com
  const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.platform\.com$/);
  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    return await findTenantBySlug(slug, 'subdomain');
  }

  // 4. Custom domain: customer-a.ir, www.customer-a.ir
  return await findTenantByDomain(hostname, 'custom_domain');
}

async function findTenantBySlug(slug: string, source: string): Promise<TenantResolution | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, slug: true, status: true, deletedAt: true },
  });
  if (!tenant || tenant.deletedAt) return null;
  if (!['active', 'trial', 'past_due'].includes(tenant.status)) return null;
  return { tenantId: tenant.id, tenantSlug: tenant.slug, source };
}

async function findTenantByDomain(hostname: string, source: string): Promise<TenantResolution | null> {
  const domain = await prisma.domain.findUnique({
    where: { hostname },
    select: {
      id: true,
      verified: true,
      sslStatus: true,
      tenant: { select: { id: true, slug: true, status: true, deletedAt: true } },
    },
  });
  if (!domain || !domain.verified) return null;
  if (domain.tenant.deletedAt) return null;
  if (!['active', 'trial', 'past_due'].includes(domain.tenant.status)) return null;
  return {
    tenantId: domain.tenant.id,
    tenantSlug: domain.tenant.slug,
    source,
    domainId: domain.id,
  };
}
```

### ۹.۳ جایگاه در `proxy.ts`

```typescript
// src/proxy.ts (افزوده)
import { resolveTenantFromHost } from '@/server/tenants/tenant-resolver';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const isPlatform = isPlatformHost(host);

  // 1. مسیرهای Platform Admin (بدون tenant context)
  if (isPlatform || pathname.startsWith('/admin/platform') || pathname.startsWith('/api/platform')) {
    return handlePlatformPath(request, pathname, search);
  }

  // 2. Tenant context از host
  const resolution = await resolveTenantFromHost(host);
  if (!resolution) {
    return new NextResponse('Unknown tenant', { status: 404 });
  }

  // 3. Status check
  if (resolution.source === 'custom_domain' && !resolution.domainId) {
    // domain not verified
  }

  // 4. attach tenantId به request (برای Server Component)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', resolution.tenantId);
  requestHeaders.set('x-tenant-slug', resolution.tenantSlug);

  // 5. ادامهٔ proxy با context
  return NextResponse.next({ request: { headers: requestHeaders } });
}
```

### ۹.۴ خواندن Tenant Context در Server Component / Route Handler

```typescript
// src/server/tenants/tenant-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContextValue {
  tenantId: string;
  tenantSlug: string;
  source: 'subdomain' | 'custom_domain' | 'platform_admin' | 'background_job';
  domainId?: string;
  userId?: string;
  userRole?: TenantRole;
  isImpersonating?: boolean;
}

const als = new AsyncLocalStorage<TenantContextValue>();

export const tenantContext = {
  run<T>(ctx: TenantContextValue, fn: () => Promise<T>): Promise<T> {
    return als.run(ctx, fn);
  },
  get(): TenantContextValue | undefined {
    return als.getStore();
  },
  require(): TenantContextValue {
    const ctx = als.getStore();
    if (!ctx) throw new Error('Tenant context not available. Use withTenantContext() wrapper.');
    return ctx;
  },
};
```

### ۹.۵ Wrapper برای Route Handler

```typescript
// src/server/tenants/with-tenant-context.ts
import { NextRequest, NextResponse } from 'next/server';
import { tenantContext, TenantContextValue } from './tenant-context';

export function withTenantContext<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (req: NextRequest, ctx: any) => {
    const tenantId = req.headers.get('x-tenant-id');
    const tenantSlug = req.headers.get('x-tenant-slug');
    if (!tenantId || !tenantSlug) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }
    const value: TenantContextValue = {
      tenantId,
      tenantSlug,
      source: 'subdomain', // یا 'custom_domain' از proxy
    };
    return tenantContext.run(value, () => handler(req, ctx));
  }) as T;
}
```

استفاده:
```typescript
// src/app/api/products/route.ts
export const GET = withTenantContext(async (req) => {
  // tenantContext.get() در اینجا available است
  const products = await productsService.list(...);
  return NextResponse.json(products);
});
```

---

## ۱۰) Custom Domain Architecture

### ۱۰.۱ طراحی `Domain`
```prisma
model Domain {
  id                String      @id @default(cuid())
  tenantId          String
  hostname          String      @unique  // customer-a.ir, www.customer-a.ir
  isPrimary         Boolean     @default(false)
  isWildcard        Boolean     @default(false)  // *.customer-a.ir
  verified          Boolean     @default(false)
  verifiedAt        DateTime?
  verificationToken String      // random 32-char string
  sslStatus         SslStatus   @default(pending)
  sslIssuedAt       DateTime?
  sslExpiresAt      DateTime?
  sslProvider       String?     // 'letsencrypt'
  sslLastError      String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  tenant            Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([verified, sslStatus])
  @@map("domains")
}

enum SslStatus {
  pending       // منتظر تأیید
  provisioning  // ACME در حال صدور
  active        // فعال
  failed        // خطا
  expired       // منقضی
  renewing      // در حال تمدید
}
```

### ۱۰.۲ Verification Flow
```
Platform Admin یا Tenant Owner:
  POST /api/platform/tenants/{tenantId}/domains
  Body: { hostname: "customer-a.ir" }

Server:
  1. تولید verificationToken (random 32 chars)
  2. ایجاد Domain (verified=false)
  3. بازگشت دستورالعمل DNS:
     - TXT record: _saite-verify.customer-a.ir → "saite-verify=<token>"
     - A record: @ → <VPS_IP>
     - یا CNAME: @ → edge.platform.com
  4. (اگر wildcard): CNAME: *.customer-a.ir → edge.platform.com

Customer:
  DNS records را تنظیم می‌کند.

Customer:
  POST /api/platform/tenants/{tenantId}/domains/{domainId}/verify

Server:
  1. Query DNS TXT record
  2. اگر مطابقت داشت: Domain.verified = true
  3. درخواست ACME cert به Let's Encrypt (DNS-01)
  4. صبر برای active شدن SSL
  5. Traefik reload برای اعمال cert جدید
```

### ۱۰.۳ nginx → Traefik (تصمیم قطعی)

**دلیل فنی:** `nginx/nginx.conf:76-77` cert را hardcoded به `/etc/letsencrypt/live/saite.ir/` داده. Traefik:
- ACME خودکار با Let's Encrypt (DNS-01 challenge برای wildcard)
- Reload بدون downtime
- Per-domain routing
- با Docker Compose label کار می‌کند

```yaml
# docker-compose.prod.yml (اضافه شده)
traefik:
  image: traefik:v3.0
  command:
    - --providers.docker=true
    - --entrypoints.websecure.address=:443
    - --entrypoints.web.address=:80
    - --certificatesresolvers.letsencrypt.acme.dnschallenge=true
    - --certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare
    - [email protected]
    - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - traefik_letsencrypt:/letsencrypt
  ports:
    - "80:80"
    - "443:443"
```

```yaml
# app service labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.app.rule=HostRegexp(`{host:.+}`)"
  - "traefik.http.routers.app.tls=true"
  - "traefik.http.routers.app.tls.certresolver=letsencrypt"
  - "traefik.http.routers.app.tls.domains[0].main=*.platform.com"
  - "traefik.http.routers.app.tls.domains[0].sans=platform.com"
```

### ۱۰.4 Wildcard Domain

**دو سطح wildcard:**
1. **Platform-level:** `*.platform.com` → wildcard cert یک‌بار صادر می‌شود (subdomain همه tenantها)
2. **Tenant-level:** `customer-a.ir` → cert جدا برای هر tenant (DNS-01 challenge)

**محدودیت مهم:** Let's Encrypt wildcard فقط با DNS-01 challenge. نیاز به DNS provider API (Cloudflare, ArvanCloud, ...).

### ۱۰.5 Domain Uniqueness
- `Domain.hostname` @unique در سطح سراسری DB
- اگر Tenant A بخواهد `customer-a.ir` را ثبت کند که قبلاً Tenant B دارد → conflict
- قبل از ثبت، `findFirst({ where: { hostname } })` چک می‌شود

### ۱۰.6 جلوگیری از Domain Hijacking
- Verification token تصادفی ۳۲ کاراکتری
- TTL روی TXT record پایین (۳۰۰s) برای re-verification دوره‌ای
- Re-verify هر ۳۰ روز (cron job)
- اگر TXT record حذف شود → Domain.verified = false

### ۱۰.7 فرآیند Onboarding
```
Create Tenant
  ↓
Assign Domain (auto: {slug}.platform.com)
  ↓
Verify (auto: wildcard cert از قبل صادر شده)
  ↓
Tenant Online (روی {slug}.platform.com)
  ↓
(اختیاری) Customer Custom Domain
  ↓
POST /api/platform/tenants/{id}/domains { hostname: "customer-a.ir" }
  ↓
Customer اضافه می‌کند:
  TXT: _saite-verify.customer-a.ir → "saite-verify=xyz"
  A: @ → VPS_IP
  ↓
POST /api/platform/tenants/{id}/domains/{domainId}/verify
  ↓
ACME DNS-01 → cert → Traefik reload
  ↓
customer-a.ir Online
```

---

## ۱۱) Database Architecture

### ۱۱.۱ طبقه‌بندی مدل‌ها

#### Global Models (سراسری، tenant_id ندارند)
| Model | دلیل |
|---|---|
| `Tenant` | خودش tenant container است |
| `User` | کاربر سراسری است، در N Tenant می‌تواند باشد |
| `TenantUser` | رابط N:N بین User و Tenant |
| `PlatformAdmin` | ادمین پلتفرم، خارج از tenant space |
| `Plan` | تعریف پلن، برای همهٔ Tenantها یکسان |
| `FeatureFlag` (global) | flags سراسری پلتفرم |

#### Tenant-Scoped Models (نیاز به `tenantId`)
تمام ۲۳ مدل فعلی به‌جز `OutboxEvent` (که در سطح worker global است ولی tenantId دارد):

| Model فعلی | Tenant Scoped؟ | tenantId لازم؟ | تغییرات Relation | تغییرات Index | RLS Required |
|---|---|---|---|---|---|
| `Product` | ✅ | ✅ | FK به `Tenant` | `(tenantId,slug)`, `(tenantId,sku)`, `(tenantId,category,createdAt)` | ✅ |
| `Order` | ✅ | ✅ | FK به `Tenant` + Customer | `(tenantId,createdAt)`, `(tenantId,customerId,createdAt)`, `(tenantId,status,createdAt)` | ✅ |
| `OrderItem` | ✅ (transitive) | ❌ مستقیم | از Order به‌صورت join filter | index از Order | ✅ |
| `Customer` | ✅ | ✅ | FK به `Tenant` | `(tenantId,email)` unique (نه global unique) | ✅ |
| `PaymentIntent` | ✅ | ✅ | FK به `Tenant` | `(tenantId,orderId)`, `(tenantId,status,expiresAt)` | ✅ |
| `Invoice` | ✅ | ✅ | FK به `Tenant` | `(tenantId,orderId)`, `(tenantId,customerId,createdAt)`, `(tenantId,invoiceNumber)` unique | ✅ |
| `Transaction` | ✅ | ✅ (از Invoice) | از Invoice filter | `(tenantId,orderId,createdAt)`, `(tenantId,status,createdAt)` | ✅ |
| `Shipment` | ✅ | ✅ | FK به `Tenant` | `(tenantId,carrier,status)`, `(tenantId,orderId)` | ✅ |
| `ShippingRate` | ✅ | ✅ | FK به `Tenant` یا global default | `(tenantId,carrier,zone,minWeight)` | ⚠️ اختیاری |
| `Coupon` | ✅ | ✅ | FK به `Tenant` | `(tenantId,code)` unique, `(tenantId,active,expiresAt)` | ✅ |
| `CouponRedemption` | ✅ | ✅ (transitive) | از Coupon | index از Coupon | ✅ |
| `Campaign` | ✅ | ✅ | FK به `Tenant` | `(tenantId,active,startDate,endDate)` | ✅ |
| `EmailLog` | ✅ | ✅ | FK به `Tenant` | `(tenantId,to,createdAt)`, `(tenantId,status,createdAt)` | ✅ |
| `SmsLog` | ✅ | ✅ | FK به `Tenant` | `(tenantId,to,createdAt)`, `(tenantId,status,createdAt)` | ✅ |
| `Page` | ✅ | ✅ | FK به `Tenant` | `(tenantId,isPublished)`, `(tenantId,slug)` unique | ✅ |
| `Post` | ✅ | ✅ | FK به `Tenant` | `(tenantId,isPublished,publishedAt)`, `(tenantId,slug)` unique | ✅ |
| `MenuItem` | ✅ | ✅ | FK به `Tenant` | `(tenantId,location,active)` | ✅ |
| `InventoryItem` | ✅ | ✅ (transitive از Product) | از Product filter | index از Product | ✅ |
| `InventoryAdjustment` | ✅ | ✅ | FK به `Tenant` | `(tenantId,productId,createdAt)` | ✅ |
| `InventoryReservation` | ✅ | ✅ (transitive) | از Order/Product | index از Order | ✅ |
| `OutboxEvent` | ✅ (با tenantId) | ✅ | FK اختیاری به `Tenant` (nullable برای platform events) | `(tenantId,processedAt,claimedAt,createdAt)`, `(type,createdAt)` | ✅ |
| `AiUsageLog` | ✅ | ✅ | FK به `Tenant` | `(tenantId,feature,createdAt)` | ✅ |
| `FeatureFlag` | Hybrid | ⚠️ | `tenantId?` (nullable برای platform flags) | `(tenantId,key)` unique composite | ✅ (با NULL handling) |

### ۱۱.۲ تغییرات Unique Constraints
```prisma
// قبل
@@unique([slug])    // Product
@@unique([sku])     // Product
@@unique([email])   // Customer
@@unique([code])    // Coupon
@@unique([slug])    // Page, Post
@@unique([invoiceNumber])  // Invoice

// بعد
@@unique([tenantId, slug])    // Product
@@unique([tenantId, sku])     // Product
@@unique([tenantId, email])   // Customer
@@unique([tenantId, code])    // Coupon
@@unique([tenantId, slug])    // Page, Post
@@unique([tenantId, invoiceNumber])  // Invoice
```

### ۱۱.۳ تغییرات Index ترکیبی
```prisma
// هر tenant-scoped model باید این الگو را داشته باشد:
@@index([tenantId])
@@index([tenantId, createdAt])
@@index([tenantId, status, createdAt])  // برای dashboard queries
```

### ۱۱.۴ آیا Shared DB مناسب است؟
✅ **بله** (با شرایط زیر):
- برای ۱–۵,۰۰۰ Tenant کاملاً مناسب
- در ۵,۰۰۰+ می‌توان `PARTITION BY HASH (tenant_id)` اضافه کرد
- در ۱۰,۰۰۰+ می‌توان به Schema-per-Tenant مهاجرت کرد (همان DB، N schema)

### ۱۱.۵ RLS Strategy Design
در ادامه به‌طور کامل توضیح داده می‌شود (بخش ۱۳).

---

## ۱۲) Prisma Migration Strategy

### ۱۲.۱ فازهای Migration (Zero-Downtime)

#### فاز A: افزودن جدید (هفته ۱)
```prisma
// Migration 1: tenant_foundation
// فایل: prisma/migrations/20260815000000_tenant_foundation/migration.sql

-- 1. جداول سراسری
CREATE TABLE "tenants" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT UNIQUE NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'trial',
  "ownerEmail" TEXT NOT NULL,
  "trialEndsAt" TIMESTAMP,
  "suspendedAt" TIMESTAMP,
  "deletedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "metadata" JSONB,
  -- ... سایر فیلدها
);
CREATE INDEX "tenants_status_idx" ON "tenants"("status");
CREATE INDEX "tenants_deletedAt_idx" ON "tenants"("deletedAt");

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  ...
);

CREATE TABLE "tenant_users" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'member',
  "status" TEXT NOT NULL DEFAULT 'active',
  ...
);
CREATE UNIQUE INDEX "tenant_users_tenantId_userId_key" ON "tenant_users"("tenantId", "userId");

CREATE TABLE "plans" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "priceRial" INTEGER NOT NULL,
  "interval" TEXT NOT NULL,
  "features" JSONB NOT NULL,
  "limits" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "planId" TEXT NOT NULL REFERENCES "plans"("id"),
  "status" TEXT NOT NULL,
  "startsAt" TIMESTAMP NOT NULL,
  "endsAt" TIMESTAMP,
  "trialEndsAt" TIMESTAMP,
  ...
);
CREATE INDEX "subscriptions_tenantId_idx" ON "subscriptions"("tenantId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

CREATE TABLE "domains" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "hostname" TEXT UNIQUE NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verificationToken" TEXT NOT NULL,
  "sslStatus" TEXT NOT NULL DEFAULT 'pending',
  ...
);

CREATE TABLE "platform_admins" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'super_admin',
  ...
);

CREATE TABLE "platform_audit_logs" (
  "id" TEXT PRIMARY KEY,
  "adminId" TEXT NOT NULL REFERENCES "platform_admins"("id"),
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "payload" JSONB,
  ...
);
```

#### فاز B: افزودن tenantId (nullable) به ۲۳ مدل (هفته ۲)
```prisma
// Migration 2: add_tenant_id_nullable
// فایل: prisma/migrations/20260816000000_add_tenant_id_nullable/migration.sql

-- برای هر ۲۳ مدل:
ALTER TABLE "products" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" 
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;

-- Index (فقط tenantId فعلاً)
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- (این کار برای orders, customers, payment_intents, invoices, transactions, 
--  shipments, coupons, coupon_redemptions, campaigns, email_logs, sms_logs,
--  pages, posts, menu_items, inventory_items, inventory_adjustments,
--  inventory_reservations, outbox_events, ai_usage_logs, feature_flags,
--  shipping_rates, order_items تکرار می‌شود)
```

#### فاز C: ساخت Default Tenant و Backfill (هفته ۲)
```prisma
// Migration 3: backfill_default_tenant
// فایل: prisma/migrations/20260817000000_backfill_default_tenant/migration.sql

-- 1. ساخت default tenant
INSERT INTO "tenants" ("id", "slug", "displayName", "status", "ownerEmail", "createdAt", "updatedAt")
VALUES ('t_default_legacy', 'legacy', 'فروشگاه اصلی (مهاجرت)', 'active', 'admin@saite.local', NOW(), NOW());

-- 2. ساخت default user برای admin فعلی
INSERT INTO "users" ("id", "email", "name", "createdAt", "updatedAt")
VALUES ('u_default_admin', 'admin@saite.local', 'مدیر سیستم', NOW(), NOW());

-- 3. ایجاد tenant_users
INSERT INTO "tenant_users" ("id", "tenantId", "userId", "role", "status", "joinedAt", "createdAt", "updatedAt")
VALUES ('tu_default', 't_default_legacy', 'u_default_admin', 'owner', 'active', NOW(), NOW(), NOW());

-- 4. Backfill تمام ردیف‌ها
UPDATE "products" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "orders" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
UPDATE "customers" SET "tenantId" = 't_default_legacy' WHERE "tenantId" IS NULL;
-- ... (۲۰ جدول دیگر)

-- 5. ساخت subscription پیش‌فرض
INSERT INTO "plans" ("id", "code", "name", "priceRial", "interval", "features", "limits", "active")
VALUES ('plan_legacy', 'legacy', 'پلن قدیمی (بدون محدودیت)', 0, 'monthly', 
        '["all_features"]'::jsonb,
        '{"maxProducts": -1, "maxUsers": -1, "maxStorageMb": -1, "maxOrdersPerMonth": -1}'::jsonb,
        true);

INSERT INTO "subscriptions" ("id", "tenantId", "planId", "status", "startsAt", "createdAt", "updatedAt")
VALUES ('sub_legacy', 't_default_legacy', 'plan_legacy', 'active', NOW(), NOW(), NOW());
```

#### فاز D: تغییر Unique Constraints (هفته ۳)
```prisma
// Migration 4: tenant_scoped_uniques
// فایل: prisma/migrations/20260818000000_tenant_scoped_uniques/migration.sql

-- Product
ALTER TABLE "products" DROP CONSTRAINT "products_slug_key";
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_slug_key" UNIQUE ("tenantId", "slug");

ALTER TABLE "products" DROP CONSTRAINT "products_sku_key";
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_sku_key" UNIQUE ("tenantId", "sku");

-- Customer
ALTER TABLE "customers" DROP CONSTRAINT "customers_email_key";
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_email_key" UNIQUE ("tenantId", "email");

-- Coupon
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_code_key";
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenantId_code_key" UNIQUE ("tenantId", "code");

-- Page, Post
ALTER TABLE "pages" DROP CONSTRAINT "pages_slug_key";
ALTER TABLE "pages" ADD CONSTRAINT "pages_tenantId_slug_key" UNIQUE ("tenantId", "slug");

ALTER TABLE "posts" DROP CONSTRAINT "posts_slug_key";
ALTER TABLE "posts" ADD CONSTRAINT "posts_tenantId_slug_key" UNIQUE ("tenantId", "slug");

-- Invoice
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_invoiceNumber_key";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenantId_invoiceNumber_key" UNIQUE ("tenantId", "invoiceNumber");
```

#### فاز E: NOT NULL Constraints (هفته ۳)
```prisma
// Migration 5: enforce_tenant_id_not_null
// فایل: prisma/migrations/20260819000000_enforce_tenant_id_not_null/migration.sql

-- پس از backfill، tenantId NOT NULL
ALTER TABLE "products" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "tenantId" SET NOT NULL;
-- ... (بقیه ۲۲ جدول)
```

#### فاز F: Composite Indexes (هفته ۴)
```prisma
// Migration 6: composite_indexes
// فایل: prisma/migrations/20260820000000_composite_indexes/migration.sql

CREATE INDEX "products_tenantId_createdAt_idx" ON "products"("tenantId", "createdAt");
CREATE INDEX "products_tenantId_category_createdAt_idx" ON "products"("tenantId", "category", "createdAt");
CREATE INDEX "products_tenantId_stockStatus_idx" ON "products"("tenantId", "stockStatus");

CREATE INDEX "orders_tenantId_createdAt_idx" ON "orders"("tenantId", "createdAt");
CREATE INDEX "orders_tenantId_customerId_createdAt_idx" ON "orders"("tenantId", "customerId", "createdAt");
CREATE INDEX "orders_tenantId_status_createdAt_idx" ON "orders"("tenantId", "status", "createdAt");

CREATE INDEX "customers_tenantId_createdAt_idx" ON "customers"("tenantId", "createdAt");
-- ... (برای هر tenant-scoped model)
```

#### فاز G: فعال‌سازی RLS (هفته ۴)
```prisma
// Migration 7: enable_rls
// فایل: prisma/migrations/20260821000000_enable_rls/migration.sql

-- فعال‌سازی RLS برای همهٔ tenant-scoped models
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "products"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));
CREATE POLICY "platform_admin_bypass" ON "products"
  USING (current_setting('app.bypass_tenant_isolation', true) = 'on');

-- ... (برای هر ۲۳ مدل)
```

### ۱۲.۲ ترتیب Migration
1. ✅ **هفته ۱:** Migration 1 (جداول سراسری) → بدون تغییر رفتار
2. ✅ **هفته ۲:** Migration 2 (tenantId nullable) + Migration 3 (backfill) → هنوز بدون tenant enforcement
3. ✅ **هفته ۳:** Migration 4 + 5 (unique + NOT NULL) → schema آماده
4. ✅ **هفته ۴:** Migration 6 + 7 (indexes + RLS) → enforcement فعال
5. ✅ **پس از فعال‌سازی RLS:** Application-level enforcement (در proxy.ts) → defense-in-depth

### ۱۲.۳ Rollback Strategy
- هر migration دارای `down.sql` متناظر
- Backup قبل از هر migration: `pg_dump` کامل
- در فاز A-E: rollback آسان (هیچ enforcement نیست)
- در فاز G (RLS): rollback با `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`

### ۱۲.۴ پیش از Migration
```bash
# 1. Backup کامل
pg_dump -Fc saite_prod > backup_pre_tenant_$(date +%Y%m%d).dump

# 2. در ساعات کم‌ترافیک
# 3. اجرای migration
npx prisma migrate deploy
# 4. Smoke test
# 5. در صورت خطا: pg_restore
```

---

## ۱۳) PostgreSQL RLS Strategy

### ۱۳.۱ معماری RLS

```
Application Request
    ↓
Next.js Route Handler
    ↓
prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId}`;
    return tx.product.findMany();  // RLS به‌صورت خودکار فیلتر می‌کند
});
    ↓
PostgreSQL: SET LOCAL → فقط در transaction جاری
    ↓
RLS Policy: USING (tenantId = current_setting('app.current_tenant_id'))
    ↓
فقط ردیف‌های tenant جاری برگشت داده می‌شود
```

### ۱۳.۲ تنظیم Tenant Context در Prisma Transaction

```typescript
// src/server/shared/db.ts
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage<{ tenantId: string | null; bypass: boolean }>();

// Prisma Client با RLS-aware
const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    // برای همهٔ مدل‌ها
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = als.getStore();
        if (ctx && ctx.tenantId && !ctx.bypass) {
          // inject SET LOCAL
          // این کار با $transaction انجام می‌شود
        }
        return query(args);
      },
    },
  },
});

// Helper: اجرا با tenant context
export async function withTenantContext<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}
```

**⚠️ نکتهٔ مهم:** `set_config(..., true)` معادل `SET LOCAL` است و فقط در transaction جاری اعمال می‌شود. پس از `COMMIT`/`ROLLBACK` پاک می‌شود.

### ۱۳.۳ RLS Policies (مثال کامل برای Product)
```sql
-- Enable RLS
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" FORCE ROW LEVEL SECURITY;  -- حتی مالک جدول هم باید RLS را رعایت کند

-- Policy 1: Tenant isolation
CREATE POLICY "products_tenant_isolation" ON "products"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true));

-- Policy 2: Platform admin bypass
CREATE POLICY "products_platform_bypass" ON "products"
  FOR ALL
  USING (current_setting('app.bypass_tenant_isolation', true) = 'on');

-- Policy 3: Read-only for archived tenants
CREATE POLICY "products_archived_readonly" ON "products"
  FOR INSERT
  WITH CHECK (
    current_setting('app.allow_writes', true) = 'on'
    OR current_setting('app.current_tenant_id', true) = 'archived'
  );
```

### ۱۳.۴ FORCE ROW LEVEL SECURITY
**ضروری است.** بدون `FORCE`:
- مالک جدول (superuser) و table owner می‌توانند RLS را bypass کنند
- اگر Prisma با superuser وصل شود، RLS اعمال نمی‌شود

**راه‌حل:**
- `ALTER TABLE ... FORCE ROW LEVEL SECURITY` روی همهٔ جداول
- Prisma با user محدود (نه postgres superuser) متصل شود
- در `DATABASE_URL` از `app_user` استفاده شود، نه `postgres`

### ۱۳.۵ Bypass برای Platform Admin
```typescript
// src/server/platform/database-access.ts
export async function withPlatformAccess<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return basePrisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_tenant_isolation', 'on', true)`;
    return fn(tx);
  });
}
```

### ۱۳.۶ PgBouncer Compatibility

**چالش:** PgBouncer در حالت Transaction Pooling، session-level settings (مثل `SET`) را بین transactionها نگه می‌دارد.

**راه‌حل:** استفاده از `SET LOCAL` (یا `set_config(..., true)`):
- `SET LOCAL` فقط در transaction جاری اعمال می‌شود
- پس از `COMMIT`/`ROLLBACK` پاک می‌شود
- حتی اگر connection به transaction دیگر reuse شود، setting نشت نمی‌کند

**بنابراین:** معماری RLS ما با PgBouncer Transaction Pooling کاملاً سازگار است.

### ۱۳.۷ Background Jobs و RLS
```typescript
// src/server/jobs/workers/outbox-worker.ts
export async function processOutboxEvent(event: OutboxEvent) {
  if (event.tenantId) {
    // Event متعلق به یک tenant
    await withTenantContext(event.tenantId, async (tx) => {
      // process event با RLS
    });
  } else {
    // Platform-level event
    await withPlatformAccess(async (tx) => {
      // process event without tenant context
    });
  }
}
```

### ۱۳.۸ Prisma + RLS Gotchas

1. **`$queryRaw`:** RLS اعمال نمی‌شود مگر اینکه tenant context تنظیم شده باشد.
2. **Direct SQL (`$executeRaw`):** اگر برای INSERT بدون `tenantId` استفاده شود، RLS ممکن است block کند. باید explicit `tenantId` در VALUES باشد.
3. **Migration script:** باید `SET app.bypass_tenant_isolation = 'on'` در ابتدای script باشد.
4. **Seed script:** همچنین bypass نیاز دارد.

### ۱۳.۹ Tenant Context در Migration
```sql
-- prisma/migrations/*/migration.sql
-- Migration scripts بدون tenant context اجرا می‌شوند
-- اگر RLS فعال باشد، باید bypass تنظیم شود

SET LOCAL app.bypass_tenant_isolation = 'on';
-- ... migration statements
```

Prisma migration runner به‌صورت خودکار superuser استفاده می‌کند. راه‌حل:
- استفاده از non-superuser user برای Prisma
- یا اضافه کردن `ALTER ROLE prisma_user BYPASSRLS;` (نه توصیه می‌شود)

**روش صحیح:** یک user اختصاصی:
```sql
CREATE USER saite_app WITH PASSWORD 'xxx';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO saite_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO saite_app;
```

---

## ۱۴) Authentication & Authorization

### ۱۴.۱ سه نوع Authentication

```
┌─────────────────────────────────────────────┐
│ Platform Admin                              │
│ Email/Password + TOTP (required for super)  │
│ Session: saite_platform_session cookie      │
│ Scope: سراسری، بدون tenantId               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Tenant User (ادمین فروشگاه)                 │
│ Email/Password + TOTP (optional)            │
│ Session: saite_user_session cookie          │
│ Scope: یک یا چند Tenant (از TenantMembership)│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Store Customer (مشتری فروشگاه)              │
│ Email/Password (فعلی در Saite)              │
│ Session: saite_customer_session cookie     │
│ Scope: یک Tenant (از host)                  │
└─────────────────────────────────────────────┘
```

### ۱۴.۲ Session Token Design

```typescript
// src/lib/auth/server/session-token.ts (تغییر یافته)
export interface UserSessionPayload {
  sub: string;          // userId
  iat: number;
  exp: number;
  ver: string;          // برای revocation
  kind: 'user';         // نوع session
  currentTenantId: string;  // tenant فعال فعلی
  currentTenantRole: TenantRole;
  // tenantIds?: string[]  // اختیاری: همهٔ tenantهایی که user عضو است
}

// Customer session (فعلی)
export interface CustomerSessionPayload {
  sub: string;          // customerId
  iat: number;
  exp: number;
  ver: string;
  type: 'customer';
  tenantId: string;     // ← اضافه می‌شود
}

// Platform session (جدید)
export interface PlatformSessionPayload {
  sub: string;          // platformAdminId
  iat: number;
  exp: number;
  ver: string;
  kind: 'platform';
  role: PlatformRole;
}
```

### ۱۴.۳ Tenant Resolution Priority

```
1. URL path /admin/platform/* → Platform
2. Host header:
   - {slug}.platform.com → Tenant
   - custom domain → Tenant
3. Session:
   - Customer session → Tenant from session
   - User session → Tenant from session.currentTenantId
4. Default: 404 (Unknown Tenant)
```

### ۱۴.۴ User with Multiple Tenants

اگر User در چند Tenant باشد:
- در login: لیست Tenantها → انتخاب → session با `currentTenantId`
- در حالت authenticated: Tenant Switcher در header (فقط برای owner/admin)
- URL: `/{tenantSlug}.platform.com` → cookie `currentTenantId` به‌روز می‌شود

### ۱۴.5 Authorization (Permission Check)

```typescript
// src/lib/auth/server/tenant-guard.ts
export async function requireTenantPermission(
  permission: Permission
): Promise<{ ok: true; user: User; tenantUser: TenantUser } | { ok: false; response: NextResponse }> {
  // 1. Session
  const session = await getUserSession();
  if (!session) return { ok: false, response: unauthorized('no-session') };

  // 2. TenantUser
  const tenantUser = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: session.currentTenantId, userId: session.sub } },
  });
  if (!tenantUser || tenantUser.status !== 'active') {
    return { ok: false, response: unauthorized('forbidden') };
  }

  // 3. Permission
  if (!hasTenantPermission(tenantUser.role, permission)) {
    return { ok: false, response: unauthorized('forbidden') };
  }

  return { ok: true, user: session, tenantUser };
}
```

---

## ۱۵) Cache Isolation

### ۱۵.۱ وضعیت فعلی (از ممیزی قبلی)

**فایل‌های cache key فعلی:**
- `src/server/modules/products/service.ts:13-30` — `buildCacheKey()` فقط بر اساس query
- `src/server/shared/cache.ts:50` — `cacheAside(key, fetcher, { prefix, ttl })`

**نمونهٔ کلید فعلی:**
```
products:list:q:laptop|cat:printer|p:1|pp:20
```

### ۱۵.۲ استراتژی Prefix per Tenant

```typescript
// src/server/tenants/cache.ts
import { tenantContext } from './tenant-context';

export function getCachePrefix(resource: string): string {
  const ctx = tenantContext.get();
  if (!ctx) {
    throw new Error('Cache called outside tenant context');
  }
  return `tenant:${ctx.tenantId}:${resource}`;
}

// استفاده:
const key = `${getCachePrefix('products:list')}|q:${query.q}|...`;
```

### ۱۵.۳ Audit همهٔ Cache Calls

| فایل | کلید فعلی | تغییر لازم |
|---|---|---|
| `src/server/modules/products/service.ts:13` | `products:list\|...` | `tenant:{id}:products:list\|...` |
| `src/server/shared/cache.ts:50` | `cacheAside(key, ...)` | تأیید prefix شامل tenantId |
| `src/app/api/inventory/route.ts` (هیچ cache ندارد) | - | افزودن `tenant:{id}:inventory:dashboard` |
| `src/app/api/products/by-slug/...` (هیچ cache) | - | افزودن `tenant:{id}:product:slug:{slug}` |

**NOT VERIFIED:** ممکن است فایل‌های دیگری با cache key وجود داشته باشند که در این audit بررسی نشده‌اند. توصیه: در Phase 9 یک جستجوی `redis.set|get|cacheAside|cacheInvalidate` انجام شود.

### ۱۵.۴ Cache Invalidation per Tenant
```typescript
// src/server/tenants/cache.ts
export async function invalidateTenantCache(tenantId: string, resource?: string): Promise<number> {
  const pattern = resource 
    ? `tenant:${tenantId}:${resource}:*` 
    : `tenant:${tenantId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  return keys.length;
}
```

### ۱۵.۵ Rate Limit per Tenant
```typescript
// src/lib/auth/server/rate-limit.ts (تغییر یافته)
export async function consumeTenantRateLimit(
  tenantId: string,
  resource: 'api' | 'upload' | 'login' | 'search',
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `ratelimit:tenant:${tenantId}:${resource}`;
  return consumeRateLimit(key, maxAttempts, windowMs);
}
```

---

## ۱۶) File & Media Isolation

### ۱۶.۱ وضعیت فعلی
- `src/server/upload/service.ts` — `localDiskProvider` یا `s3Provider`
- Local: `public/uploads/` (همه در یک پوشه)
- S3 (ArvanCloud): `ARVAN_S3_BUCKET=saite-uploads` (همه در یک bucket)

### ۱۶.۲ معماری Multi-Tenant

#### Local Storage (Phase 1)
```
public/uploads/
├── tenant_t_abc123/
│   ├── products/
│   │   ├── product_123/
│   │   │   ├── image1.webp
│   │   │   └── image2.webp
│   │   └── product_456/
│   ├── content/
│   │   └── posts/
│   └── general/
├── tenant_t_xyz789/
│   ├── products/
│   └── ...
└── platform/
    └── platform_assets/
```

#### S3/MinIO (Phase 2+)
```
s3://saite-uploads/
├── tenants/
│   ├── t_abc123/
│   │   ├── products/
│   │   ├── content/
│   │   └── general/
│   └── t_xyz789/
└── platform/
```

### ۱۶.۳ تغییرات در `upload.service.ts`
```typescript
// src/server/upload/service.ts
export const uploadService = {
  async upload(opts: {
    file: Buffer;
    filename: string;
    mimetype: string;
    folder?: string;
  }) {
    const ctx = tenantContext.get();
    if (!ctx) throw new Error('Tenant context required for upload');
    
    const tenantFolder = `tenants/${ctx.tenantId}/${opts.folder || 'general'}`;
    return provider.upload({
      ...opts,
      folder: tenantFolder,
    });
  },
  // ...
};
```

### ۱۶.۴ Signed URL با TTL
```typescript
// src/server/upload/service.ts
export function getSignedUrl(key: string, expiresIn: number = 3600): string {
  // URL فقط برای duration معتبر باشد
  // اگر tenant دیگری بخواهد URL را share کند، منقضی می‌شود
  return provider.getSignedUrl(key, expiresIn);
}
```

### ۱۶.5 Tenant Deletion Cleanup
```typescript
// src/server/platform/tenant-deletion.ts
export async function deleteTenantData(tenantId: string): Promise<void> {
  // 1. Soft-delete: Tenant.deletedAt = now()
  // 2. پس از ۳۰ روز (grace period): hard delete
  // 3. S3: list objects با prefix tenants/{tenantId}/ → delete all
  // 4. Database: CASCADE در Foreign Key → خودکار
  // 5. Redis: invalidate tenant cache
  // 6. Audit: logPlatformAction('tenant.deleted', tenantId)
}
```

### ۱۶.6 Backup
- S3: lifecycle policy برای version retention
- Local: `tar czf` روزانه از `public/uploads/`

---

## ۱۷) Background Jobs & Events

### ۱۷.۱ وضعیت فعلی
- `src/server/jobs/queues.ts` — `outboxQueue`, `emailQueue`, `smsQueue`
- `src/server/shared/event-bus.ts` — publish to outbox events table
- `src/server/jobs/workers/outbox-worker.ts` — reads outbox, dispatches

### ۱۷.۲ تغییرات لازم

#### OutboxEvent با tenantId
```prisma
model OutboxEvent {
  // ... فیلدهای فعلی
  tenantId  String?  // nullable برای platform-level events
  source    String   // 'tenant' | 'platform'
  
  tenant    Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId, processedAt, claimedAt, createdAt])
  @@index([source, processedAt, createdAt])
}
```

#### Worker با Tenant Context
```typescript
// src/server/jobs/workers/outbox-worker.ts
async function processEvent(event: OutboxEvent) {
  if (event.tenantId) {
    await withTenantContext(event.tenantId, async (tx) => {
      // handler با RLS
    });
  } else {
    // platform event
    await processPlatformEvent(event);
  }
}
```

### ۱۷.۳ Job Payload با tenantId
```typescript
// src/server/jobs/queues.ts (تغییر)
export interface TenantJobData {
  tenantId: string;
  userId?: string;
  // ... other data
}

export const outboxQueue = new Queue('outbox', { connection: redis });

// publish:
await outboxQueue.add('process', { 
  type: 'order.created', 
  payload: { ... },
  tenantId: 't_abc'  // ← اضافه شود
});
```

### ۱۷.۴ Worker Tenant Context
```typescript
// src/server/jobs/worker-context.ts
export async function runJobInTenantContext<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  return tenantContext.run(
    { tenantId, tenantSlug: 'unknown', source: 'background_job' },
    fn
  );
}
```

### ۱۷.۵ Scheduled Jobs (Cron)
- **Billing Expiry Check** (هر ساعت): ساسپند Subscriptionهای منقضی
- **Trial Reminder** (روزانه): ایمیل یادآوری ۳ روز قبل از پایان trial
- **Domain Re-verify** (هفتگی): بررسی TXT record هنوز در DNS است
- **Log Retention** (روزانه): حذف لاگ‌های قدیمی‌تر از ۹۰ روز
- **Usage Snapshot** (روزانه): ذخیره مصرف منابع هر tenant
- **SSL Renewal Check** (روزانه): تمدید certهای در حال انقضا

---

## ۱۸) Subscription & Plans

### ۱۸.۱ مدل Plan
```prisma
model Plan {
  id          String         @id @default(cuid())
  code        String         @unique  // 'starter', 'pro', 'enterprise'
  name        String
  description String?
  priceRial   Int            // 0 = رایگان
  interval    PlanInterval
  features    Json           // ['custom_domain', 'ai_advisor', ...]
  limits      Json           // { maxProducts: 1000, maxUsers: 5, ... }
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
```

### ۱۸.۲ مثال Plan
```json
{
  "code": "pro",
  "name": "حرفه‌ای",
  "priceRial": 5000000,
  "interval": "monthly",
  "features": [
    "basic_catalog",
    "advanced_orders",
    "coupons",
    "email_marketing",
    "custom_domain",
    "advanced_reports",
    "ai_advisor",
    "priority_support"
  ],
  "limits": {
    "maxProducts": 5000,
    "maxUsers": 5,
    "maxStorageMb": 5000,
    "maxOrdersPerMonth": 5000,
    "maxCategories": 100,
    "maxCoupons": 50,
    "maxCampaignsPerMonth": 20
  },
  "trialDays": 14
}
```

### ۱۸.۳ مدل Subscription
```prisma
model Subscription {
  id                    String             @id @default(cuid())
  tenantId              String
  planId                String
  status                SubscriptionStatus
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  trialEndsAt           DateTime?
  cancelledAt           DateTime?
  cancelAtPeriodEnd     Boolean            @default(false)
  paymentMethod         String?            // 'zarinpal', 'idpay', 'manual'
  paymentReference      String?            // شماره پیگیری
  nextBillingAt         DateTime?
  failedPaymentCount    Int                @default(0)
  gracePeriodEndsAt     DateTime?
  metadata              Json?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  tenant                Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan                  Plan               @relation(fields: [planId], references: [id])
  billingEvents         SubscriptionBillingEvent[]

  @@index([tenantId, status])
  @@index([status, currentPeriodEnd])
  @@index([nextBillingAt, status])
  @@map("subscriptions")
}

enum SubscriptionStatus {
  trialing       // ۱۴ روز رایگان
  active         // فعال
  past_due       // پرداخت ناموفق، در grace period
  grace_period   // ۷ روز فرصت
  suspended      // تعلیق
  cancelled      // لغو شده (ولی هنوز فعال تا پایان دوره)
  expired        // منقضی
}
```

### ۱۸.۴ Quota Enforcement (Backend)

```typescript
// src/server/subscriptions/quota-enforcer.ts
export class QuotaExceededError extends Error {
  constructor(public resource: string, public limit: number, public current: number) {
    super(`سقف ${resource} (${limit}) تکمیل شده است. ${current} مورد استفاده شده.`);
  }
}

export async function enforceQuota(
  resource: 'product' | 'order' | 'user' | 'storage' | 'category' | 'coupon',
  increment: number = 1
): Promise<void> {
  const ctx = tenantContext.require();
  const sub = await getActiveSubscription(ctx.tenantId);
  if (!sub) throw new QuotaExceededError('subscription', 0, 0);
  
  const limits = sub.plan.limits as PlanLimits;
  if (limits[`max${capitalize(resource)}s`] === -1) return; // unlimited
  
  const current = await getCurrentUsage(ctx.tenantId, resource);
  if (current + increment > limits[`max${capitalize(resource)}s`]) {
    throw new QuotaExceededError(
      resource, 
      limits[`max${capitalize(resource)}s`], 
      current
    );
  }
}

export async function getCurrentUsage(
  tenantId: string, 
  resource: 'product' | 'order' | 'user' | 'storage' | 'category' | 'coupon'
): Promise<number> {
  // Cache برای ۵ دقیقه
  const cacheKey = `tenant:${tenantId}:usage:${resource}`;
  const cached = await redis.get(cacheKey);
  if (cached) return parseInt(cached, 10);
  
  let count: number;
  switch (resource) {
    case 'product': count = await prisma.product.count({ where: { tenantId } }); break;
    case 'order': 
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      count = await prisma.order.count({ 
        where: { tenantId, createdAt: { gte: startOfMonth } } 
      }); 
      break;
    case 'user': count = await prisma.tenantUser.count({ where: { tenantId, status: 'active' } }); break;
    case 'storage': 
      // محاسبه از S3 (slow) - cached برای ۱ ساعت
      count = await getStorageUsageBytes(tenantId);
      break;
    // ...
  }
  
  await redis.set(cacheKey, count, 'EX', 300);
  return count;
}
```

استفاده در Route Handler:
```typescript
// src/app/api/products/route.ts
export const POST = withTenantContext(async (req) => {
  const guard = await requireTenantPermission('catalog:write');
  if (!guard.ok) return guard.response;
  
  await enforceQuota('product', 1);  // ← enforcement
  
  const product = await productsService.create(...);
  return NextResponse.json(product, { status: 201 });
});
```

### ۱۸.۵ Feature Gating (Plan Features)
```typescript
// src/server/subscriptions/feature-gate.ts
export async function requireFeature(feature: string): Promise<void> {
  const ctx = tenantContext.require();
  const sub = await getActiveSubscription(ctx.tenantId);
  if (!sub) throw new FeatureNotAvailableError(feature);
  
  const features = sub.plan.features as string[];
  if (!features.includes(feature) && !features.includes('*')) {
    throw new FeatureNotAvailableError(feature);
  }
}

// استفاده:
// POST /api/admin/domains (فقط در plan با custom_domain)
export const POST = withTenantContext(async (req) => {
  await requireFeature('custom_domain');
  // ...
});
```

### ۱۸.۶ Subscription Lifecycle
```
┌──────────────────────────────────────────────────────────────┐
│                      Subscription Lifecycle                   │
└──────────────────────────────────────────────────────────────┘

Create Tenant
   ↓
INSERT Subscription (status=trialing, trialEndsAt=+14d)
   ↓
[Day 0-14: TRIAL]
   - تمام features پلن فعال
   - quota: maxProducts=100, maxUsers=1
   - Email: "شروع آزمایشی"
   ↓
[Day 11: REMINDER]
   - Email: "3 روز تا پایان trial"
   ↓
[Day 14: EXPIRY if not paid]
   - status → expired
   - Tenant.status → suspended
   - Store: read-only mode
   - Email: "trial پایان یافت"
   ↓
[If paid: ACTIVE]
   - status → active
   - Tenant.status → active
   - currentPeriodEnd = +30d
   - nextBillingAt = +30d
   ↓
[Day 30-7: REMINDER]
   - Email: "7 روز تا تمدید"
   ↓
[Day 30: BILLING]
   - Attempt payment via Zarinpal
   ↓
   ├─ Success: currentPeriodEnd += 30d
   └─ Failed: failedPaymentCount++
   ↓
[3 failed: PAST_DUE]
   - status → past_due
   - gracePeriodEndsAt = +7d
   - Tenant.status → past_due
   - Email: "پرداخت ناموفق"
   ↓
[7 days: SUSPENDED]
   - status → suspended
   - Tenant.status → suspended
   - Store: 503 "Account suspended"
   - Email: "حساب معلق شد"
   ↓
[If user pays: RESUME]
   - status → active
   - failedPaymentCount = 0
   - gracePeriodEndsAt = NULL
   ↓
[If user cancels: CANCELLED]
   - cancelledAt = now()
   - cancelAtPeriodEnd = true
   - در پایان دوره: status → expired
```

---

## ۱۹) Billing Architecture

### ۱۹.۱ کامپوننت‌ها

```
┌─────────────────────────────────────────────┐
│ Billing Service (Zarinpal/IDPay)            │
└──────────┬──────────────────────────────────┘
           │
   ┌───────┴───────┐
   │               │
   ▼               ▼
Zarinpal       IDPay
adapter        adapter
   │               │
   └───────┬───────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│ Subscription Webhook Handler                │
│ - Verify signature                          │
│ - Idempotency (idempotencyKey)              │
│ - Update Subscription                       │
│ - Send confirmation email                   │
│ - Audit log                                 │
└─────────────────────────────────────────────┘
```

### ۱۹.۲ Webhook Endpoint
```typescript
// src/app/api/platform/billing/webhook/[provider]/route.ts
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const body = await req.json();
  
  // 1. Verify signature
  const isValid = await verifyWebhookSignature(provider, body);
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  
  // 2. Idempotency
  const eventId = body.event_id || body.id;
  const existing = await prisma.processedWebhook.findUnique({ where: { eventId } });
  if (existing) return NextResponse.json({ ok: true, idempotent: true });
  
  // 3. Process based on event type
  switch (body.event_type) {
    case 'payment.succeeded':
      await handlePaymentSucceeded(body);
      break;
    case 'payment.failed':
      await handlePaymentFailed(body);
      break;
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(body);
      break;
  }
  
  // 4. Mark as processed
  await prisma.processedWebhook.create({
    data: { eventId, provider, payload: body, processedAt: new Date() },
  });
  
  return NextResponse.json({ ok: true });
}
```

### ۱۹.۳ Idempotency
```prisma
model ProcessedWebhook {
  eventId     String   @id  // unique event id از provider
  provider    String   // 'zarinpal' | 'idpay'
  payload     Json
  processedAt DateTime @default(now())
  
  @@index([provider, processedAt])
  @@map("processed_webhooks")
}
```

### ۱۹.۴ Payment Failure Handling
- 1st failure: Email + grace period +7d
- 2nd failure: Email + grace period
- 3rd failure: Tenant suspended (read-only)
- 30 days no payment: data archived (soft delete)

---

## ۲۰) API Migration Plan

### ۲۰.۱ جدول APIها

| API | Tenant-Aware Required | Required Change | Security Risk |
|---|---|---|---|
| `GET /api/products` | ✅ | با `withTenantContext` wrap + RLS | High (نشت لیست محصولات) |
| `POST /api/products` | ✅ | wrap + enforceQuota('product') | High |
| `PATCH /api/products/{id}` | ✅ | wrap + check `product.tenantId === ctx.tenantId` | High |
| `DELETE /api/products/{id}` | ✅ | wrap + check | High |
| `GET /api/products/{id}` | ✅ | wrap | High |
| `GET /api/products/by-slug/{slug}` | ✅ | wrap + tenantId filter | High |
| `GET /api/orders` | ✅ | wrap (customer's tenant only) | High |
| `POST /api/orders` | ✅ | wrap (customer's tenant) | Medium |
| `GET /api/orders/{id}` | ✅ | wrap + canAccessOrder(tenantId, customerId) | High |
| `PATCH /api/orders/{id}` (cancel) | ✅ | wrap | High |
| `GET /api/customers/session` | ✅ | wrap (customer from tenant) | Medium |
| `POST /api/customers/session` | ✅ | wrap + tenantId from host | High |
| `GET /api/inventory` | ✅ | wrap (admin only, tenant-scoped) | High |
| `GET /api/inventory/alerts` | ✅ | wrap | High |
| `GET /api/finance/invoices` | ✅ | wrap | High |
| `POST /api/finance/invoices/{id}` | ✅ | wrap | High |
| `GET /api/finance/transactions` | ✅ | wrap | High |
| `GET /api/marketing/coupons` | ✅ | wrap | High |
| `POST /api/marketing/coupons/validate` | ✅ | wrap (coupon از همان tenant) | Medium |
| `GET /api/content/pages` | ✅ | wrap | High |
| `GET /api/content/posts` | ✅ | wrap | High |
| `GET /api/ai/advisor` | ✅ | wrap (AI context: products from tenant) | Medium |
| `POST /api/ai/chat` | ✅ | wrap (AI context) | Medium |
| `GET /api/comms/email-logs` | ✅ | wrap | High |
| `GET /api/comms/sms-logs` | ✅ | wrap | High |
| `POST /api/upload` | ✅ | wrap + tenantId in storage path | High |
| `POST /api/payments` | ✅ | wrap (customer's tenant) | Medium |
| `POST /api/payments/webhook/{provider}` | ✅ | lookup tenant from orderId | Low |
| `GET /api/shipping/shipments` | ✅ | wrap | High |
| `GET /api/shipping/rates` | ✅ | wrap (per-tenant rates or global default) | Medium |
| `GET /api/health/*` | ❌ | بدون tenant context | None |

### ۲۰.۲ APIهای جدید Platform Admin

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/platform/auth/login` | None | ورود Platform Admin |
| `GET /api/platform/auth/session` | Platform | Session info |
| `DELETE /api/platform/auth/session` | Platform | Logout |
| `GET /api/platform/tenants` | Platform super_admin | لیست |
| `POST /api/platform/tenants` | Platform super_admin | ساخت |
| `GET /api/platform/tenants/{id}` | Platform | جزئیات |
| `PATCH /api/platform/tenants/{id}` | Platform super_admin | ویرایش |
| `POST /api/platform/tenants/{id}/suspend` | Platform super_admin | تعلیق |
| `POST /api/platform/tenants/{id}/resume` | Platform super_admin | فعال‌سازی |
| `POST /api/platform/tenants/{id}/archive` | Platform super_admin | آرشیو |
| `DELETE /api/platform/tenants/{id}` | Platform super_admin | حذف نرم |
| `GET /api/platform/plans` | Platform | لیست |
| `POST /api/platform/plans` | Platform super_admin | ساخت |
| `PATCH /api/platform/plans/{id}` | Platform super_admin | ویرایش |
| `GET /api/platform/subscriptions` | Platform | لیست |
| `POST /api/platform/subscriptions` | Platform | دستی فعال‌سازی |
| `PATCH /api/platform/subscriptions/{id}` | Platform | تغییر Plan |
| `POST /api/platform/subscriptions/{id}/cancel` | Platform | لغو |
| `GET /api/platform/domains` | Platform | لیست |
| `POST /api/platform/tenants/{id}/domains` | Platform | افزودن |
| `POST /api/platform/tenants/{id}/domains/{domainId}/verify` | Platform | تأیید |
| `DELETE /api/platform/tenants/{id}/domains/{domainId}` | Platform | حذف |
| `GET /api/platform/usage` | Platform | گزارش مصرف |
| `GET /api/platform/audit-logs` | Platform super_admin | لاگ اقدامات |
| `GET /api/platform/system/health` | Platform | وضعیت سیستم |
| `GET /api/platform/system/metrics` | Platform engineer | متریک‌ها |
| `GET /api/platform/users` | Platform super_admin | لیست Platform Adminها |
| `POST /api/platform/users` | Platform super_admin | ساخت Platform Admin |
| `POST /api/platform/tenants/{id}/impersonate` | Platform super_admin | ورود به‌جای Tenant Owner |

---

## ۲۱) Frontend Migration Plan

### ۲۱.۱ ساختار جدید
```
src/app/
├── (platform)/                       # Platform Admin subdomain: admin.platform.com
│   ├── layout.tsx                    # Platform guard
│   ├── login/
│   └── admin/platform/               # Pages
│       ├── dashboard/
│       ├── tenants/
│       ├── plans/
│       ├── subscriptions/
│       ├── domains/
│       ├── users/
│       ├── audit-logs/
│       └── system/
│
├── (storefront)/                     # Tenant store: {slug}.platform.com یا custom domain
│   ├── layout.tsx                    # Tenant Resolver
│   ├── (public)/                     # صفحات عمومی
│   │   ├── page.tsx                  # صفحه اصلی
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── ...
│   └── admin/                        # Tenant Admin: {slug}.platform.com/admin
│       ├── login/
│       └── (panel)/                  # صفحات پنل (موجود)
│           ├── dashboard/
│           ├── products/
│           ├── orders/
│           └── ...
│
└── api/
    ├── platform/                     # Platform APIs
    └── (tenant APIs)                 # Tenant APIs
```

### ۲۱.۲ Domain-Aware Routing
- `src/proxy.ts` (موجود) → توسعه با `resolveTenantFromHost`
- `src/middleware.ts` (fallback برای مسیرهای platform)

### ۲۱.۳ Tenant Context در Frontend
```typescript
// src/lib/tenant/client.ts
'use client';
import { usePathname } from 'next/navigation';

export function useTenantSlug(): string | null {
  const pathname = usePathname();
  // یا از window.location.host
  if (typeof window === 'undefined') return null;
  const host = window.location.host;
  const match = host.match(/^([^.]+)\.platform\.com$/);
  return match ? match[1] : null;
}
```

### ۲۱.4 Navigation
- **Tenant Admin:** همان nav فعلی (`src/lib/admin/nav.ts`) با اضافه شدن «تنظیمات Tenant» (دامنه، plan، subscription)
- **Platform Admin:** nav جدید در `src/lib/admin/platform-nav.ts`

### ۲۱.5 Layout Changes
- `src/app/(storefront)/layout.tsx` → Tenant context (از host)
- `src/app/(platform)/layout.tsx` → Platform context (host check)
- `src/app/admin/(panel)/layout.tsx` (موجود) → با tenant guard

### ۲۱.6 Error Handling
- Tenant ناشناس → 404 با پیام «دامنه پیکربندی نشده»
- Tenant suspended → 503 با پیام
- Tenant archived → 410 Gone
- Plan expired → redirect به billing

---

## ۲۲) Infrastructure / VPS Architecture

### ۲۲.۱ معماری Production واقعی (بر اساس Repository)

```
[Internet]
    │
    ▼
[Cloudflare]  (اختیاری، فاز ۲+)
    │ DNS + DDoS + CDN
    ▼
[Traefik]  ← جایگزین nginx فعلی
    │ - Let's Encrypt DNS-01 (per-tenant)
    │ - Host-based routing
    │ - Rate limit (L4)
    │
    ├──→ app:3000 (Next.js, multi-instance)
    │      ↓
    │   proxy.ts → Tenant Resolver
    │      ↓
    │   withTenantContext wrapper
    │      ↓
    │   Prisma → PgBouncer:6432
    │
    ├──→ platform:3000  (Platform Admin UI - می‌تواند همان app باشد با route group متفاوت)
    │
    └──→ worker (BullMQ)
           - Outbox dispatcher
           - Billing cron
           - Trial reminder
           - Domain re-verify
           - SSL renewal check
           - Log retention

[PgBouncer]  ← اضافه می‌شود
    │ - Transaction pooling
    │ - Port 6432
    │
    ▼
[PostgreSQL 17]  ← موجود
    │ - با RLS
    │ - pg_trgm + pgvector (موجود)
    │
    ├── 10.61.x.x:5432 (internal)

[Redis 7]  ← موجود
    │ - Cache + Queue + Rate Limit
    │
    └── 10.61.x.x:6379 (internal)

[MinIO]  ← اضافه می‌شود (S3-compatible)
    │ - tenants/{tenantId}/...
    │ - presigned URLs
    │
    └── 10.61.x.x:9000 (internal)
```

### ۲۲.۲ اجزای آماده در پروژه
- ✅ Docker (`docker-compose.prod.yml`)
- ✅ PostgreSQL 17
- ✅ Redis 7
- ✅ Next.js standalone build (`Dockerfile`)
- ✅ Health checks
- ✅ Standalone build

### ۲۲.۳ اجزای جدید
- ❌ Traefik (جایگزین `nginx`)
- ❌ PgBouncer
- ❌ MinIO
- ❌ Certbot (داخل Traefik)
- ❌ Backup service (per-tenant)
- ❌ Monitoring stack (Prometheus + Grafana)
- ❌ Log aggregation (Loki یا ELK)

### ۲۲.۴ docker-compose.prod.yml (پیشنهاد)
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entryPoint.to=websecure
      - --certificatesresolvers.letsencrypt.acme.dnschallenge=true
      - --certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare
      - --certificatesresolvers.letsencrypt.acme.email=admin@platform.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_letsencrypt:/letsencrypt
    ports:
      - "80:80"
      - "443:443"
    networks: [saite-net]
    restart: unless-stopped

  app:
    build: .
    expose: ['3000']
    environment:
      DATABASE_URL: postgresql://saite_app:${POSTGRES_PASSWORD}@pgbouncer:6432/saite
      REDIS_URL: redis://redis:6379
      RATE_LIMIT_STORE: redis
      NODE_ENV: production
    labels:
      - traefik.enable=true
      - traefik.http.routers.app.rule=HostRegexp(`{host:.+}`)
      - traefik.http.routers.app.tls=true
      - traefik.http.routers.app.tls.certresolver=letsencrypt
      - traefik.http.routers.app.priority=1
    depends_on: [pgbouncer, redis]
    networks: [saite-net]
    restart: unless-stopped
    deploy: { resources: { limits: { memory: 2G } } }

  worker:
    build: .
    command: ['node', 'server.js']
    environment:
      DATABASE_URL: postgresql://saite_app:${POSTGRES_PASSWORD}@pgbouncer:6432/saite
      REDIS_URL: redis://redis:6379
      RUN_JOBS: 1
    networks: [saite-net]
    deploy: { resources: { limits: { memory: 1G } } }

  pgbouncer:
    image: bitnami/pgbouncer:1.22
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/saite
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 25
    networks: [saite-net]
    depends_on: [db]

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: saite
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks: [saite-net]
    deploy: { resources: { limits: { memory: 2G } } }
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready']
      interval: 10s

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks: [saite-net]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    networks: [saite-net]

volumes:
  postgres_data:
  traefik_letsencrypt:
  minio_data:

networks:
  saite-net:
    driver: bridge
```

---

## ۲۳) Security Threat Model

### ۲۳.۱ تهدیدها و Mitigation

| # | تهدید | Risk | Likelihood | Impact | Mitigation | Test Strategy |
|---|---|---|---|---|---|---|
| 1 | **Cross-Tenant Data Leak** (IDOR) | Critical | High | Critical | RLS + Prisma Extension + Application-level filter | Test: User A از Tenant X سعی می‌کند به resource Tenant Y دسترسی پیدا کند |
| 2 | **Tenant ID Tampering** (URL/Header) | Critical | Medium | Critical | Tenant از Host header + DB lookup، نه از client input. RLS bypass نمی‌شود. | Test: تغییر URL با tenantId جعلی |
| 3 | **Host Header Attack** (fake Host) | High | Medium | High | فقط `Host` از request می‌خوانیم ولی با domain verification + چک در DB | Test: `Host: evil.com` ارسال شود |
| 4 | **Domain Takeover** | High | Low | Critical | TXT verification + Re-verify هر ۳۰ روز + DNS check | Test: TXT record حذف شود |
| 5 | **Privilege Escalation** (Tenant → Platform) | Critical | Low | Critical | Platform session و Tenant session کاملاً جدا. Cookie name متفاوت. | Test: سعی برای دسترسی به `/api/platform/*` با Tenant session |
| 6 | **Privilege Escalation** (User → Owner) | High | Medium | High | `TenantUser.role` در JWT و هر request چک می‌شود. RLS به‌عنوان defense. | Test: User با role=member سعی می‌کند کار admin انجام دهد |
| 7 | **Platform Admin Abuse** | High | Low | High | هر اقدام platform در audit log ثبت می‌شود. Impersonation با TTL کوتاه. | Test: Platform Admin بدون دلیل وارد Tenant می‌شود |
| 8 | **Cache Poisoning** (cross-tenant) | High | Medium | High | Cache key شامل `tenant:{id}:` prefix | Test: Tenant A محصولی cache می‌کند، Tenant B query می‌زند |
| 9 | **Storage Leakage** (S3) | High | Low | High | Object key شامل `tenants/{tenantId}/`. Signed URL با TTL. | Test: Tenant A سعی می‌کند URL Tenant B را دانلود کند |
| 10 | **Background Job Leakage** | Medium | Low | High | Worker با `withTenantContext(event.tenantId)` اجرا می‌شود. RLS enforce. | Test: Outbox event Tenant A توسط worker Tenant B پردازش شود |
| 11 | **Webhook Tenant Confusion** | Medium | Low | High | Webhook handler با lookup از `orderId` → `tenantId` → context | Test: Webhook برای Tenant A ارسال شود ولی Tenant B بگیرد |
| 12 | **JWT Tenant Confusion** | High | Low | Critical | JWT شامل `tenantId` claim. در هر request چک می‌شود. | Test: JWT Tenant A برای Tenant B استفاده شود |
| 13 | **SQL/ORM Access Bypass** | Critical | Low | Critical | RLS در سطح DB. حتی اگر Prisma query بنویسیم، DB enforce می‌کند. | Test: SQL injection attempt |
| 14 | **RLS Bypass** | Critical | Low | Critical | `FORCE ROW LEVEL SECURITY`. User اختصاصی `saite_app` (نه superuser). | Test: SET LOCAL app.bypass_tenant_isolation = 'on' بدون مجاز |
| 15 | **Cache Side-Channel** (timing) | Low | Low | Medium | Cache key تصادفی‌سازی prefix. Rate limit per tenant. | Performance test |
| 16 | **DDoS per Tenant** | Medium | Medium | Medium | Per-tenant rate limit + global rate limit. Cloudflare WAF. | Load test |
| 17 | **Billing Bypass** (modify subscription) | Critical | Medium | Critical | `subscription_service.update` فقط از admin route + RLS + audit log | Test: Direct DB write attempt |
| 18 | **Trial Abuse** (multiple tenants) | Medium | High | Medium | `TenantUser` per email. یک email یک trial. Verification. | Test: یک email چند tenant ثبت کند |
| 19 | **Data Exfiltration via Export** | Medium | Medium | High | Rate limit per tenant. Audit log برای export. Max file size. | Test: حلقه‌ای export کن |
| 20 | **Subdomain Takeover** | Medium | Low | Medium | DNS verification. Wildcard cert auto-renew. | Test: DNS را به IP دیگری redirect کن |

### ۲۳.۲ Security Audit Cadence
- **Daily:** Automated security scan (npm audit, snyk)
- **Weekly:** Manual code review برای tenant-aware enforcement
- **Monthly:** Penetration test (out-of-scope for MVP)
- **Quarterly:** External security audit

---

## ۲۴) Testing Strategy

### ۲۴.۱ Test Pyramid

```
                ┌────────────────────┐
                │   E2E Tests        │  Playwright
                │   (5% of tests)    │  ۱۰ تست
                └────────────────────┘
              ┌──────────────────────────┐
              │  Integration Tests       │  Vitest + real DB
              │  (20% of tests)          │  ~ ۱۰۰ تست
              └──────────────────────────┘
          ┌────────────────────────────────────┐
          │   Unit Tests                       │  Vitest
          │   (75% of tests)                   │  ~ ۵۰۰ تست
          └────────────────────────────────────┘
```

### ۲۴.۲ Tenant Isolation Test Suite (Critical)

```typescript
// tests/integration/tenant-isolation.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/server/shared/db';
import { tenantContext } from '@/server/tenants/tenant-context';
import { productsService } from '@/server/modules/products/service';

describe('Tenant Isolation', () => {
  let tenantA: string;
  let tenantB: string;

  beforeEach(async () => {
    // Setup two tenants
    const ta = await prisma.tenant.create({
      data: { id: 'ta_test', slug: 'ta', displayName: 'Tenant A', status: 'active', ownerEmail: 'a@test' },
    });
    const tb = await prisma.tenant.create({
      data: { id: 'tb_test', slug: 'tb', displayName: 'Tenant B', status: 'active', ownerEmail: 'b@test' },
    });
    tenantA = ta.id;
    tenantB = tb.id;
  });

  afterEach(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
  });

  it('should not allow Tenant A to read Tenant B products', async () => {
    // Create product in Tenant A
    await tenantContext.run({ tenantId: tenantA, tenantSlug: 'ta', source: 'test' }, async () => {
      await productsService.create({ /* ... */ tenantId: tenantA });
    });

    // Try to read from Tenant B context
    await tenantContext.run({ tenantId: tenantB, tenantSlug: 'tb', source: 'test' }, async () => {
      const result = await productsService.list({});
      expect(result.items).toHaveLength(0); // Should be empty due to RLS
    });
  });

  it('should not allow Tenant A to access Tenant B order by ID', async () => {
    // Create order in Tenant A
    const orderA = await tenantContext.run({ tenantId: tenantA, tenantSlug: 'ta', source: 'test' }, async () => {
      return await ordersService.create({ /* ... */ customerId: 'c_a', tenantId: tenantA });
    });

    // Try to read from Tenant B context
    await expect(
      tenantContext.run({ tenantId: tenantB, tenantSlug: 'tb', source: 'test' }, async () => {
        return await ordersService.getById(orderA.id);  // Should throw NotFound
      })
    ).rejects.toThrow();
  });

  // ... 20 تست مشابه
});
```

### ۲۴.۳ RLS Test
```typescript
it('should enforce RLS at DB level even without app filter', async () => {
  // Direct prisma call without tenant context
  // Should fail or return empty due to RLS
  const result = await prisma.product.findMany({
    where: { id: 'product_in_tenant_a' },
  });
  expect(result).toHaveLength(0);
});
```

### ۲۴.۴ API Isolation Test
```typescript
// tests/integration/api-isolation.test.ts
it('GET /api/products as Tenant A should not see Tenant B products', async () => {
  // Setup
  await setupProductInTenant(tenantA, 'Product A');
  await setupProductInTenant(tenantB, 'Product B');

  // Request as Tenant A (with x-tenant-id header)
  const res = await fetch('http://localhost:3000/api/products', {
    headers: { 'x-tenant-id': tenantA },
  });
  const data = await res.json();
  expect(data.items.every(p => p.name !== 'Product B')).toBe(true);
});
```

### ۲۴.۵ Platform Admin Access Test
```typescript
it('Platform admin can access any tenant via /api/platform/tenants/{id}', async () => {
  const token = await loginPlatformAdmin();
  const res = await fetch(`http://localhost:3000/api/platform/tenants/${tenantA}`, {
    headers: { 'Cookie': `saite_platform_session=${token}` },
  });
  expect(res.status).toBe(200);
});
```

### ۲۴.۶ Cache Isolation Test
```typescript
it('Cache key for Tenant A is not visible to Tenant B', async () => {
  await tenantContext.run({ tenantId: tenantA, ... }, async () => {
    await productsService.list({});  // populates cache
  });
  
  await tenantContext.run({ tenantId: tenantB, ... }, async () => {
    const result = await productsService.list({});
    // Should not return cached data from A
    expect(result.items).toHaveLength(0);
  });
  
  // Redis key check
  const keysA = await redis.keys(`tenant:${tenantA}:*`);
  const keysB = await redis.keys(`tenant:${tenantB}:*`);
  expect(keysA.length).toBeGreaterThan(0);
  expect(keysB.length).toBe(0);
});
```

### ۲۴.۷ Subscription Limit Test
```typescript
it('should reject product creation when quota exceeded', async () => {
  // Setup plan with maxProducts=2
  await setupPlanWithLimit(tenantA, 'maxProducts', 2);
  await setupActiveSubscription(tenantA, plan.id);
  
  await tenantContext.run({ tenantId: tenantA, ... }, async () => {
    await productsService.create({ ... });  // OK (1/2)
    await productsService.create({ ... });  // OK (2/2)
    
    await expect(
      productsService.create({ ... })  // Should throw QuotaExceededError
    ).rejects.toThrow('سقف محصول');
  });
});
```

### ۲۴.۸ Test Coverage Target
- Tenant Isolation: ۱۰۰% (همهٔ مسیرها)
- API Coverage: ۸۰%
- Business Logic: ۹۰%
- RLS Policies: ۱۰۰% (یک تست per policy)
- Cache: ۱۰۰% (tenant isolation)

---

## ۲۵) Scaling Strategy

### ۲۵.۱ 1–50 Tenants (فاز ۱)
- **VPS:** ۸GB RAM, ۴ vCPU, ۸۰GB SSD
- **App:** ۱ instance
- **Database:** Single PostgreSQL
- **Redis:** Single instance
- **Storage:** Local (با backup روزانه)
- **CDN:** Cloudflare رایگان
- **پیچیدگی:** پایین

**اولین Bottleneck:** PostgreSQL CPU هنگام گزارش‌های سنگین (Reports).

### ۲۵.۲ ۵۰–۵۰۰ Tenants (فاز ۲)
- **VPS:** ۱۶GB RAM, ۸ vCPU
- **App:** ۲ instance (با shared session در Redis)
- **Database:** PostgreSQL + ۱ Read Replica (برای گزارش‌ها)
- **PgBouncer:** اضافه شود
- **Redis:** ۱GB
- **Storage:** S3-compatible (ArvanCloud)
- **CDN:** Cloudflare Pro

**اولین Bottleneck:** Disk I/O برای media.

### ۲۵.۳ ۵۰۰–۵,۰۰۰ Tenants (فاز ۳)
- **VPS:** ۳۲GB RAM, ۱۶ vCPU, NVMe SSD
- **App:** ۳-۵ instance (auto-scaling)
- **Database:** PostgreSQL + ۲ Read Replica + PgBouncer + Connection Pool
- **Redis:** Redis Cluster (۳ node)
- **Storage:** S3 با lifecycle policy
- **CDN:** Cloudflare Enterprise
- **Partitioning:** `PARTITION BY HASH (tenant_id)` روی جداول بزرگ

**اولین Bottleneck:** PostgreSQL Query Plan (full-table-scan).

### ۲۵.۴ ۵,۰۰۰+ Tenants (فاز ۴)
- **Infrastructure:** K3s cluster
- **Database:** Managed (RDS / Cloud SQL) + شاید Schema-per-Tenant
- **Microservices:** (اختیاری) Product Service، Order Service، Billing Service
- **Event Bus:** Kafka
- **Multi-region:** (اختیاری) EU + US + Asia

**اولین Bottleneck:** Connection Limit (PostgreSQL max_connections).

### ۲۵.۵ تخمین منابع (HUMAN DECISION REQUIRED)
اعداد زیر **تخمینی** هستند و باید بر اساس benchmark واقعی تأیید شوند:

| Tenant Count | DB Size (GB) | RAM (GB) | vCPU | Network (TB/yr) |
|---|---|---|---|---|
| ۱۰ | ۱ | ۴ | ۲ | ۰.۱ |
| ۱۰۰ | ۱۰ | ۸ | ۴ | ۱ |
| ۱,۰۰۰ | ۱۰۰ | ۱۶ | ۸ | ۱۰ |
| ۱۰,۰۰۰ | ۱,۰۰۰ | ۳۲+ | ۱۶+ | ۱۰۰+ |

**NOT VERIFIED:** این اعداد بر اساس industry-standard SaaS benchmarks هستند، نه benchmark واقعی Saite.

---

## ۲۶) Zero-Downtime Migration

### ۲۶.۱ استراتژی

```
┌──────────────────────────────────────────────────────────┐
│             Zero-Downtime Migration Phases                │
└──────────────────────────────────────────────────────────┘

Phase 1: آماده‌سازی (هفته ۱)
  - جداول سراسری: Tenant, User, TenantUser, Plan, Subscription, Domain, PlatformAdmin
  - هیچ تغییر در جداول موجود
  - APP: بدون تغییر
  - Downtime: ۰

Phase 2: tenantId Nullable (هفته ۲)
  - ALTER TABLE: ADD COLUMN tenantId (NULL)
  - APP: هنوز tenant filter نمی‌زند
  - Downtime: ۰
  - Risk: صفر (فقط اضافه شدن ستون)

Phase 3: Backfill (هفته ۲)
  - INSERT default tenant
  - UPDATE تمام ردیف‌ها: tenantId = 't_default'
  - APP: هنوز tenant filter نمی‌زند
  - Downtime: ۰
  - Risk: صفر (default tenant، ردیف‌ها هنوز global قابل دسترس)

Phase 4: Validation (هفته ۲)
  - بررسی: تمام ردیف‌ها tenantId دارند
  - Count: SELECT COUNT(*) FROM products WHERE tenantId IS NULL → باید ۰
  - Downtime: ۰

Phase 5: NOT NULL Constraint (هفته ۳)
  - ALTER TABLE: SET NOT NULL
  - APP: هنوز tenant filter نمی‌زند ولی حالا هر INSERT باید tenantId بدهد
  - Downtime: ۰
  - Risk: متوسط (اگر کد بدون tenantId insert کند، خطا می‌دهد)
  - Mitigation: Prisma client هنوز تغییر نکرده ولی در حالت type-check error می‌دهد

Phase 6: Composite Indexes (هفته ۳)
  - CREATE INDEX CONCURRENTLY (non-blocking)
  - Downtime: ۰

Phase 7: Unique Constraint Changes (هفته ۳)
  - DROP old unique + ADD new composite unique
  - Downtime: ~ ۱-۵ دقیقه (database-level lock)
  - Mitigation: در ساعات کم‌ترافیک
  - Risk: اگر conflict در داده‌ها باشد، migration fail می‌شود

Phase 8: فعال‌سازی Application-level Tenant Filter (هفته ۴)
  - Prisma Client Extension فعال
  - withTenantContext wrapper
  - RLS هنوز OFF
  - APP: tenant filter در app level
  - Downtime: ۰ (rolling deploy)
  - Risk: اگر query جا بماند، leak رخ می‌دهد ولی دیتا هنوز safe است

Phase 9: فعال‌سازی RLS (هفته ۴)
  - ALTER TABLE ENABLE ROW LEVEL SECURITY
  - FORCE ROW LEVEL SECURITY
  - CREATE POLICIES
  - APP: RLS enforce
  - Downtime: ~ ۱-۵ دقیقه (RLS activate)
  - Risk: بالا — اگر یک policy اشتباه باشد، queryها fail می‌شوند
  - Mitigation: تست در staging با copy production data

Phase 10: حذف Legacy (هفته ۵)
  - حذف default tenant
  - حذف migration script
  - APP: تمام tenantها explicit هستند
  - Downtime: ۰
```

### ۲۶.۲ Timeline کلی
- **هفته ۱:** Phase 1 (جداول جدید)
- **هفته ۲:** Phase 2-4 (tenantId + backfill)
- **هفته ۳:** Phase 5-7 (NOT NULL + Index + Unique)
- **هفته ۴:** Phase 8-9 (Application + RLS)
- **هفته ۵:** Phase 10 (Cleanup)

**حداکثر Downtime: ~ ۱۰ دقیقه** (مجموع Phase 7 + 9 در ساعات کم‌ترافیک)

---

## ۲۷) Rollback Strategy

### ۲۷.۱ هر Phase باید Rollback داشته باشد

```sql
-- Phase 2 Rollback
ALTER TABLE "products" DROP COLUMN "tenantId";

-- Phase 3 Rollback
DELETE FROM "subscriptions" WHERE "tenantId" = 't_default_legacy';
DELETE FROM "tenant_users" WHERE "tenantId" = 't_default_legacy';
DELETE FROM "tenants" WHERE "id" = 't_default_legacy';
UPDATE "products" SET "tenantId" = NULL;

-- Phase 5 Rollback
ALTER TABLE "products" ALTER COLUMN "tenantId" DROP NOT NULL;

-- Phase 6 Rollback
DROP INDEX CONCURRENTLY IF EXISTS "products_tenantId_createdAt_idx";

-- Phase 7 Rollback
ALTER TABLE "products" DROP CONSTRAINT "products_tenantId_slug_key";
ALTER TABLE "products" ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");

-- Phase 8 Rollback
-- Revert Prisma Client Extension code
-- Revert withTenantContext wrapper

-- Phase 9 Rollback
ALTER TABLE "products" DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_tenant_isolation" ON "products";
DROP POLICY IF EXISTS "products_platform_bypass" ON "products";
```

### ۲۷.۲ Backup قبل از Migration
```bash
# هر migration قبل از deploy:
pg_dump -Fc -d saite_prod -f /backup/pre_migration_$(date +%Y%m%d_%H%M%S).dump

# در صورت rollback:
pg_restore -d saite_prod --clean --if-exists /backup/pre_migration_*.dump
```

### ۲۷.۳ Monitoring Rollback
- در ۲۴ ساعت اول پس از migration: alert روی هر خطای RLS
- در ۷۲ ساعت اول: مقایسهٔ query time با baseline
- اگر error rate > 1% → rollback فوری

---

## ۲۸) ADRs (Architecture Decision Records)

### ADR-001: Multi-Tenancy Model

**Context:** پروژه باید از Single-Tenant به Multi-Tenant SaaS تبدیل شود. ۴ مدل اصلی وجود دارد: Shared DB, Schema-per-Tenant, DB-per-Tenant, Hybrid.

**Options:**
- A. Shared DB + tenant_id
- B. Shared DB + Schema per Tenant
- C. DB per Tenant
- D. Hybrid

**Decision:** **A (Shared DB + tenant_id + RLS)**

**Reason:**
- سازگاری کامل با Prisma 6 + PgBouncer
- هزینهٔ عملیاتی پایین
- Migration ساده
- در ۱–۵,۰۰۰ Tenant کارایی کافی
- می‌توان در آینده به Schema-per-Tenant مهاجرت کرد

**Consequences:**
- (+) ساده، سریع، کم‌هزینه
- (-) نیاز به RLS برای defense-in-depth
- (-) اگر Prisma Extension جا بماند، نشت داده رخ می‌دهد

### ADR-002: Tenant Resolution

**Context:** Tenant باید از request شناسایی شود.

**Options:**
- A. از Host header
- B. از URL path
- C. از JWT claim
- D. ترکیبی

**Decision:** **A (Host header) + C (JWT) به‌عنوان cross-check**

**Reason:**
- Host header طبیعی‌ترین است (custom domain)
- JWT به‌عنوان تأیید ثانویه (اگر host مشکوک باشد)
- URL path با SEO و share کردن لینک سازگار نیست

**Consequences:**
- (+) هر tenant URL مستقل
- (-) Traefik reverse proxy لازم است

### ADR-003: Database Isolation

**Context:** سطح ایزولاسیون داده‌ها در Multi-Tenant.

**Options:**
- A. Application-level filter
- B. Database RLS
- C. هردو

**Decision:** **C (هردو)**

**Reason:**
- Application-level: سریع، debugging آسان
- RLS: defense-in-depth، مستقل از کد

**Consequences:**
- (+) امنیت بالا
- (-) پیچیدگی بیشتر
- (-) Prisma + RLS testing نیاز به دقت دارد

### ADR-004: PostgreSQL RLS

**Context:** آیا RLS فعال شود؟

**Decision:** **بله، با FORCE ROW LEVEL SECURITY و user اختصاصی `saite_app`**

**Reason:**
- مستقل از Application code
- حتی اگر ORM query اشتباه بنویسد، DB محافظت می‌کند
- Performance overhead قابل‌چشم‌پوشی (با Index مناسب)

**Consequences:**
- (+) Defense in depth
- (-) Migration scripts باید bypass داشته باشند
- (-) Seed scripts باید bypass داشته باشند
- (-) Background workers باید tenant context تنظیم کنند

### ADR-005: Authentication/Tenant Context

**Context:** Session Token چگونه Tenant را نگه دارد؟

**Decision:** **JWT با tenantId claim، verified در هر request، + Host header cross-check**

**Reason:**
- JWT stateless، scalable
- tenantId در token برای سرعت
- Host cross-check برای defense

**Consequences:**
- (+) Stateless، scale-friendly
- (-) Token revocation سخت (مگر با `ver` claim)
- (-) اگر User در چند Tenant باشد، complexity

### ADR-006: Custom Domains

**Context:** معماری Custom Domain.

**Options:**
- A. nginx + certbot
- B. Traefik + ACME DNS-01
- C. Caddy

**Decision:** **B (Traefik)**

**Reason:**
- Auto-renew certs
- Docker Compose integration
- Let's Encrypt DNS-01 challenge (برای wildcard)
- بدون downtime reload

**Consequences:**
- (+) Standard، reliable
- (-) نیاز به DNS provider API (Cloudflare/ArvanCloud)

### ADR-007: Subscription Architecture

**Context:** مدل اشتراک چگونه باشد؟

**Decision:** **Plan (JSON features/limits) + Subscription (status + period) + QuotaEnforcer (backend)**

**Reason:**
- Plan JSON برای flexibility
- Quota Enforcer در backend (نه UI)
- Webhook از درگاه پرداخت

**Consequences:**
- (+) انعطاف بالا
- (-) Plan validation نیاز به JSON Schema

### ADR-008: File Storage

**Context:** کجا فایل ذخیره شود؟

**Options:**
- A. Local disk
- B. S3-compatible (ArvanCloud)
- C. MinIO

**Decision:** **A برای فاز ۱، C یا B برای فاز ۲+**

**Reason:**
- Local: ساده، برای ۱-۵۰ tenant کافی
- S3/MinIO: برای scale و backup

**Consequences:**
- (+) Migration path روشن
- (-) دو storage provider باید پشتیبانی شود

### ADR-009: Cache Isolation

**Context:** Cache key چگونه باشد؟

**Decision:** **`tenant:{tenantId}:{resource}:{key}` prefix، با invalidation per tenant**

**Reason:**
- ساده، explicit
- Redis SCAN برای invalidation

**Consequences:**
- (+) ایزولاسیون قطعی
- (-) Invalidation pattern-based می‌تواند کند باشد

### ADR-010: Scaling Strategy

**Context:** مسیر scale چگونه باشد؟

**Decision:** **Phase 1-2: Vertical scaling، Phase 3-4: Horizontal (PgBouncer + Read Replica + Multi-instance App + Partitioning)**

**Reason:**
- در ۱-۵۰۰ tenant، vertical کافی است
- در ۵۰۰+ نیاز به horizontal

**Consequences:**
- (+) Cost-effective در ابتدا
- (-) در آینده نیاز به re-architecture (partitioning)

---

## ۲۹) Implementation Roadmap

### Phase 0: Architecture Preparation (هفته ۱)
**هدف:** بدون تغییر رفتار، جداول زیرساخت ساخته شوند
- ✅ Migration 1: Tenant, User, TenantUser, Plan, Subscription, Domain, PlatformAdmin, PlatformAuditLog
- ✅ فایل‌های `src/server/tenants/` (ساختار خالی)
- ✅ فایل‌های `src/server/platform/` (ساختار خالی)
- ✅ Default Platform Admin seed
- ✅ Plan 'legacy' (با features/limits = unlimited) seed

**ریسک:** پایین
**وابستگی:** بدون

### Phase 1: Tenant Foundation (هفته ۲)
- ✅ Migration 2: tenantId nullable در ۲۳ مدل
- ✅ Migration 3: backfill default tenant
- ✅ `src/server/tenants/tenant-context.ts` (ALS)
- ✅ `src/server/tenants/tenant-resolver.ts` (Host → tenantId)
- ✅ `src/server/tenants/with-tenant-context.ts` (wrapper)
- ✅ تغییرات `src/proxy.ts` (افزودن resolveTenantFromHost)

**ریسک:** پایین (فقط ALS، هنوز enforcement نیست)
**وابستگی:** Phase 0

### Phase 2: Database Multi-Tenancy (هفته ۳)
- ✅ Migration 4: composite unique constraints
- ✅ Migration 5: NOT NULL constraints
- ✅ Migration 6: composite indexes
- ✅ `src/server/shared/db.ts` (Prisma Client Extension)
- ✅ `withTenantContext` در تمام Repositoryها (نه فقط API)
- ✅ تست: تمام queries با tenantId filter

**ریسک:** بالا (اگر یک query جا بماند → data leak)
**وابستگی:** Phase 1

### Phase 3: Tenant Isolation & RLS (هفته ۴)
- ✅ Migration 7: ENABLE + FORCE ROW LEVEL SECURITY
- ✅ Policies برای همهٔ ۲۳ مدل
- ✅ `SET LOCAL app.current_tenant_id` در Prisma transactions
- ✅ تست RLS در سطح DB
- ✅ Bypass برای Platform Admin

**ریسک:** بالا (RLS policies باید کامل باشند)
**وابستگی:** Phase 2

### Phase 4: Authentication & Authorization (هفته ۵)
- ✅ `src/lib/auth/server/session-token.ts` تغییر: افزودن `tenantId`/`tenantRole`
- ✅ `src/lib/auth/server/platform-session.ts` (جدید)
- ✅ `src/lib/auth/server/tenant-guard.ts` (جدید)
- ✅ `src/lib/auth/server/require-platform.ts` (جدید)
- ✅ `src/lib/auth/server/customer-session.ts` افزودن tenantId
- ✅ Login flow بازنویسی: Platform vs Tenant

**ریسک:** متوسط (auth flow حساس)
**وابستگی:** Phase 1

### Phase 5: Platform Admin (هفته ۶-۷)
- ✅ Platform Admin UI: `src/app/admin/platform/*`
- ✅ Platform Admin API: `src/app/api/platform/*`
- ✅ Tenants list/CRUD
- ✅ Plans CRUD
- ✅ Subscriptions management
- ✅ Audit log UI

**ریسک:** متوسط
**وابستگی:** Phase 4

### Phase 6: Tenant Admin (هفته ۸)
- ✅ User/TenantUser invite flow
- ✅ Tenant Admin login flow (موجود RBAC + tenantId)
- ✅ Tenant switcher (برای multi-tenant user)
- ✅ Tenant settings UI (دامنه، plan info)

**ریسک:** پایین
**وابستگی:** Phase 4

### Phase 7: Custom Domains (هفته ۹-۱۰)
- ✅ Traefik migration (nginx → Traefik)
- ✅ DNS-01 challenge setup (Cloudflare API)
- ✅ Domain verification service
- ✅ ACME cert provisioning
- ✅ Wildcard platform.com cert
- ✅ Custom domain UI در Tenant Admin

**ریسک:** متوسط (DNS propagation)
**وابستگی:** Phase 0

### Phase 8: Plans & Subscriptions (هفته ۱۱-۱۲)
- ✅ `src/server/subscriptions/` (service, quota-enforcer, feature-gate)
- ✅ Billing webhook handler
- ✅ Plan upgrade/downgrade flow
- ✅ Trial period logic
- ✅ Grace period logic
- ✅ Auto-suspend cron

**ریسک:** متوسط (billing پیچیده)
**وابستگی:** Phase 5

### Phase 9: Storage & Cache Isolation (هفته ۱۳)
- ✅ Storage path per tenant (local + S3)
- ✅ Cache key prefix per tenant
- ✅ Rate limit per tenant
- ✅ Signed URLs

**ریسک:** پایین
**وابستگی:** Phase 1

### Phase 10: Migration of Existing Data (هفته ۱۴)
- ✅ Production data backfill verification
- ✅ Plan 'legacy' (unlimited) برای tenant پیش‌فرض
- ✅ Default Admin user به Tenant owner

**ریسک:** پایین (اگر Phase 2 موفق بوده)
**وابستگی:** Phase 2

### Phase 11: Security Hardening (هفته ۱۵)
- ✅ Tenant Isolation Test Suite
- ✅ IDOR Tests
- ✅ RLS Tests
- ✅ Penetration Test (out-of-scope MVP)
- ✅ CSP برای مسیرهای platform
- ✅ Audit log per Platform Admin

**ریسک:** بالا (اگر تست‌ها fail شوند)
**وابستگی:** Phase 3, 5

### Phase 12: Testing (هفته ۱۶)
- ✅ E2E: Multi-tenant scenarios
- ✅ E2E: Custom domain flow
- ✅ E2E: Subscription upgrade
- ✅ Load test: ۱۰۰ concurrent tenants

**ریسک:** متوسط
**وابستگی:** Phase 8, 9

### Phase 13: Production Deployment (هفته ۱۷)
- ✅ docker-compose.prod.yml بازنویسی
- ✅ Traefik config
- ✅ PgBouncer
- ✅ MinIO
- ✅ SSL certs
- ✅ Backup automation
- ✅ Monitoring (Prometheus + Grafana)

**ریسک:** متوسط
**وابستگی:** Phase 7, 12

### Phase 14: Scaling (هفته ۱۸+)
- ✅ Read Replica (در ۱۰۰+ tenant)
- ✅ Multi-instance App (در ۲۰۰+ tenant)
- ✅ Redis Cluster (در ۵۰۰+ tenant)
- ✅ Partitioning (در ۱,۰۰۰+ tenant)

**ریسک:** متغیر

### تغییر ترتیب (پیشنهاد)
ترتیب فعلی **مناسب است** اما **Phase 7 (Custom Domains)** باید زودتر انجام شود اگر Traefik migration زمان‌بر باشد. دلیل: Traefik یک تغییر زیرساختی بزرگ است و اگر در production شکست بخورد، بازگشت سخت است.

**پیشنهاد اصلاح‌شده:**
- Phase 1.5: Traefik Migration (موازی با Phase 1)
- سپس Phase 7 → Phase 1.5

---

## ۳۰) Risk Register

| # | ریسک | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | **RLS policy اشتباه → query fail** | Medium | Critical | تست کامل در staging قبل از production. Rollback سریع با `DISABLE ROW LEVEL SECURITY`. | Backend Lead |
| R2 | **Prisma Client Extension bug → data leak** | Medium | Critical | Audit ماهانه. RLS به‌عنوان defense. تست RLS در test suite. | Backend Lead |
| R3 | **Migration backfill ناقص** | Low | High | Pre-migration: `SELECT COUNT(*) WHERE tenantId IS NULL` باید ۰ باشد. | DBA |
| R4 | **DNS propagation slow** | Medium | Medium | TTL پایین (300s). Wildcard cert قبل از subdomain. | DevOps |
| R5 | **Traefik misconfig** | Medium | High | تست در staging. Blue-green deploy. | DevOps |
| R6 | **Multi-tenant test coverage ناقص** | High | Critical | Phase 11 اجباری. هر query باید تست tenant isolation داشته باشد. | QA |
| R7 | **JWT token size بزرگ** | Low | Low | Minify payload. حذف claims غیرضروری. | Backend |
| R8 | **PgBouncer + prepared statements** | Medium | Medium | استفاده از `transaction` mode (نه `session`). | DevOps |
| R9 | **Customer session interference** | Low | High | Cookie name متفاوت per scope. Path scope متفاوت. | Backend |
| R10 | **Backup data size grows** | Medium | Medium | Per-tenant backup. S3 lifecycle policy. | DevOps |
| R11 | **Billing webhook duplicate** | Medium | Medium | IdempotencyKey در `ProcessedWebhook` table. | Backend |
| R12 | **SSL cert renewal fail** | Low | Critical | Traefik auto-retry. Monitoring cert expiration. | DevOps |
| R13 | **Domain hijacking** | Low | Critical | TXT verification. Re-verify هر ۳۰ روز. | Security |
| R14 | **Platform Admin credential leak** | Low | Critical | TOTP اجباری برای super_admin. Audit log. | Security |
| R15 | **Customer با چند Tenant → confusion** | Medium | Low | UI با Tenant switcher واضح. آخرین tenant در cookie. | Frontend |

---

## ۳۱) Definition of Done

اگر تمام این checkboxها پر باشند، Saite واقعاً Multi-Tenant SaaS-Ready است:

### Tenant Isolation
- [ ] تمام ۲۳ مدل Prisma دارای `tenantId` و FK به `Tenant`
- [ ] تمام Repositoryها از `tenantContext` استفاده می‌کنند
- [ ] تمام API Route Handlers با `withTenantContext` wrap شده‌اند
- [ ] Prisma Client Extension به‌صورت سراسری tenant filter می‌زند
- [ ] تست IDOR: ۱۰۰% پاس می‌شود

### Database Isolation
- [ ] PostgreSQL RLS روی همهٔ ۲۳ مدل فعال است
- [ ] `FORCE ROW LEVEL SECURITY` تنظیم شده
- [ ] User اختصاصی `saite_app` (نه superuser) استفاده می‌شود
- [ ] Policies برای هر مدل نوشته شده
- [ ] تست RLS: ۱۰۰% پاس

### Tenant Resolution
- [ ] Custom domain → Tenant در proxy.ts کار می‌کند
- [ ] Subdomain → Tenant کار می‌کند
- [ ] Unknown host → 404
- [ ] Suspended Tenant → 503
- [ ] Archived Tenant → 410

### Custom Domains
- [ ] Let's Encrypt cert per-domain auto-issue
- [ ] DNS-01 challenge کار می‌کند
- [ ] Cert auto-renew
- [ ] TXT verification flow کار می‌کند
- [ ] Domain deletion کار می‌کند

### Platform Admin
- [ ] Platform login flow مستقل از Tenant
- [ ] Platform session cookie isolated
- [ ] Platform APIs prefix `/api/platform/*`
- [ ] Platform UI در `/admin/platform/*`
- [ ] Audit log برای هر اقدام

### Tenant Admin
- [ ] Tenant Admin login flow
- [ ] Multi-tenant user (N:N) support
- [ ] RBAC سه‌سطحی + Tenant role
- [ ] Tenant Switcher

### Subscription & Plans
- [ ] Plan CRUD در Platform Admin
- [ ] Quota Enforcement در Backend (نه UI)
- [ ] Feature Gating
- [ ] Trial period
- [ ] Grace period
- [ ] Auto-suspend
- [ ] Webhook idempotency

### Cache & Storage
- [ ] Cache key prefix per tenant
- [ ] Storage path per tenant
- [ ] Signed URLs با TTL
- [ ] Rate limit per tenant

### Security
- [ ] Tenant IDOR Tests پاس
- [ ] RLS Tests پاس
- [ ] Cache isolation Tests پاس
- [ ] Cross-tenant access Tests پاس
- [ ] Penetration test (اگر بودجه باشد)

### Migration & Rollback
- [ ] Zero-downtime migration تست شد
- [ ] Rollback تست شد
- [ ] Pre/post migration verification scripts

### Performance
- [ ] Load test: ۱۰۰ concurrent tenants بدون خطا
- [ ] Response time p95 < 500ms
- [ ] DB CPU < 70% در load

### Documentation
- [ ] ADRs برای همهٔ تصمیمات کلیدی
- [ ] Runbook برای Platform Admin
- [ ] Runbook برای Tenant Onboarding
- [ ] Disaster Recovery Plan

---

## Repository Coverage

### فایل‌های بررسی‌شده (دقیق)
- ✅ `prisma/schema.prisma` (۵۸۶ خط، ۲۳ مدل)
- ✅ `prisma/migrations/20260809000000_init/migration.sql`
- ✅ `prisma/migrations/20260814000001_add_composite_indexes/migration.sql`
- ✅ `prisma/seed.ts`
- ✅ `src/proxy.ts` (۱۶۶ خط)
- ✅ `src/lib/security-headers.ts` (۲۷۴ خط)
- ✅ `src/lib/auth/rbac.ts` (۱۷۷ خط)
- ✅ `src/lib/auth/server/session-token.ts` (۱۳۱ خط)
- ✅ `src/lib/auth/server/session-token-core.ts` (۵۶ خط)
- ✅ `src/lib/auth/server/admin-session.ts` (۱۱۰ خط)
- ✅ `src/lib/auth/server/admin-secret.ts`
- ✅ `src/lib/auth/server/require-role.ts` (۱۱۱ خط)
- ✅ `src/lib/auth/server/customer-session.ts` (referenced)
- ✅ `src/lib/auth/customer-scope.ts` (۱۶ خط)
- ✅ `src/server/shared/db.ts` (۳۵ خط)
- ✅ `src/server/shared/cache.ts` (partial)
- ✅ `src/server/shared/event-bus.ts`
- ✅ `src/server/shared/event-types.ts`
- ✅ `src/server/modules/products/repository.ts` (۲۱۸ خط)
- ✅ `src/server/modules/orders/repository.ts` (۷۳ خط)
- ✅ `src/server/modules/inventory/repository.ts` (۱۲۵ خط)
- ✅ `src/server/modules/finance/repository.ts` (۱۵۱ خط)
- ✅ `src/server/modules/marketing/repository.ts` (۱۴۹ خط)
- ✅ `src/server/modules/shipping/repository.ts` (۱۳۶ خط)
- ✅ `src/server/modules/content/repository.ts` (۱۴۹ خط)
- ✅ `src/server/modules/orders/service.ts` (۱۸۳ خط)
- ✅ `src/server/modules/orders/state-machine.ts` (۲۷ خط)
- ✅ `src/app/api/products/route.ts` (۹۸ خط)
- ✅ `src/app/api/products/[id]/route.ts` (۵۰ خط)
- ✅ `src/app/api/orders/route.ts` (۴۳ خط)
- ✅ `src/app/api/orders/[id]/route.ts` (۵۴ خط)
- ✅ `src/app/api/inventory/route.ts`
- ✅ `src/app/api/inventory/alerts/route.ts`
- ✅ `src/app/api/customers/session/route.ts` (۱۰۶ خط)
- ✅ `src/app/api/admin/products/seo/generate/route.ts` (۱۴۰ خط)
- ✅ `src/app/api/upload/route.ts` (partial)
- ✅ `src/app/admin/(panel)/layout.tsx` (۵۵ خط)
- ✅ `src/app/admin/layout.tsx` (۲۷ خط)
- ✅ `src/app/admin/api/session/route.ts` (۲۸۹ خط)
- ✅ `src/app/admin/(panel)/finance/subscriptions/page.tsx`
- ✅ `src/components/admin/admin-shell.tsx`
- ✅ `src/components/admin/admin-sidebar.tsx`
- ✅ `src/components/admin/finance/subscriptions-client.tsx` (۲۰۲ خط)
- ✅ `src/lib/admin/nav.ts` (partial)
- ✅ `next.config.ts` (۷۱ خط)
- ✅ `Dockerfile` (۵۱ خط)
- ✅ `docker-compose.prod.yml` (۱۷۸ خط)
- ✅ `docker-compose.dev.yml` (۵۴ خط)
- ✅ `nginx/nginx.conf` (full)
- ✅ `.env.example` (۱۸۴ خط)
- ✅ `package.json`
- ✅ `SAAS_READINESS_AUDIT.md` (۹۸۴ خط — مطالعه شد)

### پوشه‌های بررسی‌شده
- ✅ `prisma/` (schema, migrations, seed)
- ✅ `src/proxy.ts`
- ✅ `src/lib/auth/` (تمام فایل‌ها)
- ✅ `src/lib/security-headers.ts`
- ✅ `src/lib/admin/`
- ✅ `src/server/shared/`
- ✅ `src/server/modules/` (تمام ۷ ماژول)
- ✅ `src/server/auth/`
- ✅ `src/server/payments/` (referenced)
- ✅ `src/server/jobs/` (queues, workers, dispatchers)
- ✅ `src/app/api/` (اکثر route handlers)
- ✅ `src/app/admin/(panel)/` (samples)
- ✅ `src/components/admin/`
- ✅ `nginx/`
- ✅ `docker-compose*.yml`
- ✅ `Dockerfile`

### Schema کامل بررسی شد؟
✅ **بله** — تمام ۲۳ مدل + ایندکس‌ها + روابط + enums بررسی شدند.

### APIها کامل بررسی شدند؟
⚠️ **تقریباً** — حدود ۷۰% از route handlers (عمده + چند edge case). برخی فایل‌های route فقط header دیده شدند.

### Authentication کامل بررسی شد؟
✅ **بله** — RBAC، Session Token (admin و customer)، TOTP، Rate Limit، Audit Log.

### Infrastructure کامل بررسی شد؟
✅ **بله** — Docker، nginx، Certbot، Health checks.

### بخش‌های بررسی‌نشده یا جزئی
- ⚠️ `tests/` (۱۱۴ فایل) — فقط برای یافتن tenant search شد، نه بررسی عمیق
- ⚠️ `e2e/` (۵ فایل) — فقط header دیده شد
- ⚠️ `src/components/` (client components) — برخی Zustand stores
- ⚠️ `src/server/ai/` (AI features) — برای SaaS تأثیر کم
- ⚠️ `src/server/upload/providers/` — local + s3 فقط
- ⚠️ `src/server/communications/providers/` — فقط console
- ⚠️ `prisma/migrations/2026*.sql` — فقط header فایل‌ها بررسی شد، content عمیق نه
- ⚠️ چندین فایل component کلاینتی بزرگ (`src/components/admin/*`)

### محدودیت‌های Audit
1. **Performance Benchmark:** اندازه‌گیری واقعی query time در ۱۰۰۰ tenant انجام نشد.
2. **Load Test:** Load test واقعی روی ۱۰۰ concurrent tenant انجام نشد.
3. **Security Penetration Test:** Penetration test خارجی انجام نشد.
4. **UI/UX Review:** Frontend components از نظر UX بررسی نشدند.
5. **Documentation Review:** ۲۹ سند در `docs/` فقط برای tenant search شدند.

### توصیه برای مرحلهٔ بعد
پس از تأیید این Blueprint، قبل از شروع پیاده‌سازی:
1. **POC (Proof of Concept):** یک Tenant با یک محصول در شاخهٔ جدا، با RLS فعال
2. **Performance Baseline:** Load test با ۱۰ Tenant برای baseline
3. **Stakeholder Review:** با Platform Owner برای تأیید تصمیمات

---

**Report Created:** SAAS_ARCHITECTURE_BLUEPRINT.md
