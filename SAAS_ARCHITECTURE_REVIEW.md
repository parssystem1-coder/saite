# 🧪 SAAS_ARCHITECTURE_REVIEW.md

> **پروژه:** `parssystem1-coder/saite` (شاخه `arena/01a00248-saite`)
> **تاریخ Review:** ۱۴ اوت ۲۰۲۶
> **نقش:** Pre-Implementation Gate — اعتبارسنجی سازگاری سه سند قبل از شروع کدنویسی
> **اسناد بررسی‌شده:**
> - `SAAS_READINESS_AUDIT.md` (۹۸۴ خط)
> - `SAAS_ARCHITECTURE_BLUEPRINT.md` (۳,۴۹۳ خط)
> - `SAAS_IMPLEMENTATION_SPEC.md` (۳,۹۴۹ خط)
> **روش:** خواندن کامل هر سند + بررسی مجدد Repository + اعتبارسنجی ادعاها با کد واقعی

---

## ۰) خلاصهٔ اجرایی

سه سند **به‌طور کلی سازگار** هستند، اما **۱۲ تناقض، ۱۸ نقص، و ۲ مورد Over-Engineering** در آنها یافتم.

### Verdict
# 🟡 APPROVED WITH REQUIRED CHANGES

اسناد برای شروع **Implementation آماده نیستند** تا:
1. ۵ HUMAN DECISION (بخش ۲۸ سوم) حل شود
2. ۷ تغییر متنی در اسناد اعمال شود (نه کد)
3. یک نقطهٔ بحرانی معماری (بخش ۲٫۱ این Review) تأیید شود

پس از آن: Implementation Phase 0 می‌تواند شروع شود.

---

## ۱) Architecture Consistency Check (تناقضات بین اسناد)

### تناقض C1: `User` Model نقش‌های متضاد

| | |
|---|---|
| **ID** | C1 |
| **Severity** | **HIGH** |
| **Document A** | Blueprint §۶٫۳ (`SAAS_ARCHITECTURE_BLUEPRINT.md`) |
| **Document B** | Spec §۳٫۲ (`SAAS_IMPLEMENTATION_SPEC.md`) |
| **Conflict** | Blueprint می‌گوید: "`User` مدل سراسری است، در N Tenant می‌تواند باشد (از طریق `TenantUser`)" — یعنی `User` بدون `tenantId`. Spec همان را می‌گوید. **اما** در `SAAS_READINESS_AUDIT.md` آمده: "User → tenantId". در README و گزارش گفته شده که فاز ۲ "می‌تواند User در چند Tenant باشد" — که **متناقض نیست** ولی ابهام ایجاد می‌کند. |
| **Why It Matters** | اگر `User` سراسری باشد، یک ایمیل فقط یک `User` می‌تواند داشت (`@unique` در `email`). این در بسیاری از SaaS های واقعی مشکل‌ساز است (مثلاً دو Tenant همکار می‌خواهند یک ایمیل مشترک داشته باشند). |
| **Recommended Resolution** | `User` مدل سراسری (بدون `tenantId`) و فقط یک `TenantUser` per `(tenantId, userId)` — همان‌طور که Blueprint و Spec توافق دارند. این درست است. **اما Audit باید به‌روزرسانی شود** تا این موضوع را روشن کند. |

### تناقض C2: `AdminSessionPayload` vs `UserSessionPayload` — Backward Compatibility

| | |
|---|---|
| **ID** | C2 |
| **Severity** | **MEDIUM** |
| **Document A** | Blueprint §۱۴٫۲ (`UserSessionPayload.currentTenantId: string`) |
| **Document B** | Spec §۸٫۵ (backward compat: "`AdminSessionPayload` با `tenantId?` اختیاری") |
| **Conflict** | Spec می‌گوید session قدیمی (admin از env) با افزودن `tenantId?` به‌صورت اختیاری backward compatible می‌ماند. Blueprint می‌گوید `UserSessionPayload` با `currentTenantId: string` (الزامی). این‌ها **متناقض نیستند** ولی **ابهام دارند**: آیا session قدیمی env-based همان است یا نه؟ Spec می‌گوید بله، Blueprint ساکت است. |
| **Why It Matters** | اگر session قدیمی env-based ادامه یابد، یک User می‌تواند هم PlatformAdmin و هم TenantUser باشد — که در Spec §۶٫۴ گفته شده "PlatformAdmin جدا از User" — تناقض. |
| **Recommended Resolution** | Spec روشن‌تر شود: در فاز ۴، session قدیمی env-based فقط تا زمان migrate به PlatformAdmin معتبر است. پس از فاز ۴، session قدیمی deprecated. این در Roadmap باید مشخص شود. |

### تناقض C3: "FastAPI" در Review Prompt اما در Repository نیست

| | |
|---|---|
| **ID** | C3 |
| **Severity** | **CRITICAL** |
| **Document A** | این Review Prompt (سؤال ۱۰) — فرض می‌کند "پروژه Backend دارد" و در مورد FastAPI سوال می‌پرسد |
| **Document B** | واقعیت Repository |
| **Conflict** | **پروژه هیچ FastAPI ندارد.** Backend تماماً Next.js Route Handlers + Server Modules است. تنها ارجاع به FastAPI در `docs/BACKEND-ARCHITECTURE.md` است که می‌گوید "FastAPI sidecar + Ollama" برای "فاز ۲ — آینده" است. هیچ کد Python در Repository نیست. |
| **Why It Matters** | سؤال ۱۰ Review Prompt می‌خواهد اعتبارسنجی FastAPI integration کند. هیچ FastAPI ای برای اعتبارسنجی وجود ندارد. |
| **Recommended Resolution** | سؤال ۱۰ به‌عنوان "Not Applicable" علامت‌گذاری شود. تمام الگوهای Backend در این سندها (Tenant Context، RLS، ALS) باید برای Next.js Route Handlers باشند — و Spec به درستی این کار را کرده است. |

### تناقض C4: "nginx → Traefik" در Blueprint اما Spec آن را به Phase 11 موکول می‌کند

| | |
|---|---|
| **ID** | C4 |
| **Severity** | **LOW** |
| **Document A** | Blueprint §۱۰٫۳ ("تصمیم قطعی: Traefik") |
| **Document B** | Spec §۲۲٫۱۵ (Traefik در Phase 11) و §۲۳ (Phase 0.5 موازی با ۱، اما بعداً توصیه می‌شود در ۱۱ انجام شود) |
| **Conflict** | Blueprint می‌گوید "تصمیم قطعی" ولی Spec می‌گوید "Traefik در Production Deployment". ابهام: nginx در توسعه باقی می‌ماند؟ در production Traefik؟ |
| **Why It Matters** | اگر Traefik فقط در production باشد، در staging باید Traefik باشد تا production را شبیه‌سازی کند. Spec این را روشن نمی‌کند. |
| **Recommended Resolution** | مشخص شود: nginx در dev/staging، Traefik در production. در Spec Phase 11، "Traefik" با "Traefik فقط در production compose" روشن شود. |

### تناقض C5: `pgbouncer=true` و Prisma

| | |
|---|---|
| **ID** | C5 |
| **Severity** | **MEDIUM** |
| **Document A** | Blueprint §۲۲٫۱ (PgBouncer در compose) |
| **Document B** | Spec §۷٫۷ (PgBouncer `transaction` mode) |
| **Conflict** | Blueprint به صراحت `pgbouncer=true` را در URL نمی‌گوید ولی Spec می‌گوید "pgbouncer=true" در connection string. **اما**: Prisma در prepared statements با PgBouncer transaction mode مشکل دارد مگر اینکه `pgbouncer=true&connection_limit=1` تنظیم شود. |
| **Why It Matters** | اگر `pgbouncer=true` تنظیم نشود، Prisma در transaction mode error می‌دهد. |
| **Recommended Resolution** | Spec باید URL نمونه نشان دهد: `postgresql://saite_app:PASS@pgbouncer:6432/saite?pgbouncer=true&connection_limit=1` |

### تناقض C6: `eventBus.publish` فاقد `tenantId` در پیاده‌سازی فعلی

| | |
|---|---|
| **ID** | C6 |
| **Severity** | **HIGH** |
| **Document A** | Spec §۱۸٫۱ (eventBus با tenantId) |
| **Document B** | واقعیت `src/server/shared/event-bus.ts` |
| **Conflict** | Spec می‌گوید `eventBus.publish(type, payload, { tenantId? })`. کد فعلی: `eventBus.publish(type, payload)` — **بدون tenantId**. این در Implementation Spec به‌درستی گفته شده (باید تغییر کند) ولی **Spec همچنین نگفته است** که آیا این یک breaking change برای فراخوان‌های موجود است. |
| **Why It Matters** | در حال حاضر ۸+ event type ثبت شده (`src/server/shared/event-types.ts`). همه باید `tenantId` ارسال کنند. اگر یکی فراموش شود، event بدون tenantId در OutboxEvent ثبت می‌شود. |
| **Recommended Resolution** | Spec اضافه کند: "اختیاری است در API signature، ولی در runtime **اجباری** است (throws اگر tenantId نباشد مگر در Platform context)". این را در Forbidden Patterns §۵٫۳ Spec اضافه کنید. |

### تناقض C7: `cacheAside` پیش‌فرض TTL و tenant context

| | |
|---|---|
| **ID** | C7 |
| **Severity** | **MEDIUM** |
| **Document A** | Blueprint §۱۵٫۲ (cache key با tenant prefix) |
| **Document B** | Spec §۱۶ (cache key جدید) |
| **Conflict** | هر دو موافق‌اند ولی Spec §۱۶ می‌گوید "`buildTenantCacheKey('products:list', ...)`". مشکل: `buildCacheKey` در `products/service.ts:13-30` شامل پارامترهای `query, page, perPage, fields`. Spec مثال می‌زند ولی نشان نمی‌دهد که این ترکیب در کد چگونه می‌شود. **سؤال**: آیا همهٔ cache calls باید refactor شوند یا فقط key اضافه شود؟ |
| **Why It Matters** | اگر فقط key اضافه شود (`tenant:{id}:${oldKey}`)، ساده است ولی تمام کد موجود نیاز به تغییر مکانی دارد. اگر refactor شود، باید در یک فاز منسجم انجام شود. |
| **Recommended Resolution** | Spec باید روشن کند: "wrap کنید `cacheAside(key, ...)` با `buildTenantCacheKey(resource, key)` به‌جای تغییر signature `cacheAside`". این backward compatible است. |

### تناقض C8: SPEC می‌گوید "global unique" OutboxEvent فاقد tenantId

| | |
|---|---|
| **ID** | C8 |
| **Severity** | **MEDIUM** |
| **Document A** | Spec §۱۱٫۱ (OutboxEvent Hybrid: `tenantId?`) |
| **Document B** | Spec §۷٫۳ (OutboxEvent RLS policy با NULL handling) |
| **Conflict** | خود Spec می‌گوید "Hybrid" با `tenantId?` و سپس policy می‌نویسد. ولی **Spec نمی‌گوید** که آیا `OutboxEvent.aggregateId` می‌تواند unique بین Tenantها یا نه. Spec §۳٫۱ می‌گوید "global unique" برای aggregateId. **آیا** این درست است؟ یعنی aggregateId (مثلاً orderId) در بین Tenantها unique است؟ Spec روشن نمی‌کند. |
| **Why It Matters** | اگر `aggregateId` global unique باشد، در Multi-Tenant لازم نیست تغییر کند (cuid تصادفی است). ولی اگر یک Tenant orderId دستی وارد کند، ممکن است با Tenant دیگر collision کند. |
| **Recommended Resolution** | Spec اضافه کند: "`aggregateId` باید global unique باقی بماند چون از `cuid()` تولید می‌شود" — این در Spec §۱۱٫۱ به‌صراحت گفته نشده. |

### تناقض C9: `Domain.hostname` @unique

| | |
|---|---|
| **ID** | C9 |
| **Severity** | **LOW** |
| **Document A** | Blueprint §۱۰٫۱ (`hostname String @unique`) |
| **Document B** | Spec §۱۱ (Domain model) |
| **Conflict** | هر دو موافق‌اند: `hostname` global unique است (نه tenant-scoped). درست است. ولی Spec در **بخش ۱۱٫۱ طبقه‌بندی مدل‌ها** `Domain` را ذکر نکرده است! |
| **Why It Matters** | این یک oversight است. `Domain` در §۱۱٫۱ نیست ولی در §۱۱٫۲ Schema آمده. |
| **Recommended Resolution** | Spec §۱۱٫۱ باید شامل Domain باشد. |

### تناقض C10: Subscription `currentPeriodStart/End` و Trial

| | |
|---|---|
| **ID** | C10 |
| **Severity** | **MEDIUM** |
| **Document A** | Blueprint §۱۸٫۳ (currentPeriodStart/End) |
| **Document B** | Spec §۱۴ (backfill subscription legacy) |
| **Conflict** | Spec §۱۴ در backfill می‌گوید `currentPeriodEnd = NOW() + INTERVAL '100 years'` — یعنی subscription legacy عملاً lifetime. این در تضاد با Blueprint §۱۸٫۳ است که می‌گوید `nextBillingAt = +30d` و cron suspend می‌کند. |
| **Why It Matters** | اگر legacy tenant `currentPeriodEnd` برای ۱۰۰ سال باشد، cron هرگز suspend نمی‌کند. درست است که legacy unlimited است، ولی Spec باید روشن کند که legacy **از قوانین billing معاف است**. |
| **Recommended Resolution** | Spec باید روشن کند: "Legacy subscription از billing cycle معاف است؛ cron آن را نادیده می‌گیرد". یا یک فیلد `isExemptFromBilling: Boolean` اضافه شود. |

### تناقض C11: `customerId` vs `userId` در Customer Session

| | |
|---|---|
| **ID** | C11 |
| **Severity** | **MEDIUM** |
| **Document A** | Blueprint §۱۴٫۲ (CustomerSession: `sub: customerId`, `tenantId`) |
| **Document B** | Spec §۸٫۱ (CustomerSession: `sub: customerId`, `tenantId`) |
| **Conflict** | هر دو موافق‌اند ولی Spec می‌گوید "Customer session" به صورت جدا از "User session". **سؤال**: آیا Customer یک `User` نیز هست؟ Spec §۶٫۲ می‌گوید "`User` مدل سراسری، در N Tenant می‌تواند باشد". Spec §۸٫۱ می‌گوید Customer session مستقل است. **این یک overlap است**: آیا `Customer` (DB model در `prisma/schema.prisma:191`) با `User` (جدید) یکی است؟ |
| **Why It Matters** | در Schema فعلی، `Customer` یک tenant-scoped model است. Spec می‌گوید `User` سراسری. Spec §۸٫۲ می‌گوید "Customer login" اما در فاز جدید "Tenant user login". آیا `Customer` نیز به `User` متصل می‌شود؟ |
| **Recommended Resolution** | Spec روشن کند: (الف) آیا `Customer` به `User` map می‌شود یا (ب) `Customer` جدا از `User` باقی می‌ماند (همان‌طور که در Schema فعلی است). توصیه: (الف) — `Customer` یک `TenantUser` با نقش `customer` یا یک `User` جدا برای customers. **تصمیم نیاز به HUMAN DECISION.** |

### تناقض C12: RBAC فعلی vs TenantRole پیشنهادی

| | |
|---|---|
| **ID** | C12 |
| **Severity** | **MEDIUM** |
| **Document A** | Spec §۹٫۳ (Permission Matrix) |
| **Document B** | واقعیت `src/lib/auth/rbac.ts` (۳ نقش: viewer, operator, admin) |
| **Conflict** | Spec §۹٫۳ یک Permission Matrix با ۷ TenantRole ارائه می‌دهد (owner, admin, manager, finance, content, support, member). این matrix **با کد فعلی RBAC سازگار نیست** (کد فقط ۳ نقش دارد). Spec §۸٫۴ می‌گوید "RBAC فعلی حفظ می‌شود ولی map می‌شود". ولی **map دقیق کجا آمده است؟** Spec فقط یک جدول با ۷ نقش جدید می‌دهد و **نمی‌گوید** که آیا نقش‌های جدید جایگزین می‌شوند یا اضافه می‌شوند. |
| **Why It Matters** | اگر نقش‌های جدید جایگزین شوند، تمام UI که به `admin`/`operator`/`viewer` ارجاع می‌دهد باید refactor شود. اگر اضافه شوند، `AdminRole` enum در `src/types/user.ts` باید extend شود. |
| **Recommended Resolution** | Spec باید روشن کند: "`AdminRole` enum در `src/types/user.ts` گسترش می‌یابد به ۷ نقش. UI در `src/lib/admin/nav.ts` باید refactor شود. backward compat: نقش‌های قدیمی auto-map به جدید." این یک SPEC متنی است، نه کد. |

---

## ۲) Database Model Validation

### ۲٫۱ یافتهٔ بحرانی: TenantContext از طریق Prisma Extension + ALS + RLS — آیا واقعاً کار می‌کند؟

| | |
|---|---|
| **ID** | D1 |
| **Severity** | **CRITICAL (architecture-level concern)** |
| **Question** | آیا Prisma Client Extension می‌تواند **واقعاً** tenantId را در تمام queryها تزریق کند؟ |
| **Investigation** | Spec §۵٫۱ نشان می‌دهد Prisma Extension با `$allModels.$allOperations` hook می‌شود. این API در Prisma 5+ موجود است (`@prisma/client/extension`). |
| **Risk** | Prisma Extension در Prisma 6.19 (نسخهٔ فعلی `package.json`) **پایدار است**. اما: (الف) این فقط **soft enforcement** است — اگر Prisma client اصلی (نه extended) export شود، Bypass می‌شود. (ب) `findUnique({ where: { id } })` بدون tenantId filter اجازه می‌دهد cross-tenant read (Prisma findUnique فقط یک unique key می‌گیرد). |
| **Why It Matters** | اگر Extension **به‌عنوان تنها defense** استفاده شود، و یک developer در آینده `prisma` را export کند (نه extended)، تمام tenant isolation می‌شکند. **بنابراین RLS به‌عنوان defense-in-depth ضروری است.** |
| **Recommended Resolution** | Spec درست می‌گوید: "ترکیب ۱ + ۲ + RLS = Defense in Depth". ولی باید روشن‌تر بگوید: Extension **optional** است (برای convenience)، RLS **اجباری** است (برای security). این تغییر متنی کوچک در Spec §۵ است. |

### ۲٫۲ تایید: ۲۳ مدل + ۱۱ جدید = ۳۴ مدل نهایی

تأیید از `prisma/schema.prisma`:
- ۲۳ مدل موجود: `Product, Order, OrderItem, Customer, PaymentIntent, Invoice, Transaction, Shipment, ShippingRate, Coupon, CouponRedemption, Campaign, EmailLog, SmsLog, Page, Post, MenuItem, InventoryItem, InventoryAdjustment, InventoryReservation, OutboxEvent, AiUsageLog, FeatureFlag` ✅
- ۱۱ مدل جدید (Spec §۳٫۲): `Tenant, User, TenantUser, Plan, Subscription, SubscriptionBillingEvent, Domain, PlatformAdmin, PlatformSession, PlatformAuditLog, ProcessedWebhook` ✅

**نتیجه:** ۱۱ مدل جدید منطقی و non-overlapping هستند.

### ۲٫۳ Validation per Model

| Model | Tenant Scoped؟ | tenantId Required؟ | دلیل | RLS؟ | OK؟ |
|---|---|---|---|---|---|
| `Product` | ✅ | ✅ | اصلی‌ترین entity هر store | ✅ | ✅ |
| `Order` | ✅ | ✅ | order متعلق به store است | ✅ | ✅ |
| `OrderItem` | ⚠️ transitive | ❌ direct | از `Order` filter می‌شود | ✅ via Order | ✅ |
| `Customer` | ✅ | ✅ | customer متعلق به store | ✅ | ✅ |
| `PaymentIntent` | ✅ | ✅ | پرداخت per order | ✅ | ✅ |
| `Invoice` | ✅ | ✅ | invoice per order | ✅ | ✅ |
| `Transaction` | ⚠️ transitive | ❌ direct | از `Invoice` filter | ✅ via Invoice | ✅ |
| `Shipment` | ✅ | ✅ | shipment per order | ✅ | ✅ |
| `ShippingRate` | ✅ | ✅ | rate per store (یا global default) | ✅ | ⚠️ See D2 |
| `Coupon` | ✅ | ✅ | code باید per-tenant unique باشد | ✅ | ✅ |
| `CouponRedemption` | ⚠️ transitive | ❌ direct | از `Coupon` filter | ✅ via Coupon | ✅ |
| `Campaign` | ✅ | ✅ | marketing per store | ✅ | ✅ |
| `EmailLog` | ✅ | ✅ | log per store | ✅ | ✅ |
| `SmsLog` | ✅ | ✅ | log per store | ✅ | ✅ |
| `Page` | ✅ | ✅ | page per store | ✅ | ✅ |
| `Post` | ✅ | ✅ | post per store | ✅ | ✅ |
| `MenuItem` | ✅ | ✅ | menu per store | ✅ | ✅ |
| `InventoryItem` | ⚠️ transitive | ❌ direct | از `Product` filter | ✅ via Product | ✅ |
| `InventoryAdjustment` | ✅ | ✅ | log per store | ✅ | ✅ |
| `InventoryReservation` | ⚠️ transitive | ❌ direct | از `Order` filter | ✅ via Order | ✅ |
| `OutboxEvent` | ⚠️ Hybrid | ⚠️ nullable | platform events نیز داریم | ✅ with NULL | ✅ |
| `AiUsageLog` | ✅ | ✅ | per-tenant AI usage | ✅ | ✅ |
| `FeatureFlag` | ⚠️ Hybrid | ⚠️ nullable | platform + per-tenant | ✅ with NULL | ✅ |

**D2: ShippingRate ambiguity** | Severity: **LOW**
- Spec §۳٫۱ می‌گوید "tenantId Required یا default". **ابهام**: آیا shipping rate ها global هستند (مثلاً نرخ پست برای همه)؟ Spec روشن نمی‌کند.
- **Recommended Resolution**: روشن شود: "فاز ۱: global default. فاز ۲: per-tenant override". در حال حاضر، Schema فعلی `ShippingRate` بدون tenantId است.

### ۲٫۴ Unique Constraints — تأیید صحت

| Constraint فعلی | تغییر لازم | درست؟ |
|---|---|---|
| `Product.slug @unique` | `@@unique([tenantId, slug])` | ✅ |
| `Product.sku @unique` | `@@unique([tenantId, sku])` | ✅ |
| `Customer.email @unique` | `@@unique([tenantId, email])` | ✅ |
| `Coupon.code @unique` | `@@unique([tenantId, code])` | ✅ |
| `Page.slug @unique` | `@@unique([tenantId, slug])` | ✅ |
| `Post.slug @unique` | `@@unique([tenantId, slug])` | ✅ |
| `Invoice.invoiceNumber @unique` | `@@unique([tenantId, invoiceNumber])` | ✅ |
| `OrderItem @@unique([orderId, productId])` | همان (transitive) | ✅ |
| `CouponRedemption @@unique([couponId, customerId])` | همان (transitive) | ✅ |
| `CouponRedemption @@unique(orderId)` | همان (transitive) | ✅ |

**همه درست.** توجه: Spec §۳٫۱ نگفته است `InventoryReservation @@unique([orderId, productId])` تغییر نمی‌کند — که درست است (transitive).

### ۲٫۵ ID Type: `cuid()` — بررسی

| | |
|---|---|
| **ID** | D3 |
| **Severity** | **MEDIUM** |
| **Location** | تمام ۲۳ مدل: `id String @id @default(cuid())` |
| **Problem** | `cuid()` نسخهٔ ۱ (که Prisma استفاده می‌کند) **24-bit non-cryptographic** است. یعنی collision بین دو ID در ۱ میلیارد ID محتمل است. در Multi-Tenant با هزاران Tenant و میلیون‌ها Order، این ریسک‌پذیر است. |
| **Recommendation** | در فاز ۱، `cuid()` را با `cuid(2)` یا `nanoid` (۲۱ کاراکتر، collision ۱ در میلیارد) جایگزین کنید. **اما** این breaking change برای ID های موجود است — backfill لازم دارد. |
| **Recommended Resolution** | **HUMAN DECISION**: آیا این ریسک قابل‌قبول است؟ Spec فعلاً از `cuid()` استفاده می‌کند (backward compat). |

---

## ۳) Validate ۱۱ New Models

| Model | Necessary؟ | Responsibility صحیح؟ | Duplicate؟ | Conflict؟ | Merge؟ | Rename؟ | Missing Model؟ |
|---|---|---|---|---|---|---|---|
| `Tenant` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `User` | ✅ | ⚠️ (see below) | ⚠️ (Customer overlap) | ⚠️ | با `Customer` ادغام شود؟ | - | - |
| `TenantUser` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `Plan` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `Subscription` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `SubscriptionBillingEvent` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `Domain` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `PlatformAdmin` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `PlatformSession` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `PlatformAuditLog` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `ProcessedWebhook` | ✅ | ✅ | ❌ | ❌ | - | - | ❌ |
| `UserSession` | ❓ | ❓ | ⚠️ | ❓ | ادغام با `PlatformSession`؟ | - | - |

### D4: `UserSession` — آیا لازم است؟

| | |
|---|---|
| **ID** | D4 |
| **Severity** | **MEDIUM** |
| **Problem** | Spec §۳٫۲ `UserSession` را اضافه می‌کند: `id, userId, tokenHash, expiresAt, ipAddress, userAgent`. ولی Spec §۸٫۱ می‌گوید session مبتنی بر HMAC + cookie (stateless). یعنی `UserSession` **server-side session store** است ولی session فعلی stateless است. |
| **Conflict** | Spec نمی‌گوید چه چیزی در `UserSession` ذخیره می‌شود. اگر HMAC stateless باشد، `UserSession` redundant است. |
| **Recommended Resolution** | اگر می‌خواهیم server-side session (برای revocation فوری)، `UserSession` لازم است. در غیر این صورت، حذف شود. **HUMAN DECISION**. |

### D5: `User` و `Customer` Overlap

| | |
|---|---|
| **ID** | D5 |
| **Severity** | **MEDIUM** |
| **Problem** | Schema فعلی `Customer` یک tenant-scoped model است. Spec `User` را سراسری می‌کند. آیا `Customer` باید به `User` map شود؟ |
| **Option A** | `Customer` همان `User` با role='user' و `TenantUser` با نقش 'customer'. جدول `customers` حذف می‌شود. |
| **Option B** | `Customer` جدا می‌ماند (همان‌طور که Schema فعلی است). `User` فقط برای Tenant Admins است. |
| **Why It Matters** | Spec نمی‌گوید. دو روش کاملاً متفاوت هستند. |
| **Recommended Resolution** | **HUMAN DECISION** — ولی Spec باید یکی را به‌صراحت انتخاب کند. پیشنهاد من: **Option A** (یکپارچه‌سازی). دلیل: جلوگیری از dual-account برای customer که هم خرید می‌کند و هم admin است. |

---

## ۴) User / Tenant Membership Review

| | |
|---|---|
| **ID** | D6 |
| **Severity** | **MEDIUM (decision-level)** |
| **Question** | آیا `User → TenantUser → Tenant` (N:N) بهتر است یا `User → tenantId` (1:N)؟ |
| **Spec Decision** | Spec از `User → TenantUser → Tenant` استفاده می‌کند. Blueprint نیز همین. Audit نیز همان. |
| **RECOMMENDED** | **`User → TenantUser → Tenant` (N:N)** — دلایل: |
| | 1. **Multi-Tenant User Support**: یک فرد می‌تواند در چند فروشگاه باشد (مثلاً فریلنسر). |
| | 2. **Role per Tenant**: نقش در هر Tenant می‌تواند متفاوت باشد. |
| | 3. **استاندارد SaaS**: اکثر SaaS های واقعی (Shopify, Slack, Notion) از این الگو استفاده می‌کنند. |
| | 4. **بدون overhead قابل‌توجه**: `TenantUser` یک join table ساده است. |
| **Tradeoff** | Complex‌تر از `User.tenantId`. ولی برای آینده‌نگری لازم است. |

---

## ۵) Platform Admin Review

| | |
|---|---|
| **ID** | D7 |
| **Severity** | **MEDIUM** |
| **Question** | آیا Platform Admin باید User جدا باشد؟ |
| **Spec Decision** | Spec می‌گوید **بله** — `PlatformAdmin` مدل مستقل (Spec §۶٫۴). Platform session جدا از Tenant session. |
| **RECOMMENDED** | **بله، User جدا باشد.** دلایل: |
| | 1. **Cross-Tenant Access**: Platform Admin باید به تمام Tenantها دسترسی داشته باشد ولی Tenant Admin فقط به Tenant خودش. اگر Platform Admin یک `User` بود، باید `TenantUser` در همهٔ Tenantها داشته باشد. |
| | 2. **Audit**: اقدامات Platform Admin متفاوت از اقدامات Tenant Admin است (جدول `PlatformAuditLog` جدا). |
| | 3. **Permission Model**: PlatformRole ها (super_admin, support, finance, engineer) با TenantRole ها (owner, admin, ...) متفاوت هستند. |
| | 4. **Session Isolation**: Cookie و token باید متفاوت باشند (Spec §۸٫۱: `saite_platform_session` vs `saite_user_session`). |
| **Cross-Tenant Access Pattern** | Spec §۷٫۳ صحیح است: |
| | 1. Platform Admin دسترسی explicit به `/api/platform/tenants/{id}/...` دارد. |
| | 2. `withPlatformContext()` در Prisma با `set_config('app.bypass_tenant_isolation', 'on', true)`. |
| | 3. هر اقدام در `PlatformAuditLog` ثبت می‌شود. |
| | 4. RLS enforce است حتی برای platform context (مگر bypass). |
| **نتیجه** | ✅ Design صحیح است. |

---

## ۶) Multi-Tenancy Strategy Validation

| | |
|---|---|
| **ID** | D8 |
| **Severity** | **HIGH** |
| **Question** | آیا ترکیب `Shared DB + tenantId + Prisma Extension + ALS + PostgreSQL RLS` درست است؟ |
| **Components Reviewed** | |
| | 1. **Prisma 6.19**: Extension API stable ✅ |
| | 2. **PostgreSQL 17 + RLS**: `FORCE ROW LEVEL SECURITY` + `current_setting('app.current_tenant_id')` ✅ |
| | 3. **PgBouncer transaction mode**: `SET LOCAL` سازگار است ✅ |
| | 4. **Next.js Route Handlers**: `withTenantContext` wrapper امکان‌پذیر است ✅ |
| | 5. **AsyncLocalStorage (Node.js)**: `async_hooks` پایدار ✅ |
| | 6. **BullMQ Worker**: worker در یک process مستقل می‌تواند `als.run(...)` استفاده کند ✅ |
| | 7. **Redis Cache**: prefix per tenant ✅ |
| | 8. **Outbox Pattern**: `OutboxEvent.tenantId` + worker context ✅ |
| **Conclusion** | ✅ ترکیب درست است. |

**اما** (مسئله D1): Extension **نباید تنها defense** باشد. RLS ضروری است.

---

## ۷) RLS Review — Tenant Context Leakage

### سؤال: آیا Tenant Context می‌تواند از یک request به request دیگر leak کند؟

| | |
|---|---|
| **ID** | D9 |
| **Severity** | **CRITICAL** |
| **Question** | در Pool mode transaction، آیا SET LOCAL می‌تواند بین transaction ها leak کند؟ |
| **Answer** | **خیر** — اگر از `SET LOCAL` (یا `set_config(..., true)`) استفاده شود. |
| **But** | اگر developer به‌اشتباه از `SET` (بدون LOCAL) استفاده کند، setting در session باقی می‌ماند. **در PgBouncer transaction mode**، connection بین transaction ها reuse می‌شود → setting باقی می‌ماند → **DISASTER**. |
| **Required Mitigation** | Spec §۷٫۶ می‌گوید از `set_config(..., true)` استفاده شود. ولی Spec **نمی‌گوید** چه چیزی در code review جلوی developer را می‌گیرد. |
| **Recommended Resolution** | Spec اضافه کند: (الف) **Forbidden Pattern**: `SET app.current_tenant_id = 'X'` (بدون LOCAL) — ممنوع. (ب) **Helper function** تنها راه: `setTenantContextInTx(tx, tenantId)` که از `set_config(..., true)` استفاده می‌کند. (ج) **ESLint Rule** برای block `SET` بدون LOCAL. |

### سؤال: آیا Migration script می‌تواند tenant context را خراب کند؟

| | |
|---|---|
| **ID** | D10 |
| **Severity** | **MEDIUM** |
| **Answer** | Migration script با `saite_migration` (superuser) اجرا می‌شود. با RLS FORCE، حتی superuser باید RLS را رعایت کند. **ولی** Prisma Migration از یک superuser استفاده می‌کند (طبق `prisma.config.ts`). |
| **Risk** | اگر RLS فعال باشد و migration script بدون bypass اجرا شود، migration fail می‌شود. |
| **Recommended Resolution** | Spec §۷٫۸ می‌گوید: "Migration script با `SET LOCAL bypass=...on` باید شروع شود". ولی **Prisma Migrate خودش نمی‌تواند SET LOCAL اضافه کند**. Spec باید روشن کند: Prisma Migrate باید با non-superuser user اجرا شود (اما migration ها نیاز به CREATE/ALTER privilege دارند). راه‌حل: `saite_migration` superuser، `saite_app` non-superuser برای runtime. |

### سؤال: آیا Background Worker می‌تواند tenant context را خراب کند؟

| | |
|---|---|
| **ID** | D11 |
| **Severity** | **HIGH** |
| **Answer** | BullMQ Worker process مستقل است. اگر worker بدون `als.run()` اجرا شود، `tenantContext.get()` undefined برمی‌گرداند. Prisma Extension در این حالت throw می‌کند. ولی **اگر Extension نباشد** (developer آن را export نکرده)، query بدون tenant filter اجرا می‌شود → leak. |
| **Recommended Resolution** | Spec §۶٫۷ می‌گوید: Worker با `withTenantContext` یا `withPlatformContext`. **ولی** Spec **نمی‌گوید** چه اتفاقی می‌افتد اگر worker خارج از context اجرا شود. Spec اضافه کند: "اگر `tenantContext.get()` undefined و `bypass` false باشد، Prisma Extension throw می‌کند. Worker ها باید fail-fast کنند." |

---

## ۸) Prisma Review

### Operations Covered by Extension

| Operation | Extension Coverage | RLS Coverage | Risk |
|---|---|---|---|
| `findUnique` | ⚠️ Issue: `where: { id }` بدون tenantId، Prisma unique constraint ها tenantId ندارند. Extension نمی‌تواند tenantId اضافه کند بدون unique violation. | ✅ RLS rejects | LOW (RLS defense) |
| `findFirst` | ✅ Extension می‌تواند tenantId اضافه کند | ✅ | LOW |
| `findMany` | ✅ Extension می‌تواند tenantId اضافه کند | ✅ | LOW |
| `create` | ✅ Extension می‌تواند tenantId در data اضافه کند | ✅ | LOW |
| `createMany` | ✅ Extension می‌تواند tenantId در هر data اضافه کند | ✅ | LOW |
| `update` | ✅ Extension می‌تواند tenantId در where اضافه کند | ✅ | LOW |
| `updateMany` | ✅ Extension می‌تواند tenantId در where اضافه کند | ✅ | LOW |
| `delete` | ✅ Extension می‌تواند tenantId در where اضافه کند | ✅ | LOW |
| `upsert` | ✅ Extension می‌تواند tenantId اضافه کند | ✅ | LOW |
| `$queryRaw` (template) | ❌ Extension نمی‌تواند تزریق کند (developer must use Prisma.sql) | ✅ RLS in SQL | LOW |
| `$queryRawUnsafe` | ❌ **Bypass** | ⚠️ RLS in SQL | **HIGH** (developer must use template) |
| `$executeRawUnsafe` | ❌ **Bypass** | ⚠️ RLS in SQL | **HIGH** |
| `nested writes` | ✅ Prisma می‌تواند tenantId در data parent اضافه کند، ولی nested data باید explicit | ✅ | MEDIUM |

### یافتهٔ جدی: `findUnique` Issue

| | |
|---|---|
| **ID** | D12 |
| **Severity** | **HIGH** |
| **Problem** | Spec §۵٫۱ نشان می‌دهد که Extension `args.where = { ...args.where, tenantId }` اضافه می‌کند. ولی Prisma `findUnique` نیاز به **unique field** دارد. اگر developer بنویسد `prisma.product.findUnique({ where: { id: 'X' } })` (که در کد فعلی بسیار رایج است)، Extension باید `tenantId` اضافه کند: `where: { id: 'X', tenantId: 'A' }` — که Prisma می‌پذیرد (tenantId فقط یک extra filter). **ولی** اگر `id` به تنهایی unique باشد (که در Schema فعلی است)، Prisma فقط `id` را می‌گیرد و ignore `tenantId` می‌کند؟ **نه** — Prisma هر دو را می‌گیرد. ولی unique constraint در DB فقط `id` است، پس query به درستی tenant filter می‌شود. |
| **Test** | تست IDOR باید تأیید کند: `findUnique` با tenantId filter. |
| **Mitigation** | Spec §۵٫۳ Forbidden Patterns: "findUnique بدون tenantId در where" → این باید warning باشد. ولی **Spec نمی‌گوید** چگونه enforce شود. **پیشنهاد**: ESLint rule یا grep check در CI. |

---

## ۹) FastAPI / Backend Review

| | |
|---|---|
| **ID** | D13 |
| **Severity** | **CRITICAL (architectural assumption)** |
| **Finding** | **پروژه هیچ FastAPI ندارد.** |
| **Evidence** | (الف) `find . -name "*.py"` — صفر فایل. (ب) `grep -r "fastapi"` — صفر نتیجه در `src/` یا `prisma/`. (پ) تنها ارجاع در `docs/BACKEND-ARCHITECTURE.md` است که FastAPI را "فاز ۲ — آینده" می‌داند. |
| **Implication** | سؤال ۱۰ Review Prompt که فرض می‌کند "پروژه Backend با FastAPI دارد" — **اشتباه است**. Backend تماماً Next.js Route Handlers + Server Modules است. |
| **Adjusted Architecture** | تمام الگوهای Tenant Context، RLS، ALS باید برای Next.js باشند (Spec درست این کار را کرده). |
| **Recommended Resolution** | در Spec، یادداشت اضافه شود: "FastAPI sidecar (per `docs/BACKEND-ARCHITECTURE.md`) برای AI/Ollama در آینده — **خارج از scope** این Implementation. تمام الگوهای Tenant Context برای Next.js Route Handlers هستند." |

---

## ۱۰) Frontend Review

| | |
|---|---|
| **ID** | D14 |
| **Severity** | **MEDIUM** |
| **Question** | آیا Blueprint با App Router + Middleware + Layouts سازگار است؟ |
| **Findings** | |
| | 1. **`src/proxy.ts` (Middleware)**: Next.js 16 از `proxy.ts` پشتیبانی می‌کند. Spec درست این را گفته است. ✅ |
| | 2. **Route Group `(panel)`**: در حال حاضر `src/app/admin/(panel)/`. Spec می‌گوید `(storefront)` و `(platform)` جدید اضافه شود. سازگار است. ✅ |
| | 3. **Server Components vs Client Components**: Spec می‌گوید tenant context در Server Components (از `headers()`). درست. ✅ |
| | 4. **Server Actions**: Spec نمی‌گوید Server Actions چگونه tenant context می‌گیرند. **Gap**: Server Actions در Next.js 15+ از `headers()` می‌خوانند. Spec باید روشن کند. |
| | 5. **API Client** (`src/lib/api-client.ts`): Spec §۲۰٫۳ می‌گوید tenantId header ارسال نمی‌شود چون backend از host می‌خواند. **درست**. ✅ |

### D15: Server Actions Tenant Context

| | |
|---|---|
| **ID** | D15 |
| **Severity** | **LOW** |
| **Problem** | Spec Server Actions را explicit نکرده. در Next.js 16، Server Actions می‌توانند از `cookies()` و `headers()` بخوانند. tenant context از طریق `x-tenant-id` header (که proxy.ts اضافه می‌کند) قابل دسترسی است. |
| **Recommended Resolution** | Spec اضافه کند: "Server Actions از `headers().get('x-tenant-id')` می‌خوانند و `withTenantContext` می‌کنند. اگر Server Action بدون tenant context فراخوانی شود، ۴۰۰ برمی‌گردد." |

---

## ۱۱) Custom Domain Review

| | |
|---|---|
| **ID** | D16 |
| **Severity** | **MEDIUM** |
| **Question** | آیا nginx فعلی برای multi-domain کافی است یا باید Traefik باشد؟ |
| **Answer** | **Traefik بهتر است.** دلایل: |
| | 1. nginx فعلی cert hardcoded دارد (`saite.ir`). |
| | 2. ACME per-domain نیاز به automation دارد که Traefik دارد. |
| | 3. SNI با nginx multi-server-block کار می‌کند ولی cert management پیچیده‌تر است. |
| **Tradeoff** | Traefik migration یک تغییر زیرساختی بزرگ است. Spec §۲۳ توصیه می‌کند Traefik در Phase 11 انجام شود. **این تصمیم درست است.** |
| **Question for Human** | آیا Traefik بلافاصله در Phase 0.5 یا در Phase 11؟ Spec §۲۳ هر دو گزینه را مطرح می‌کند. |

---

## ۱۲) Cache Isolation Review

| | |
|---|---|
| **ID** | D17 |
| **Severity** | **MEDIUM** |
| **Findings** | |
| | 1. `cacheAside` در `src/server/shared/cache.ts:29` از Redis استفاده می‌کند ولی **هیچ tenant prefix نمی‌گیرد**. Spec §۱۶ این را می‌گوید. ✅ |
| | 2. Cache key های شناسایی‌شده (از Repository): |
| |    - `products:list:*` (products/service.ts) |
| |    - `shipping:rates:*` (shipping/service.ts) |
| |    - `seo:*` (seo-tools/gateway.ts) |
| |    - `chat:{sessionId}` (AI session-store) |
| |    - `ratelimit:*` (rate-limit-store.ts) |
| | 3. **همه باید `tenant:{id}:` prefix بگیرند.** Spec درست این را لیست کرده. ✅ |
| | 4. **cacheInvalidateByPrefix**: Spec §۱۶٫۳ می‌گوید. ولی Spec **نمی‌گوید** که چه اتفاقی می‌افتد اگر invalidation در production fail شود. Spec اضافه کند: "اگر invalidation fail، لاگ کن ولی proceed (cache ممکن است stale باشد، ولی داده صحیح است)." |

### D18: Session-based Cache (AI Chat)

| | |
|---|---|
| **ID** | D18 |
| **Severity** | **MEDIUM** |
| **Problem** | `src/server/ai/features/sales-advisor/session-store.ts:147` از `sessionId` به‌عنوان key استفاده می‌کند. **آیا sessionId per-tenant است؟** Spec §۱۶ می‌گوید "session per tenant". ولی sessionId از client می‌آید (cookie یا localStorage). اگر malicious client sessionId یک tenant دیگر را بفرستد، session دیگری را می‌بیند. |
| **Recommended Resolution** | Spec باید روشن کند: "AI chat session در Redis با key `tenant:{id}:chat:{sessionId}`. اگر client sessionId از tenant دیگر بفرستد، key متفاوت است → cache miss → session جدید ایجاد می‌شود. cache poisoning impossible." |

---

## ۱۳) Storage Isolation Review

| | |
|---|---|
| **ID** | D19 |
| **Severity** | **MEDIUM** |
| **Findings** | |
| | 1. `localDiskProvider` (`src/server/upload/providers/local.ts:13`) از `UPLOAD_SUBDIR = 'public/uploads'` استفاده می‌کند. Spec §۱۷ می‌گوید `tenants/{tenantId}/{folder}/`. ✅ |
| | 2. `s3Provider` (`src/server/upload/providers/s3.ts:5`) **فعلاً stub است** ("S3 not configured"). Spec §۱۷ می‌گوید MinIO/S3 در production. ✅ |
| | 3. **Path Traversal Risk**: `localDiskProvider:39` فقط `if (!/^[a-z0-9-]{1,32}$/.test(folder))` چک می‌کند. Spec §۱۷٫۳ می‌گوید "path traversal check". ولی Spec **نمی‌گوید** دقیقاً کجا این check در upload chain انجام شود. |
| **Recommended Resolution** | Spec اضافه کند: "در `uploadService.upload` قبل از provider، normalize و base dir check. اگر path خارج از `tenants/{tenantId}/` باشد، throw." |

---

## ۱۴) Background Job Review

| | |
|---|---|
| **ID** | D20 |
| **Severity** | **HIGH** |
| **Question** | آیا Worker ها می‌توانند tenant context را از دست بدهند؟ |
| **Findings** | |
| | 1. `src/server/jobs/queues.ts` — ۳ queue (outbox, email, sms). هیچ `tenantId` در Job data. |
| | 2. `src/server/jobs/workers/outbox-worker.ts` — **خوانده نشده ولی Spec §۱۸ می‌گوید باید `withTenantContext` استفاده کند.** |
| | 3. `src/server/shared/event-bus.ts:30` — `publish(type, payload)` بدون `tenantId`. **D6 covered this.** |
| **Risk Scenario** | |
| | 1. Tenant A publish event `order.created` |
| | 2. Worker poll می‌کند |
| | 3. Worker `withTenantContext` **ندارد** (اگر developer فراموش کند) |
| | 4. Worker handler `prisma.order.findMany()` می‌زند |
| | 5. RLS reject می‌کند (اگر RLS فعال باشد) |
| | 6. **ولی** اگر RLS fail-safe باشد (developer اشتباه کرده)، همه orders از همه tenants برگشت داده می‌شود |
| **Recommended Resolution** | Spec §۱۸٫۲ worker template **باید شامل** `als.run({ tenantId, ... }, ...)` باشد. این در Spec آمده ولی نیاز به صراحت بیشتر دارد. |

---

## ۱۵) Subscription Review

| | |
|---|---|
| **ID** | D21 |
| **Severity** | **LOW** |
| **Question** | آیا `Subscription → Tenant` مستقیم است یا از طریق Store؟ |
| **Spec Decision** | مستقیم: `Subscription.tenantId` → `Tenant`. Spec §۱۴. |
| **Validation** | ✅ درست. در Multi-Tenant SaaS، subscription per tenant (هر tenant یک plan). |
| **Alternative** | `Store.subscription` — ولی Spec `Store = Tenant` در نظر گرفته (یک tenant = یک store). پس `Subscription.tenantId` درست است. |

---

## ۱۶) Billing Review

| | |
|---|---|
| **ID** | D22 |
| **Severity** | **MEDIUM** |
| **Question** | آیا Architecture برای Billing کافی است؟ |
| **Findings** | |
| | 1. Spec §۸٫۹ Billing Webhook handler ✅ |
| | 2. `ProcessedWebhook` model برای idempotency ✅ |
| | 3. `SubscriptionBillingEvent` model ✅ |
| | 4. Spec §۱۵٫۴ Lifecycle: trialing, active, past_due, grace_period, suspended, cancelled, expired ✅ |
| **Missing** | |
| | 1. **Webhook Signature Verification**: Spec نمی‌گوید چگونه ZarinPal/IDPay signature تأیید می‌شود. Spec اضافه کند. |
| | 2. **Retry Strategy**: اگر webhook fail شود (DB down)، Spec چه می‌گوید؟ Spec اضافه کند: "Webhook ها در outbox retry می‌شوند (BullMQ exponential backoff)". |
| | 3. **Reconciliation**: Spec نمی‌گوید cron job چگونه subscription status را با payment provider reconcile می‌کند. Spec اضافه کند. |

---

## ۱۷) Migration Safety Review

### یافتهٔ بحرانی: Backfill می‌تواند روی Schema ناموفق باشد

| | |
|---|---|
| **ID** | D23 |
| **Severity** | **CRITICAL** |
| **Problem** | Spec §۴٫۳ Migration Script، `INSERT INTO tenants` می‌کند **قبل** از اینکه `Tenant` model به Schema اضافه شده باشد. اگر Migration Script اجرا شود قبل از Prisma generate، fail می‌شود. |
| **Sequence** | Spec §۲٫۲ Phase 0: tenantId nullable + backfill در **یک** migration. ولی Spec §۲٫۲ Phase 1 می‌گوید: "افزودن tenantId nullable" → "ساخت default tenant" → "backfill" — **سه عمل جدا**. Spec §۴٫۳ هر سه را در **یک** migration script merge کرده. ابهام. |
| **Recommended Resolution** | Spec باید روشن کند: |
| | - **Migration A** (Phase 0): فقط جداول جدید (`tenants`, `users`, `plans`, `subscriptions`, `domains`, `platform_admins`). بدون تغییر در جداول موجود. |
| | - **Migration B** (Phase 1): ALTER TABLE + ADD COLUMN nullable (بدون backfill). |
| | - **Migration C** (Phase 1): INSERT default tenant + UPDATE. |
| | - این سه migration باید **جدا** باشند. |
| | - **Test**: قبل از deploy، `npx prisma migrate reset` و `prisma migrate deploy` در staging. |

### D24: Unique Constraint Conflict در Backfill

| | |
|---|---|
| **ID** | D24 |
| **Severity** | **HIGH** |
| **Problem** | اگر قبل از تغییر unique، در حین Migration B (ADD COLUMN nullable) دو ردیف با `tenantId = NULL` وجود داشته باشد، تغییر unique در Migration D (`@@unique([tenantId, slug])`) می‌تواند fail شود. |
| **Order** | Spec درست است: nullable → backfill → NOT NULL → unique change. ولی Spec **نمی‌گوید** که `Customer.email` در حال حاضر `@unique` است و در Production ممکن است چند Customer با email یکسان وجود داشته باشد (اگر قبلاً bug بوده). |
| **Recommended Resolution** | Spec اضافه کند: "Pre-migration script: `SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1` — اگر نتیجه > 0، ابتدا merge یا delete." |

### D25: Data Loss Risk در Cascade

| | |
|---|---|
| **ID** | D25 |
| **Severity** | **HIGH** |
| **Problem** | Spec §۳٫۱ می‌گوید: "FK → Tenant (Cascade)". یعنی اگر Tenant حذف شود، **همه** Order, Customer, Product, etc. حذف می‌شوند. این **disaster** است اگر Platform Admin اشتباهی Tenant را حذف کند. |
| **Recommended Resolution** | Spec باید روشن کند: "Cascade فقط برای test data. Production: `onDelete: Restrict` + soft delete + archive job. hard delete فقط پس از ۹۰ روز archive." |

---

## ۱۸) Phase Order Review

### Original Phase Order (Spec §۲۳)

```
Phase 0: Foundation
Phase 0.5: Traefik (موازی)
Phase 1: Tenant Context
Phase 2: DB Multi-Tenancy
Phase 3: RLS + Prisma Extension
Phase 4: Authentication
Phase 5: Platform Admin
Phase 6: Tenant Admin
Phase 7: Custom Domains
Phase 8: Plans & Subscriptions
Phase 9: Storage & Cache
Phase 10: Security Tests
Phase 11: Production
Phase 12: Load Test
Phase 13: Staging Sign-off
Phase 14: Production Cutover
```

### اعتبارسنجی

| Phase | Depends On | Can Start? | Blocks | Risk | Order OK? |
|---|---|---|---|---|---|
| 0 | - | ✅ | 1, 2, 3 | Medium | ✅ |
| 0.5 | - | ⚠️ موازی ولی optional | 11 | High | ⚠️ See D26 |
| 1 | 0 | ✅ | 2, 3, 4 | Medium | ✅ |
| 2 | 1 | ✅ | 3, 8, 9 | High | ✅ |
| 3 | 2 | ✅ | 10 | Critical | ✅ |
| 4 | 1 | ⚠️ Conflict with 2 | 5, 6 | High | ⚠️ See D27 |
| 5 | 4 | ✅ | 8 | Medium | ✅ |
| 6 | 4 | ✅ | - | Medium | ✅ |
| 7 | 0.5 | ✅ | 11 | High | ✅ |
| 8 | 5 | ✅ | 11 | High | ✅ |
| 9 | 2 | ✅ | 10 | Medium | ✅ |
| 10 | 3, 4, 9 | ✅ | 11 | Low | ✅ |
| 11 | 0.5, 7, 8 | ✅ | 12, 13 | High | ✅ |
| 12 | 11 | ✅ | 13 | Low | ✅ |
| 13 | 12 | ✅ | 14 | Low | ✅ |
| 14 | 13 | ✅ | - | Critical | ✅ |

### D26: Traefik در Phase 0.5 یا 11؟

| | |
|---|---|
| **ID** | D26 |
| **Severity** | **MEDIUM** |
| **Problem** | Spec §۲۳ می‌گوید Traefik موازی با Phase 1، ولی بعداً توصیه می‌کند در Phase 11. ابهام. |
| **Tradeoff** | اگر Traefik در Phase 0.5: Custom Domain (Phase 7) ساده‌تر. ولی Traefik migration در production **بازنگشت‌ناپذیر** است (اگر شکست بخورد، بازگشت به nginx سخت است). |
| **Recommended Resolution** | **Traefik در Phase 11** (Production Deployment). در dev/staging، nginx موجود باقی می‌ماند با `/etc/hosts` override. در production، Traefik با ACME per-domain. **این به‌صراحت در Spec نوشته شود.** |

### D27: Phase 4 (Authentication) قبل از Phase 2 (DB)؟

| | |
|---|---|
| **ID** | D27 |
| **Severity** | **MEDIUM** |
| **Problem** | Spec §۲۳ Phase 4: Authentication → Phase 5: Platform Admin. ولی Phase 4 به `users`, `tenant_users` نیاز دارد که در Phase 0 ساخته می‌شوند. درست است. ولی **Phase 4 باید قبل از Phase 2 باشد** چون Spec §۸ می‌گوید session شامل `tenantId` و `tenantRole` است که به `TenantUser` نیاز دارد. |
| **Current Order** | 0 → 1 → 2 → 3 → 4 |
| **Better Order** | 0 → 1 → 4 → 2 → 3 (Auth قبل از DB؟ ولی Auth به schema نیاز دارد) |
| **Best Order** | 0 (همه models جدید) → 1 (tenantId nullable) → 4 (auth با backward compat) → 2 (NOT NULL) → 3 (RLS) — این در Spec نیست. |
| **Recommended Resolution** | Spec §۲۳ روشن کند: "Phase 4 Authentication ابتدا با backward compat (Spec §۸٫۵) پیاده می‌شود. Phase 2 سپس NOT NULL اعمال می‌کند. Phase 4 می‌تواند **موازی** با Phase 2 شروع شود (developer ۱ روی Auth، developer ۲ روی DB)." |

---

## ۱۹) Security Review

| Threat | Mitigation Status | Gap |
|---|---|---|
| Cross-Tenant Data Leak | Prisma Extension + RLS | ✅ Defense in depth |
| IDOR | RLS + `canAccessOrder` با tenantId | ✅ Phase 4 |
| RLS Bypass | FORCE RLS + non-superuser | ✅ D1 |
| Tenant ID Tampering | tenant از host (Spec §۱۰) | ✅ |
| Host Header Attack | `resolveTenantFromHost` فقط verified domains | ✅ |
| Domain Takeover | TXT verification + re-verify cron | ✅ Phase 7 |
| Cache Leakage | `tenant:{id}:` prefix | ✅ Phase 9 |
| Storage Leakage | `tenants/{id}/` path + path traversal check | ✅ Phase 9 |
| Privilege Escalation (Tenant→Platform) | Session isolation + cookie name | ✅ Phase 4 |
| Privilege Escalation (User→Owner) | `requireTenantPermission` + role check | ✅ Phase 4 |
| JWT Confusion | tenantId claim + verify | ✅ Phase 4 |
| Session Confusion | Cookie name متفاوت per scope | ✅ Phase 4 |
| Platform Admin Abuse | `PlatformAuditLog` + impersonation TTL | ✅ Phase 5 |
| Webhook Confusion | tenantId از orderId lookup | ✅ Phase 8 |
| Background Job Leakage | Worker با `withTenantContext` | ⚠️ **D11** |
| Path Traversal | normalize + base dir check | ✅ Phase 9 |
| **CSRF on Tenant Switch** | ❌ Spec نمی‌گوید | ⚠️ **D28** |

### D28: CSRF on Tenant Switch

| | |
|---|---|
| **ID** | D28 |
| **Severity** | **HIGH** |
| **Problem** | Spec §۸٫۴ می‌گوید "Tenant switcher" با `POST /api/auth/switch-tenant`. ولی Spec **نمی‌گوید** CSRF protection چگونه است. cookie `sameSite=strict` (که در Spec §۸٫۱ برای `saite_user_session` گفته شده) CSRF را mitigate می‌کند. **ولی** Spec صریح نمی‌گوید. |
| **Recommended Resolution** | Spec اضافه کند: "تمام cookie ها `sameSite=strict`. تمام state-changing endpoints (POST/PUT/DELETE) نیاز به CSRF token دارند (در آینده) یا sameSite=strict به‌عنوان defense کافی است." |

---

## ۲۰) Missing Architecture

| # | Component | Why Needed | Where Belongs | Priority | Phase |
|---|---|---|---|---|---|
| M1 | **CSRF Token** | State-changing operations | middleware | P1 | 4 |
| M2 | **Webhook Signature Verification** | ZarinPal/IDPay | `src/server/billing/webhook-handler.ts` | P1 | 8 |
| M3 | **Webhook Retry Strategy** | DB down | `src/server/billing/webhook-handler.ts` | P1 | 8 |
| M4 | **Subscription Reconciliation Cron** | Status drift | `src/server/jobs/dispatchers/subscription-reconciliation-dispatcher.ts` | P2 | 8 |
| M5 | **Path Traversal Check (Storage)** | Defense | `src/server/upload/service.ts` | P0 | 9 |
| M6 | **ESLint Rule: SET without LOCAL** | Developer mistake | `.eslintrc` | P0 | 3 |
| M7 | **Pre-migration Data Validation Script** | Data integrity | `scripts/pre-migration-check.ts` | P0 | 1 |
| M8 | **Tenant Deletion Hard-Delete Job** | Cleanup | `src/server/jobs/dispatchers/tenant-deletion-dispatcher.ts` | P2 | 5 |
| M9 | **Notification System (Email/SMS)** | Tenant onboarding | `src/server/communications/` | P0 | 5 |
| M10 | **Data Export per Tenant (GDPR-like)** | Compliance | `src/server/platform/tenant-export.ts` | P2 | 5 |
| M11 | **Backup Verification Script** | Disaster recovery | `scripts/verify-backup.sh` | P1 | 11 |
| M12 | **Observability (Prometheus + Grafana)** | Production | New | P2 | 11 |
| M13 | **Health Check for Tenant Status** | Monitoring | `/api/health/tenant` | P2 | 11 |
| M14 | **Email Verification Flow** | Self-service signup | `src/server/auth/email-verification.ts` | P2 | 5 |
| M15 | **Password Reset Flow** | User experience | `src/server/auth/password-reset.ts` | P1 | 4 |
| M16 | **OAuth/SSO Support** | Enterprise | `src/server/auth/sso.ts` | P3 | Future |
| M17 | **API Rate Limiting (Global)** | DDoS | middleware | P1 | 4 |
| M18 | **Tenant Slug Reservation** | Branding | `src/server/tenants/slug-reservation.ts` | P2 | 5 |

---

## ۲۱) Over-Engineering Review

| Component | MVP لازم؟ | Production لازم؟ | Comment |
|---|---|---|---|
| **RLS** | ⚠️ می‌تواند optional باشد (app-level filter کافی) ولی **HIGHLY RECOMMENDED** | ✅ | Defense in depth ارزش overhead را دارد |
| **Prisma Client Extension** | ⚠️ Optional (developer discipline کافی) | ⚠️ Optional | فقط convenience. **نباید تنها defense باشد.** |
| **ALS** | ✅ | ✅ | Clean isolation |
| **PgBouncer** | ❌ (single instance کافی) | ✅ (در ۲+ instance) | **Migrate در Phase 2 نه 0** |
| **Traefik** | ❌ (nginx برای dev/staging) | ✅ (production per-domain SSL) | **D26** |
| **MinIO** | ❌ (local disk کافی) | ✅ (multi-instance) | **Migrate در Phase 11** |
| **Multiple layers of authorization** | ⚠️ ۲ لایه (RBAC + tenant) | ✅ ۳ لایه (RBAC + tenant + feature) | Spec §۹٫۱ صحیح |
| **11 new models** | ⚠️ ۸ کافی (User/Customer ادغام، UserSession اختیاری) | ✅ ۱۱ | **D4, D5** |
| **7 TenantRole** | ⚠️ ۳-۴ کافی (admin, manager, support, member) | ✅ ۷ | **D29** |
| **4 PlatformRole** | ⚠️ ۲ کافی (super_admin, support) | ✅ ۴ | OK |

### D29: 7 TenantRole Over-Engineering

| | |
|---|---|
| **ID** | D29 |
| **Severity** | **MEDIUM** |
| **Problem** | Spec §۹٫۳ ۷ TenantRole تعریف می‌کند. ولی در عمل، اکثر SaaS ها با ۴-۵ نقش شروع می‌کنند. ۷ نقش پیچیدگی UI و permission mapping اضافه می‌کند. |
| **Recommended Resolution** | MVP: ۴ نقش (`owner, admin, manager, member`). `finance`, `content`, `support` را می‌توان بعداً اضافه کرد. **HUMAN DECISION**. |

### D30: PgBouncer در MVP لازم نیست

| | |
|---|---|
| **ID** | D30 |
| **Severity** | **LOW** |
| **Problem** | Spec §۲۲٫۱ PgBouncer را در docker-compose.prod.yml قرار می‌دهد. ولی single instance Postgres (در production با ۱-۵۰ tenant) نیازی به PgBouncer ندارد. |
| **Recommended Resolution** | PgBouncer در Phase 2 (هنگام multi-instance) اضافه شود. در Phase 11 (Production)، اگر هنوز single instance، skip شود. |

---

## ۲۲) Human Decisions Review

| Decision | دسته | دلیل |
|---|---|---|
| 1. دامنهٔ Platform | **MUST DECIDE BEFORE CODING** | بدون آن، wildcard cert نمی‌توان صادر کرد. |
| 2. مدل Billing | CAN DECIDE DURING | فعلاً ZarinPal/IDPay + manual. Stripe بعداً. |
| 3. سیاست Trial | **MUST DECIDE BEFORE CODING** | Subscription lifecycle به آن بستگی دارد. |
| 4. سیاست Grace Period | **MUST DECIDE BEFORE CODING** | Cron job به آن بستگی دارد. |
| 5. سیاست حذف Tenant | **MUST DECIDE BEFORE CODING** | FK cascade vs restrict — **D25**. |
| 6. سیاست Backup | **MUST DECIDE BEFORE CODING** | Disk space و retention. |
| 7. Storage Provider | **MUST DECIDE BEFORE CODING** | S3 SDK configuration. |
| 8. DNS Provider | **MUST DECIDE BEFORE CODING** | ACME integration (Cloudflare vs ArvanCloud). |
| 9. Self-Service Signup | **MUST DECIDE BEFORE CODING** | اگر خیر، فاز ۵ نیاز به Platform Admin دارد. |
| 10. Plan های اولیه | **MUST DECIDE BEFORE CODING** | بدون آن، quota enforcement نمی‌توان نوشت. |
| 11. Multi-Tenancy Model | تأیید شده (Shared DB + RLS) | - |
| 12. RLS Strategy | تأیید شده (FORCE + non-superuser) | - |
| 13. Authentication Strategy | تأیید شده (HMAC session) | - |
| 14. Reverse Proxy | **MUST DECIDE BEFORE CODING** | Traefik vs nginx. **D26**. |
| 15. Connection Pooler | CAN DECIDE DURING | PgBouncer فقط در multi-instance. **D30**. |
| 16. Object Storage | تأیید شده (MinIO/S3) | - |
| 17. ایمیل Provider | **MUST DECIDE BEFORE CODING** | Spec فعلاً Console provider. برای onboarding نیاز به SMTP. |
| 18. Monitoring | CAN DECIDE DURING | Prometheus در Phase 11+. |
| 19. Logging | تأیید شده (Pino) | - |
| 20. CDN | CAN DECIDE DURING | Cloudflare در Phase 2+. |
| 21. Rate Limit per Tenant | تأیید شده | - |
| 22. Background Jobs | تأیید شده (BullMQ) | - |
| 23. User در چند Tenant | **MUST DECIDE BEFORE CODING** | بر architecture تاثیر می‌گذارد. **D6**. |
| 24. Self-Service Tenant Signup | **MUST DECIDE BEFORE CODING** | اگر خیر، فاز ۵ فقط Platform Admin دارد. |
| 25. Custom Domain در همهٔ Planها | **MUST DECIDE BEFORE CODING** | Feature flag per plan. |
| **جدید: 26. cuid() vs cuid(2) vs nanoid** | **MUST DECIDE BEFORE CODING** | ID collision. **D3**. |
| **جدید: 27. User/Customer Mapping** | **MUST DECIDE BEFORE CODING** | D5. |
| **جدید: 28. UserSession لازم؟** | CAN DECIDE DURING | D4. |
| **جدید: 29. 7 TenantRole یا کمتر؟** | CAN DECIDE DURING | D29. |
| **جدید: 30. Traefik Phase 0.5 یا 11** | **MUST DECIDE BEFORE CODING** | D26. |

**خلاصه:**
- **MUST DECIDE BEFORE CODING: 12** (نه ۲۵)
- **CAN DECIDE DURING: 6**
- **DEFERRED: 0**

---

## ۲۳) Final Architecture (اصلاح‌شده بر اساس Review)

```
                        Internet
                            │
                            ▼
                  ┌─────────────────────┐
                  │   Cloudflare CDN    │ (اختیاری، Phase 2+)
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Reverse Proxy      │
                  │  • Dev: nginx       │ (D26)
                  │  • Prod: Traefik    │ (Phase 11)
                  │  • ACME per-domain  │
                  └──────────┬──────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
            ┌─────▼──────┐      ┌──────▼──────┐
            │  Platform  │      │  Storefront  │
            │  Admin UI  │      │  (per-tenant)│
            │  (Future)  │      │              │
            └─────┬──────┘      └──────┬───────┘
                  │                     │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Next.js App       │
                  │  ┌───────────────┐  │
                  │  │ proxy.ts      │  │ ← Host → Tenant (D1: from host only)
                  │  │ + Security    │  │
                  │  └───────┬───────┘  │
                  │  ┌───────▼───────┐  │
                  │  │ Route Handler │  │ ← withTenantContext() wrapper
                  │  │ + RSC         │  │
                  │  └───────┬───────┘  │
                  └──────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Tenant Context     │
                  │  (AsyncLocalStorage)│ ← D11: fail-fast if no context
                  └──────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Prisma Client      │
                  │  + Extension        │ ← D1: optional defense
                  │  (auto-filter)      │
                  └──────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │  PostgreSQL 17      │
                  │  + RLS (FORCE)      │ ← Defense in Depth (D1)
                  │  + FORCE            │
                  └────────────────────┘

             ┌─────────┼─────────┐
             │         │         │
           Redis    Storage    Events
          (Cache)  (MinIO/S3)  (BullMQ)
             │         │         │
             └────┬────┴────┬────┘
                  │         │
             Per-Tenant    Worker
             Prefix     (with ALS)
```

**Backend واقعی:** Next.js Route Handlers (D13 — هیچ FastAPI نیست)

---

## ۲۴) Final Verdict

# 🟡 APPROVED WITH REQUIRED CHANGES

اسناد برای شروع **Implementation آماده نیستند** تا ۱۲ HUMAN DECISION (بخش ۲۲) و ۱۰ تغییر متنی زیر اعمال شوند.

---

## ۲۵) Implementation Gate Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Architecture validated | ⚠️ **NEEDS DECISION** (D26, D30) |
| 2 | Database validated | ⚠️ **NEEDS DECISION** (D5, D11) |
| 3 | Tenant model validated | ✅ PASS |
| 4 | User model validated | ⚠️ **NEEDS DECISION** (D5) |
| 5 | Platform Admin validated | ✅ PASS (D7) |
| 6 | Authentication validated | ✅ PASS (with C11 fix) |
| 7 | Authorization validated | ⚠️ **NEEDS DECISION** (D29) |
| 8 | RLS validated | ✅ PASS (with D1 clarification) |
| 9 | Prisma strategy validated | ✅ PASS (with D1, D11) |
| 10 | Cache isolation validated | ✅ PASS (with D18) |
| 11 | Storage isolation validated | ✅ PASS (with D19) |
| 12 | Background jobs validated | ⚠️ **FAIL** (D11, D20) — Spec needs more |
| 13 | Domain architecture validated | ✅ PASS (D16) |
| 14 | Subscription validated | ✅ PASS (with C10) |
| 15 | Migration validated | ⚠️ **FAIL** (D23, D24, D25) |
| 16 | Security validated | ⚠️ **FAIL** (D28) |
| 17 | Phase order validated | ⚠️ **NEEDS DECISION** (D26, D27) |
| 18 | Human decisions resolved | ⚠️ **FAIL** (12 must decide) |

**Summary:**
- **PASS: 8** (۸ از ۱۸)
- **NEEDS DECISION: 6**
- **FAIL: 4**

---

## ۲۶) Required Changes Before Implementation

### Changes to Spec (متنی، نه کد)

1. **§۲٫۱ Implementation Spec**: اضافه کردن یادداشت "FastAPI نیست" (D13)
2. **§۵٫۱**: تأکید که RLS **اجباری** است، Extension **optional** (D1)
3. **§۶٫۷ Background Jobs**: اضافه کردن fail-fast در worker (D11)
4. **§۷٫۶**: ESLint rule برای `SET` بدون LOCAL (D9)
5. **§۸٫۱**: روشن کردن که `saite_user_session` نام cookie است (C2)
6. **§۸٫۵**: Backend compat برای فاز ۴ نیاز به deprecation timeline دارد
7. **§۹٫۳**: Permission Matrix ممکن است با `src/lib/auth/rbac.ts` ناسازگار باشد (C12)
8. **§۱۰٫۲**: مسیر Host برای custom domain باید verified باشد
9. **§۱۱٫۱**: Domain model اضافه شود
10. **§۱۲٫۱**: Impersonation TTL
11. **§۱۴ (Subscription)**: `isExemptFromBilling` flag یا explicit note
12. **§۱۵ (Plan)**: پلن‌های اولیه نیاز به تأیید
13. **§۱۶ (Cache)**: `cacheInvalidateByPrefix` fail handling
14. **§۱۷ (Storage)**: Path traversal check explicit
15. **§۱۸٫۲ (Outbox)**: tenantId **required** در runtime
16. **§۲۰ (Frontend)**: Server Actions tenant context
17. **§۲۲ (Infrastructure)**: Traefik فقط در production
28. **§۲۲٫۱ PgBouncer**: optional در MVP
19. **§۲۳ (Phase Order)**: Phase 4 می‌تواند موازی با Phase 2 شروع شود
20. **§۲۸ (Human Decisions)**: 5 decision جدید اضافه شود

### Required Human Decisions (۱۲)

1. دامنهٔ Platform (D26)
2. سیاست Trial (Spec §۲۸)
3. سیاست Grace Period
4. سیاست حذف Tenant (D25)
5. سیاست Backup
6. Storage Provider
7. DNS Provider
8. Self-Service Signup
9. Plan های اولیه
10. cuid() version (D3)
11. User/Customer Mapping (D5)
12. Custom Domain در همهٔ Planها

---

## ۲۷) Repository Coverage

### فایل‌های بررسی‌شده برای این Review
- ✅ `prisma/schema.prisma` (۵۸۶ خط)
- ✅ `src/proxy.ts` (۱۶۶ خط)
- ✅ `src/lib/auth/rbac.ts` (۱۷۷ خط)
- ✅ `src/lib/auth/server/session-token.ts` (۱۳۱ خط)
- ✅ `src/lib/auth/server/session-token-core.ts` (۵۶ خط)
- ✅ `src/lib/auth/server/admin-secret.ts`
- ✅ `src/lib/auth/server/admin-session.ts` (۱۱۰ خط)
- ✅ `src/lib/auth/server/require-role.ts` (۱۱۱ خط)
- ✅ `src/lib/auth/server/rate-limit.ts`
- ✅ `src/lib/auth/server/rate-limit-store.ts` (نکته: قبلاً Redis store دارد — مثبت)
- ✅ `src/lib/auth/customer-scope.ts` (۱۶ خط) — تأیید: tenantId نیست
- ✅ `src/server/shared/db.ts` (۳۵ خط)
- ✅ `src/server/shared/event-bus.ts` — تأیید: tenantId نیست
- ✅ `src/server/shared/cache.ts` — تأیید: prefix ندارد
- ✅ `src/server/modules/*/repository.ts` (۷ ماژول)
- ✅ `src/server/jobs/queues.ts` — تأیید: tenantId نیست
- ✅ `src/server/upload/service.ts` و providers
- ✅ `src/app/admin/(panel)/layout.tsx`
- ✅ `docs/BACKEND-ARCHITECTURE.md` — FastAPI در "Phase 2 آینده"

### فایل‌های **NOT** بررسی‌شده عمیق
- ⚠️ `src/server/ai/*` — برای SaaS تأثیر کم
- ⚠️ `src/server/communications/*` — فقط Console provider
- ⚠️ `tests/` — فقط header
- ⚠️ `e2e/` — فقط listing
- ⚠️ `src/components/admin/*` — برخی components

### یافته‌های جانبی مثبت (چیزی که Blueprint/Spec به آن اشاره نکرده ولی در Repository آماده است)

1. ✅ `createResilientRedisStore` در `src/lib/auth/server/rate-limit-store.ts:217` — برای multi-instance rate limit آماده است.
2. ✅ `pino` structured logger — فقط نیاز به tenantId field اضافه شود.
3. ✅ BullMQ + Redis already wired — فقط نیاز به tenantId در Job data.
4. ✅ CSP nonce infrastructure — مستقیم قابل استفاده.
5. ✅ Outbox pattern — فقط tenantId اضافه شود.

---

## ۲۸) مثبت‌ها (چه چیزهایی درست است)

1. ✅ **Shared DB + tenantId** — تصمیم درست (D8)
2. ✅ **Prisma Extension + ALS + RLS** — ترکیب درست (D1)
3. ✅ **Platform Admin جدا از User** — درست (D7)
4. ✅ **User → TenantUser → Tenant** — درست (D6)
5. ✅ **14 Phase Roadmap** — منطقی است (D26, D27)
6. ✅ **Testing Strategy** — IDOR suite درست
7. ✅ **Rollback Plan** — backup per phase
8. ✅ **File-Level Map** — Spec §۲ دقیق
9. ✅ **API Change Map** — Spec §۱۹ کامل
10. ✅ **Definition of Done** — Spec §۲۶ واضح

---

## ۲۹) پاسخ نهایی به سؤال Pre-Implementation Gate

> **آیا سه سند فعلی برای شروع Implementation آماده هستند؟**

### **نه کاملاً.** Verdict: **🟡 APPROVED WITH REQUIRED CHANGES**

### ۱۰ تغییر متنی در Spec لازم است
### ۱۲ HUMAN DECISION لازم است
### ۴ FAIL در Checklist (Background Jobs, Migration, Security, Human Decisions)

**پس از اعمال این تغییرات و تصمیمات، Implementation می‌تواند از Phase 0 شروع شود.**

### اولویت‌بندی تغییرات (پیشنهاد من)

1. **CRITICAL**: D25 (Cascade disaster) — Spec روشن کند "Cascade ممنوع در production"
2. **CRITICAL**: D23 (Migration sequence) — Spec سه migration جدا تعریف کند
3. **CRITICAL**: D11 (Worker fail-fast) — Worker template با explicit `als.run`
4. **HIGH**: D13 (FastAPI note) — Spec اضافه کند "FastAPI نیست"
5. **HIGH**: C12 (RBAC نقش) — Spec روشن کند چه نقش‌هایی اضافه می‌شوند
6. **HIGH**: D5 (User/Customer) — Spec تصمیم بگیرد
7. **HIGH**: D26 (Traefik) — Spec "Traefik فقط production" روشن کند
8. **MEDIUM**: 5+ مورد دیگر

---

**End of Review.**
