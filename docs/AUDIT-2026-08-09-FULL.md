# گزارش تحلیل جامع معماری بک‌اند Saite

> **تاریخ:** ۲۰۲۶-۰۸-۰۹  
> **تحلیل‌گر:** Senior Software Engineer  
> **وضعیت baseline:** `tsc --noEmit` ✅ | `eslint src --max-warnings=0` ✅ | `vitest run` ✅ (30 فایل، ~300 تست) | `npm run build` ✅ (بدون DATABASE_URL)  
> **شاخه:** `arena/019fe8c8-saite`  
> **commit:** `716e0608`

---

## خروجی Baseline (واقعی، نه حدسی)

| دستور | نتیجه | مدت |
|--------|--------|------|
| `npx tsc --noEmit` | ✅ ۰ خطا | ~30s |
| `npx eslint src --max-warnings=0` | ✅ ۰ warning | ~33s |
| `timeout 60 npx vitest run` | ✅ 30 Test Files / ~300 tests / همه سبز | ~60s |
| `npm run build` | ✅ build سبز — بدون DATABASE_URL، بدون `process.exit`، Proxy کار می‌کند | ~54s |

---

## ۲) جدول امتیازدهی معماری

| معیار | نمره | توضیح |
|-------|:------:|-------|
| **معماری کلی** | **۷/۱۰** | Modular Monolith تمیز. هر دامنه (finance, orders, shipping, marketing, content, inventory, products) لایه‌های `events → repository → service` دارد. Event Bus با Outbox Pattern. وابستگی چرخه‌ای db↔jobs با lazy import شکسته شده (`init.ts:11`). اما ارتباط بین ماژول‌ها هنوز مستقیم است (outbox-worker مستقیماً financeService و inventoryService صدا می‌زند). |
| **جداسازی مسئولیت (SRP)** | **۷/۱۰** | Route handlers نازک‌اند (`_utils.ts` مشترک). Repository فقط query دارد. Service منطق تجاری + event publish. اما `orders/service.ts:47-125` هم‌زمان validation + price lookup + transaction می‌کند — باید شکسته شود. `marketingService.applyCoupon` یک monolith کوچک است. |
| **Type Safety** | **۶/۱۰** | `strict: true` + `noImplicitAny` فعال. اما **۲۲ مورد `as unknown as any`** در repositoryها وجود دارد — عمدتاً برای عبور از تفاوت Prisma stub vs real. این‌ها type-safety را در لایهٔ داده کاملاً دور می‌زنند. `as any[]` در `orders/service.ts:69` و `as Record<string, unknown>` در چندین فایل. |
| **Error Handling** | **۷/۱۰** | سلسله‌مراتب `NotFoundError/ValidationError/UnauthorizedError/ForbiddenError` خوب است. `handleServiceError` در `_utils.ts` همه routeها را پوشش می‌دهد. اما: `CouponValidationError` و `InvalidStateTransitionError` extend نمی‌کنند — name-based dispatch در `_utils.ts:12` شکننده است. `console.error` در ۵ فایل API به جای `logger`. |
| **امنیت** | **۶/۱۰** | نقاط قوت: HMAC timing-safe، rate-limit دو لایه (IP + username)، anti-enumeration، CSRF با sameSite=lax، folder regex. نقاط ضعف: password='demo' در dev، بدون webhook HMAC، upload بدون magic bytes، `perCustomerLimit` check-then-act race. |
| **تست‌پذیری** | **۵/۱۰** | ~300 تست unit سبز. اما **هیچ تست integration برای endpointها نیست** (tests/server فقط marketing-validateCoupon). Repositoryها singleton هستند — mock سخت. Prisma proxy در build فقط برای build است، نه mock در runtime. |
| **مستندسازی** | **۸/۱۰** | `BACKEND-ARCHITECTURE.md` جامع. کامنت‌های درون‌خطی عالی (چرایی هر تصمیم). اما **صفر JSDoc** روی serviceها. قرارداد خطای API مستند نشده. |
| **مقیاس‌پذیری** | **۶/۱۰** | Outbox + BullMQ + Redis معماری مقیاس‌پذیر دارد. اما: outbox-dispatcher single-process polling است، بدون advisory lock. `inventoryService.reserveItems` sequential loop است (N+1 query). cache-aside pattern وجود ندارد — هر درخواست مستقیم DB می‌رود. |

---

## ۳) نقاط قوت (با ارجاع دقیق)

### S1 — قرارداد لایهٔ داده ثابت و migration-proof
- **فایل:** `src/lib/api.ts:1-170`
- **دلیل:** فقط همین فایل و `api-client.ts` باید عوض شوند وقتی mock→HTTP سوئیچ می‌شود. امضای تمام توابع ثابت مانده. ESLint rule (`eslint.config.mjs:32-42`) جلو‌گیری از import مستقیم mock-data. این یک الگوی migration-proof عالی است.

### S2 — Build بدون crash با Proxy Pattern
- **فایل:** `src/server/shared/db.ts:10-21`
- **دلیل:** Proxy که `NEXT_PHASE=phase-production-build` را تشخیص می‌دهد و هر متد را به Promise.reject تبدیل می‌کند. این یعنی build در CI بدون DATABASE_URL سبز می‌ماند. خروجی واقعی: `npm run build` ✅ بدون هیچ متغیر env.

### S3 — State Machine صریح برای Order
- **فایل:** `src/server/modules/orders/state-machine.ts:1-31`
- **دلیل:** گذارهای مجاز به‌صورت declarative تعریف شده. `assertValidTransition` از هر گذار غیرمجاز جلوگیری می‌کند. `isTerminalState` برای تصمیم‌گیری. این الگو از transition bugs جلوگیری می‌کند.

### S4 — Anti-Enumeration + Timing Attack Protection
- **فایل:** `src/app/api/customers/session/route.ts:52-86`
- **دلیل:** وقتی کاربر وجود ندارد، dummy hash verify + delay 600ms اجرا می‌شود. `timingSafeEqual` در session-token و password-hash استفاده شده. پیام خطا یکسان: «نام کاربری یا رمز نادرست».

### S5 — Outbox Pattern + Idempotent Webhook
- **فایل:** `src/server/shared/event-bus.ts:12-24` + `src/app/api/payments/webhook/zarinpal/route.ts:22-36`
- **دلیل:** Event Bus مستقیماً DB می‌نویسد (outbox). Webhook زرین‌پال idempotent است: اگر `verifiedAt` قبلاً set شده، redirect می‌کند بدون re-verify. اگر order قبلاً paid شده، `InvalidStateTransitionError` را نادیده می‌گیرد.

### S6 — Graceful Degradation در همهٔ سرویس‌های خارجی
- **فایل:** `src/server/payments/gateway.ts:5-10`، `src/server/ai/gateway.ts:22`، `src/server/communications/service.ts:6-7`
- **دلیل:** بدون ZARINPAL_MERCHANT_ID → mockPaymentProvider. بدون ANTHROPIC_API_KEY → mockAiProvider. بدون SMTP_HOST → consoleMailProvider. سیستم همیشه بالا می‌آید.

### S7 — Rate Limit دو لایه (IP + Username) + Trusted Proxy Hops
- **فایل:** `src/lib/auth/server/rate-limit.ts:46-120`
- **دلیل:** سطل موازی IP (۱۰/۱۵ دقیقه) و username (۳۰/ساعت). `TRUSTED_PROXY_HOPS` برای استخراج صحیح IP پشت nginx/Cloudflare. sweep دوره‌ای برای cleanup.

### S8 — ESLint Rules برای حفاظت معماری
- **فایل:** `eslint.config.mjs:30-72`
- **دلیل:** قوانین no-restricted-imports برای mock-data و components/ui. این قوانین توافق‌های معماری را از «توافق شفاهی» به «تحمیل ماشینی» ارتقا می‌دهند.

---

## ۴) نقاط ضعف بحرانی

### C1 — ساختار مالی: `unitPrice` از کلاینت (قبلاً اصلاح شده ✅)
- **بررسی:** `src/app/api/orders/route.ts:33-38` — body فقط `items` و `shippingAddress` را extract می‌کند.
- **`src/server/modules/orders/service.ts:51-77`** — قیمت‌گذاری **سروری**: `prisma.product.findMany` → `productMap.get(productId)` → `unitPrice = product.price`. کلاینت هرگز قیمت نمی‌فرستد.
- **وضعیت:** ✅ **اصلاح شده**. قیمت‌گذاری کاملاً سروری است.

### C2 — قیمت از کلاینت در CreateOrderInput interface
- **فایل:** `src/server/modules/orders/service.ts:12-14`
- **خط:** `items: { productId: string; quantity: number; unitPrice?: number }[]`
- **مشکل:** Interface `unitPrice?` دارد. اگرچه service آن را **نادیده می‌گیرد** و قیمت را از DB می‌خواند، اما وجود `unitPrice` در interface گمراه‌کننده است و ممکن است در آینده کسی از آن استفاده کند.
- **Severity:** `medium`
- **راه‌حل:** حذف `unitPrice` از interface.

### C3 — Routes بدون requirePermission (بررسی کامل)
- **بررسی:** `grep -rn "requirePermission" src/app/api/` + بررسی دستی هر route.
- **یافته‌ها:**
  - `src/app/api/ai/chat/route.ts` — **بدون requirePermission**. فقط rate-limit دارد. هر ناشناس می‌تواند AI chat کند. → **high**
  - `src/app/api/orders/route.ts` — از `getCustomerSession` استفاده می‌کند (customer auth). ✅
  - `src/app/api/orders/[id]/route.ts` — `getCustomerSession` + `canAccessOrder`. ✅ IDOR protected.
  - `src/app/api/customers/session/route.ts` — public (login endpoint). ✅ درست.
  - `src/app/api/health/route.ts` — public. ✅ درست.
  - `src/app/api/upload/route.ts` — `requirePermission('content:write')`. ✅
  - `src/app/api/products/route.ts:53` — GET public. POST با `requirePermission`. ✅
  - `src/app/api/shipping/rates/route.ts:13-20` — GET: اگر `active=true` → public. در غیر این صورت `requirePermission('settings:read')`. ✅
  - **همه routeهای admin** — `requirePermission` دارند. ✅
- **Severity:** `high` (فقط `/api/ai/chat`)
- **راه‌حل:** اضافه کردن customer session check یا requirePermission به ai/chat.

### C4 — IDOR روی Order
- **فایل:** `src/app/api/orders/[id]/route.ts:12-24`
- **وضعیت:** ✅ **محافظت شده.** `canAccessOrder(session.sub, order)` چک می‌کند `order.customerId === customerId`.
- **اما:** `canAccessOrder` فقط customer را چک می‌کند، admin را نه. اگر admin بخواهد سفارش ببیند، route فعلی 403 می‌دهد.
- **Severity:** `low` (طراحی، نه باگ)

### C5 — Demo Password
- **فایل:** `src/app/api/customers/session/route.ts:72-74`
- **خط:** `ok = password === 'demo'`
- **محافظت:** فقط وقتی `NODE_ENV !== 'production'` اجرا می‌شود. در production → `ok = false`.
- **Severity:** `low` — در production غیرفعال است. اما اگر کسی اشتباهاً `NODE_ENV=development` در prod set کند، هر حسابی بدون passwordHash با رمز 'demo' باز می‌شود.
- **راه‌حل:** guard قوی‌تر: `if (process.env.ALLOW_DEMO_LOGIN === 'true' && process.env.NODE_ENV !== 'production')`.

### C6 — Upload Stored XSS
- **فایل:** `src/app/api/upload/route.ts:10-49` + `src/server/upload/providers/local.ts:13-42`
- **محافظت موجود:**
  - MIME whitelist (`image/jpeg, png, webp, gif, pdf`) ✅
  - Folder regex `/^[a-z0-9-]{1,32}$/` ✅
  - Size limit (`UPLOAD_MAX_SIZE_MB`) ✅
  - `client_max_body_size 10m` در nginx ✅
- **نبود:**
  - **بدون magic bytes check** — MIME از `file.type` می‌آید که client-controlled است.
  - **بدون Content-Disposition header** برای serve فایل‌ها — nginx فایل‌ها را مستقیم serve می‌کند بدون `X-Content-Type-Options` روی `/uploads/`.
  - `nginx.conf:79-83`: location `/uploads/` فقط `Cache-Control` دارد، بدون `Content-Disposition: attachment` یا `X-Content-Type-Options: nosniff`.
- **Severity:** `medium`
- **راه‌حل:** 1) magic bytes validation (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`). 2) `add_header Content-Disposition "attachment"` و `add_header X-Content-Type-Options "nosniff"` روی `/uploads/`.

### C7 — perCustomerLimit Race Condition
- **فایل:** `src/server/modules/marketing/service.ts:89-95`
- **خطوط:** `existingCount = await tx.couponRedemption.count(...)` → `if (existingCount >= limit) throw`
- **محافظت:** داخل `prisma.$transaction` است. Prisma با `REPEATABLE READ` (پیش‌فرض Postgres) + unique constraint `@@unique([couponId, customerId])` روی CouponRedemption.
- **تحلیل دقیق:** unique constraint `couponId+customerId` یعنی برای `perCustomerLimit=1`، تلاش دوم catch می‌شود. **اما** اگر `perCustomerLimit=3` باشد، race بین count=2 و create ممکن است. چون Postgres default isolation (`READ COMMITTED`) در Prisma: دو transaction موازی هر دو count=2 می‌بینند.
- **Severity:** `medium` — unique constraint جلوی perCustomerLimit=1 را می‌گیرد، اما مقادیر بالاتر race دارند.
- **راه‌حل:** `SELECT ... FOR UPDATE` روی Coupon row، یا `SERIALIZABLE` isolation.

### C8 — perPage بی‌سقف
- **بررسی:** `src/app/api/products/_utils.ts:21-30` — `perPage = Math.min(100, Math.max(1, Math.floor(perPage)))`. ✅ سقف 100 دارد.
- **`src/server/shared/validation.ts:15`** — `z.coerce.number().int().min(1).max(100)`. ✅
- **`src/app/api/finance/transactions/route.ts:13`** — `limit = Number(searchParams.get('limit')) || 20`. ⚠️ بدون Math.min!
- **`src/app/api/finance/invoices/route.ts:11`** — `limit = Number(...) || 20`. ⚠️ بدون سقف.
- **`src/app/api/comms/email-logs/route.ts:10`** — `limit = Number(...) || 20`. ⚠️ بدون سقف.
- **`src/app/api/comms/sms-logs/route.ts:10`** — `limit = Number(...) || 20`. ⚠️ بدون سقف.
- **`src/app/api/shipping/shipments/route.ts:11`** — `limit = Number(...) || 20`. ⚠️ بدون سقف.
- **Severity:** `medium` — ۶ endpoint بدون سقف perPage/limit. مهاجم `?limit=999999` می‌فرستد → OOM یا timeout.
- **راه‌حل:** `parsePagination` helper مشترک (موجود در `_utils.ts`) را در همه endpointها استفاده کنید.

### C9 — جریان پول قطع (Finance ↔ Payment ↔ Order)
- **تحلیل:** `src/app/api/payments/webhook/zarinpal/route.ts:53-72`
  - PaymentIntent verified → `ordersService.transitionState(orderId, 'paid')`.
  - outbox `order.status_changed` → outbox-worker → `financeService.createInvoiceFromOrder`.
  - **اما:** `financeService.markInvoicePaid` **هیچ‌جا صدا زده نمی‌شود**. یعنی فاکتور created می‌شود اما هرگز paid نمی‌شود.
  - **`Transaction`** هم created نمی‌شود (مگر اینکه markInvoicePaid صدا زده شود با referenceId).
- **Severity:** `critical` — صورت‌حساب هرگز «پرداخت‌شده» نمی‌شود. جریان پول قطع است.
- **راه‌حل:** در outbox-worker بعد از `createInvoiceFromOrder`، `markInvoicePaid` را هم صدا بزنید. یا مستقیماً در webhook.

### C10 — Dockerfile `--omit=dev`
- **فایل:** `Dockerfile:6`
- **خط:** `RUN npm ci --omit=dev` (در stage deps)
- **تحلیل:** stage `deps` فقط برای `runner` است — runtime dependencies. Stage `builder` (line 11-14) جداگانه `npm ci` (full) دارد برای build. `runner` فقط standalone output + Prisma engine copy می‌کند.
- **وضعیت:** ✅ **مشکل ندارد.** --omit=dev فقط در deps (runtime copy) است. Builder جداگانه full install دارد.
- **اما:** `node_modules/.prisma` copy شده ولی `@prisma/client` در runner نیست (چون --omit=dev). اگر runtime به @prisma/client نیاز داشته باشد → crash.
- **بررسی:** Next.js standalone mode تمام dependencies مورد نیاز را bundle می‌کند. Prisma engine در `.prisma/client` است که copy شده. ✅

### C11 — صفر Migration
- **فایل:** `prisma/migrations/` — فقط `README.md` دارد (فایل خالی).
- **تحلیل:** هیچ migration واقعی وجود ندارد. `prisma migrate dev` اجرا نشده. در production: `prisma migrate deploy` چیزی apply نمی‌کند.
- **`docker-compose.prod.yml`** — هیچ `prisma migrate deploy` در entrypoint نیست.
- **Severity:** `critical` — در اولین deploy، جدول‌ها وجود ندارند. DB خالی است.
- **راه‌حل:** `npx prisma migrate dev --name init` → generate initial migration. سپس `prisma migrate deploy` در Dockerfile CMD یا entrypoint script.

### C12 — Outbox Re-enqueue
- **فایل:** `src/server/jobs/dispatchers/outbox-dispatcher.ts:26-44`
- **تحلیل:** dispatcher هر `OUTBOX_POLL_MS` (5s) poll می‌کند. هر event با `processedAt=null` و `retryCount < 5` را enqueue می‌کند. سپس `retryCount` را increment می‌کند (line 35). **اما** اگر worker قبل از process شدن crash کند، event همچنان `processedAt=null` است و دفعه بعد re-enqueue می‌شود. BullMQ jobId dedup دارد (`jobId: event.id`) — اما اگر job در BullMQ fail شده و از queue حذف شده باشد، re-enqueue ممکن است.
- **محافظت:** BullMQ `attempts: 3` + `backoff: exponential`. بعد از 3 تلاش → DLQ. Dispatcher بعد از `OUTBOX_MAX_RETRY` (5) enqueue نمی‌کند.
- **Severity:** `medium` — double-processing ممکن است اما handlerها عمدتاً idempotent‌اند.

### C13 — Rate Limit سراسری
- **موجود:** customer login (IP + email)، AI chat، coupon validate، admin login.
- **نبود:** همهٔ POST/PUT/DELETE بدون rate limit خاص. Products CRUD، orders create، shipping create، upload — فقط nginx `limit_req zone=general burst=20 nodelay` (10r/s).
- **Severity:** `low-medium` — nginx rate limit عمومی وجود دارد اما per-endpoint نه.
- **راه‌حل:** rate-limit middleware مشترک برای mutation endpoints.

### C14 — ایندکس/FK بررسی
- **موجود:** `@@index([category, createdAt])` روی Product، `@@index([customerId, createdAt])` روی Order و Invoice، `@@index([orderId])` روی PaymentIntent، `@@index([carrier, status])` روی Shipment.
- **نبود:**
  - `Transaction.orderId` — بدون ایندکس (query توسط orderId رایج است)
  - `OutboxEvent.type` — بدون ایندکس (worker بر اساس type switch می‌کند)
  - `Coupon.code` — `@unique` دارد، index خودکار ✅
  - `CouponRedemption.orderId` — `@unique` ✅
  - `EmailLog.to` + `createdAt` — `@@index([to, createdAt])` ✅
  - FK `OrderItem.orderId` — بدون `@@index` (join رایج)
  - FK `OrderItem.productId` — بدون `@@index`
- **Severity:** `medium` — در حجم بالا، joinها کند می‌شوند.

### C15 — قرارداد خطای API
- **وضعیت فعلی:**
  - `{ error: string }` — اکثر routeها
  - `{ error: string, details: unknown }` — ValidationError
  - `{ ok: false, reason, message }` — auth errors (require-role)
  - `{ error: string, code?: string }` — ApiError
- **مشکل:** سه فرمت مختلف. کلاینت باید سه shape را parse کند.
- **Severity:** `low` — فعلاً مشکل‌ساز نیست اما برای API versioning بحرانی می‌شود.
- **راه‌حل:** یک استاندارد: `{ error: string, code?: string, details?: unknown }`.

---

## ۵) بدهی‌های فنی

### ۵.۱ — `as unknown as any` / `as any` پنهان (۲۲ مورد)

| فایل | خط | تعداد |
|------|-----|:------:|
| `finance/repository.ts` | 23, 78, 97, 100, 106, 108, 114 | 7 |
| `orders/repository.ts` | 28, 34, 39 | 3 |
| `orders/service.ts` | 69, 103, 120 | 3 |
| `products/repository.ts` | 32, 36 | 2 |
| `shipping/repository.ts` | 22, 23, 40 | 3 |
| `marketing/repository.ts` | 25, 123 | 2 |
| `marketing/service.ts` | 133 | 1 |
| `shared/event-bus.ts` | 18 | 1 |
| **جمع** | | **۲۲** |

**ریشه:** اکثر این‌ها به‌خاطر `Record<string, unknown> → Prisma.InputJsonValue` هستند. راه‌حل: استفاده از `zod-prisma-types` (که در TODO هست) یا helper type.

### ۵.۲ — `console.*` پراکنده (۵ مورد سرور)

| فایل | خط | نوع |
|------|-----|-----|
| `api/payments/webhook/zarinpal/route.ts` | 76, 85 | console.log, console.error |
| `api/ai/chat/route.ts` | 24 | console.error |
| `api/products/_utils.ts` | 16 | console.error |
| `app/error.tsx` | 21 | console.error |

**راه‌حل:** جایگزینی با `logger` از `@/server/shared/logger`.

### ۵.۳ — TODOهای باز (۷ مورد)

| فایل | خط | توضیح |
|------|-----|-------|
| `ai/features/product-seo/subscriber.ts` | 21 | ذخیره SEO در جدول |
| `communications/providers/smtp.ts` | 8 | اتصال SMTP |
| `jobs/workers/outbox-worker.ts` | 110 | ایمیل فاکتور |
| `modules/inventory/repository.ts` | 13, 22 | Reservation واقعی |
| `modules/products/repository.ts` | 43 | pgvector |
| `upload/providers/s3.ts` | 7 | ArvanCloud S3 |

### ۵.۴ — وابستگی چرخه‌ای db ↔ jobs ↔ workers

- **مسیر:** `db.ts` → `event-bus.ts` → `jobs/init.ts` → `jobs/registry.ts` → `jobs/workers/outbox-worker.ts` → `db.ts` (via prisma)
- **شکست فعلی:** `init.ts:11` — `await import('./registry')` (dynamic import، lazy). این کار می‌کند اما شکننده است.
- **Severity:** `low` — فعلاً کار می‌کند، اما اگر کسی static import بنویسد → circular dependency crash.

### ۵.۵ — Magic Numbers

| فایل | خط | مقدار | توضیح |
|------|-----|-------|-------|
| `orders/service.ts` | inline | `Math.random() * 9000` | invoice number (در finance/service.ts:8) |
| `finance/service.ts` | 8 | `1000 + Math.random() * 9000` | invoice number — collision ممکن |
| `marketing/service.ts` | 174 | `600` | FAILURE_DELAY_MS — magic number |
| `customers/session/route.ts` | 12-13 | `10, 15*60_000, 30, 60*60_000, 600` | rate limit params |

### ۵.۶ — کد تکراری (DRY)

- **pagination parsing:** ۶ route مشابه `limit = Number(searchParams.get('limit')) || 20` دارند (finance, comms, shipping, marketing). باید از `parsePagination` مشترک استفاده کنند.
- **list endpoints:** الگوی `const [items, total] = await Promise.all([findMany, count])` در ۵ repository تکرار شده.
- **error handling:** `handleServiceError` در `_utils.ts` خوب است اما از `src/app/api/orders/` import شده (`../../products/_utils`) — مسیر نسبی شکننده.

---

## ۶) پیشنهادات بهبود

### ۶.۱ — Refactoring اولویت‌دار

| # | عنوان | فایل‌ها | اولویت |
|---|-------|--------|--------|
| R1 | حذف `unitPrice?` از CreateOrderInput | `orders/service.ts:14` | فاز ۱ |
| R2 | استانداردسازی قرارداد خطا | `_utils.ts` + همه routeها | فاز ۴ |
| R3 | استخراج `parsePagination` به shared middleware | ۶ فایل route | فاز ۴ |
| R4 | استخراج helper `parseLimit` با سقف | `finance, comms, shipping routes` | فاز ۴ |
| R5 | جایگزینی `console.*` با `logger` | ۴ فایل API | فاز ۵ |
| R6 | `CouponValidationError extends ValidationError` | `marketing/service.ts` | فاز ۲ |
| R7 | `InvalidStateTransitionError extends` یک DomainError مشترک | `orders/state-machine.ts` | فاز ۵ |
| R8 | magic bytes validation برای upload | `upload/route.ts` + `local.ts` | فاز ۲ |
| R9 | `for ... of` → batch Prisma query در `inventoryService.reserveItems` | `inventory/service.ts:6-10` | فاز ۳ |

### ۶.۲ — الگوهای طراحی پیشنهادی

| الگو | کاربرد | فایل |
|------|--------|------|
| **Unit of Work** | تراکنش‌های مالی که باید اتمیک باشند (Invoice + Transaction + OrderStatus) | `finance/service.ts` |
| **Strategy** | انتخاب provider (پرداخت، ایمیل، AI) — موجود اما بدون interface مشترک قوی | `payments/gateway.ts` |
| **Repository DI** | فعلاً singleton. تزریق از constructor برای تست‌پذیری | همه repositoryها |
| **State Machine** | موجود برای Order. برای Shipment هم اضافه شود | `shipping/service.ts` |
| **Retry with Backoff** | BullMQ دارد. برای fetch calls (zarinpal, anthropic) — `fetchJson` timeout دارد اما retry ندارد | `shared/fetch.ts` |
| **Idempotency Key** | PaymentIntent دارد. برای Order creation هم لازم است | `orders/service.ts` |

### ۶.۳ — بهینه‌سازی Performance

| مشکل | شدت | راه‌حل |
|------|------|--------|
| `inventoryService.reserveItems` — N+1 query (sequential for-loop) | high | یک `prisma.product.findMany` + `prisma.$transaction` |
| نبود cache-aside برای products list | medium | Redis cache + TTL 60s + invalidation روی product.created/updated |
| Outbox poll هر 5s بدون WHERE بهتر | low | `WHERE processedAt IS NULL AND retryCount < 5 AND createdAt < now() - interval '1s'` (جلوگیری از enqueue event تازه) |
| `orders.service.create` — `prisma.product.findMany` شامل همه فیلدها | low | فقط `select: { id, price, priceType, stockStatus, name }` — ✅ **موجود** |

---

## ۷) چک‌لیست امنیتی

| سوال | جواب | شاهد |
|------|:------:|-------|
| آیا PII در لاگ می‌ریزد؟ | ⚠️ **بله** | `comms/providers/console.ts:9-13` — body ایمیل (شامل PII) در pino لاگ می‌شود. `redactPII` فقط قبل از ارسال به AI استفاده می‌شود (`ai/safety.ts:18-22`)، نه در لاگ comms. |
| آیا rate limit روی APIهاست؟ | ✅/⚠️ | nginx: 10r/s عمومی. Login: per-IP + per-username. AI chat: 10/min. Coupon: 20/min. **اما** mutations (products POST, orders POST, upload POST) فقط nginx rate دارند. |
| آیا SQL injection ممکن است؟ | ✅ **خیر** | Prisma parameterized queries. هیچ raw SQL در کد نیست (`$queryRaw` فقط در health: `SELECT 1` ثابت). |
| آیا file upload محدود شده؟ | ⚠️ **ناقص** | MIME whitelist ✅. Folder regex ✅. Size limit ✅. nginx client_max_body_size ✅. **اما** بدون magic bytes ⚠️. بدون Content-Disposition header در nginx ⚠️. |
| آیا secretها در env و fail-closed هستند؟ | ✅ **بله** | `session-token.ts:23-27` — production بدون CUSTOMER_SESSION_SECRET → throw. `payments/gateway.ts` — بدون key → mock (safe default). `db.ts` — build بدون DB → Proxy. |
| آیا HMAC/timingSafeEqual درست است؟ | ✅ **بله** | `session-token-core.ts:36-41` — constant-time XOR comparison. استفاده در admin session + customer session + TOTP + password. |
| آیا webhook idempotent است؟ | ✅ **بله** | `webhook/zarinpal/route.ts:22-28` — `verifiedAt` چک. `InvalidStateTransitionError` نادیده گرفته می‌شود. |
| آیا XSS/CSRF با CSP+sameSite بسته است؟ | ⚠️ **ناقص** | `sameSite: 'lax'` ✅ (`customer-session.ts:23`). Security headers nginx ✅ (X-Frame-Options, X-Content-Type-Options). **اما** CSP header **نبود** در nginx.conf. باید `Content-Security-Policy` اضافه شود. |

---

## خلاصهٔ وضعیت بحرانی (نیاز به اقدام فوری)

| # | مشکل | Severity | فاز |
|---|-------|:--------:|:---:|
| C9 | جریان پول قطع — Invoice هرگز paid نمی‌شود | **critical** | ۰ |
| C11 | صفر migration — DB خالی در deploy | **critical** | ۰ |
| C3 | `/api/ai/chat` بدون auth | **high** | ۲ |
| C6 | Upload بدون magic bytes + بدون CSP | **high** | ۲ |
| C8 | ۶ endpoint بدون سقف perPage | **medium** | ۴ |
| C7 | perCustomerLimit race (limit>1) | **medium** | ۱ |
| C15 | سه فرمت خطای مختلف | **low** | ۴ |
| C12 | Outbox re-enqueue risk | **medium** | ۳ |
| C14 | ایندکس‌های مفقود (Transaction, OrderItem) | **medium** | ۳ |

---

## آیا فازبندی را شروع کنم؟

این گزارش کامل بخش **مرحله A** است. تمام فایل‌های کلیدی خوانده شدند، baseline اجرا شد، نقاط ضعف و قوت با ارجاع دقیق مستند شدند.

**منتظر تایید شما هستم تا فازبندی (مرحله B) را شروع کنم.**
