# برنامهٔ فازبندی اصلاحات باقی‌مانده — Saite

> **تاریخ:** ۱۴ اوت ۲۰۲۶
> **مبنا:** `docs/ANALYSIS-REPORT-2026-08-13.md` — موارد بحرانی (W1, W2, W3) و اصلاحات سریع (W4–W10) قبلاً در برنچ `arena/019ffd6d-saite` انجام و push شده‌اند.
> **این سند:** فقط موارد **باقی‌مانده** را به ۶ فاز اجرایی تبدیل می‌کند.
>
> **قوانین ثابت همهٔ فازها:**
> - امضای `src/lib/api.ts` تغییر نمی‌کند (Contract-first)
> - Mock adapterها حذف نمی‌شوند — فقط stub می‌مانند
> - بدون تغییر ساختار اصلی — فقط refactoring و بهبود
> - قبل از هر commit: `npm run type-check && npm run lint && npm run test && npm run build`

---

## نمای کلی فازها

| فاز | عنوان | اولویت | ریسک | حجم تقریبی | وابستگی |
|---|---|---|---|---|---|
| ۱ | Type Safety — حذف `as any` و سخت‌سازی مرز repository | 🔴 بالا | کم | ~۸ فایل | prisma generate |
| ۲ | Performance دیتابیس — ایندکس‌ها و pg_trgm | 🔴 بالا | متوسط (migration) | ۲ migration + schema | — |
| ۳ | امنیت تکمیلی — PII در لاگ، rate-limit جاماندهها، retention | 🟠 متوسط | کم | ~۷ فایل | — |
| ۴ | Jobs — انقضای PaymentIntent، مصرف idempotent، اصلاح retryCount | 🟠 متوسط | متوسط | ~۵ فایل | فاز ۳ (اختیاری) |
| ۵ | الگوهای طراحی — Registry، Unit of Work، helperهای مشترک | 🟡 پایین | کم | ~۱۰ فایل | فاز ۱ |
| ۶ | تست‌های integration واقعی — Postgres + race conditions | 🟡 پایین | کم | tests/ فقط | فاز ۱–۴ |

**ترتیب پیشنهادی اجرا: ۱ → ۲ → ۳ → ۴ → ۵ → ۶** (فازهای ۲ و ۳ مستقل‌اند و قابل موازی‌سازی)

---

## فاز ۱ — Type Safety: حذف `as any` و سخت‌سازی مرز repository

### هدف
حذف ۲۳ مورد `as any` که با کامنت «Prisma stub vs real» توجیه شده‌اند، و بستن مسیر `unknown → cast` که الان به «امید اینکه route حتماً Zod زده باشد» تکیه دارد.

### وضعیت فعلی (شمارش دقیق)
| فایل | تعداد `as any` |
|---|---|
| `src/server/modules/finance/repository.ts` | ۷ |
| `src/server/modules/orders/service.ts` | ۴ |
| `src/server/modules/shipping/repository.ts` | ۳ |
| `src/server/modules/orders/repository.ts` | ۳ |
| `src/server/modules/products/repository.ts` | ۲ (خطرناک‌ترین: `data as any` کامل) |
| `src/server/modules/marketing/repository.ts` | ۲ |
| `src/server/shared/event-bus.ts` | ۱ |
| `src/server/modules/marketing/service.ts` | ۱ |

### گام‌های اجرایی
1. **پیش‌نیاز:** `npx prisma generate` در محیطی با دسترسی شبکه (در sandbox فعلی باینری Prisma دانلود نمی‌شود — روی CI یا ماشین توسعه اجرا شود). تایپ‌های `Prisma.*Input` و `$Enums.*` در دسترس قرار می‌گیرند.
2. **`products/repository.ts`** — جایگزینی `data as any` با `Prisma.ProductCreateInput` / `Prisma.ProductUpdateInput`؛ فیلدهای اضافه در compile-time رد می‌شوند.
3. **`finance/repository.ts`** — `status as any` → `$Enums.InvoiceStatus`؛ `type as any` → `$Enums.TransactionType`؛ `metadata as any` → `Prisma.InputJsonValue`.
4. **`orders/service.ts`** — حذف `as any[]` از `prisma.product.findMany` (خط ۷۲) و `Map<string, any>`؛ تعریف تایپ `PricedProduct` از `Prisma.ProductGetPayload<{select:...}>`.
5. **`products/service.ts`** — تغییر `create(input: unknown, actorId)` به `create(input: CreateProductData, actorId)`؛ چون همهٔ routeها الان Zod دارند، caller تایپ‌شده است. (امضای HTTP تغییری نمی‌کند.)
6. **`shared/event-bus.ts`** — `payload as any` → `payload as Prisma.InputJsonValue`.
7. **نگاشت خطای Prisma در `handleServiceError`** — تشخیص `PrismaClientKnownRequestError`:
   - `P2002` (unique) → ۴۰۹ `CONFLICT` با پیام فارسی
   - `P2025` (not found) → ۴۰۴ `NOT_FOUND`
   - این کار slug/sku تکراری را از «۵۰۰ خطای سرور» به پاسخ معنادار تبدیل می‌کند.
8. **قاعدهٔ eslint** — افزودن `no-restricted-syntax` برای `TSAsExpression[typeAnnotation.typeName.name='any']` در `src/server/**` تا `as any` جدید وارد نشود (استثنا فقط با کامنت eslint-disable مستدل).

### معیار پذیرش
- `grep -rn "as any" src/server | grep -v eslint-disable` → حداکثر ۳ مورد مستدل (raw SQL casts)
- تست جدید: POST محصول با slug تکراری → ۴۰۹ نه ۵۰۰
- هر ۴ مرحلهٔ verify سبز

### دستورات git
```bash
git add src/server/modules/products/repository.ts src/server/modules/products/service.ts
git commit -m "تایپ‌ایمنی: جایگزینی as any با تایپ‌های تولیدی Prisma در ماژول محصولات"
git add src/server/modules/finance/repository.ts src/server/modules/orders/service.ts src/server/modules/orders/repository.ts src/server/modules/shipping/repository.ts src/server/modules/marketing/repository.ts src/server/shared/event-bus.ts
git commit -m "تایپ‌ایمنی: حذف as any از repository های finance، orders، shipping، marketing و event-bus"
git add src/server/shared/http-utils.ts tests/
git commit -m "نگاشت خطاهای Prisma به پاسخ HTTP معنادار — P2002 به ۴۰۹ و P2025 به ۴۰۴"
git add eslint.config.mjs
git commit -m "قاعده eslint: ممنوعیت as any جدید در src/server"
git push origin arena/019ffd6d-saite
```

---

## فاز ۲ — Performance دیتابیس: ایندکس‌ها و جستجوی trigram

### هدف
حذف full-scan از جستجوی محصولات و پوشش ایندکسی کوئری‌های پرتکرار پنل ادمین و مسیرهای عمومی.

### مشکلات فعلی
1. **جستجو** — `products/repository.ts:81-88`: چهار `contains insensitive` روی `name/model/sku/brand` = seq-scan کامل با رشد کاتالوگ.
2. **ایندکس‌های جامانده:**
   - `coupons(active, expiresAt)` — کوئری اعتبارسنجی کوپن
   - `campaigns(active, startDate, endDate)` — `listActiveCampaigns`
   - `posts(isPublished, publishedAt)` و `pages(isPublished)` — مسیرهای عمومی بلاگ/صفحات
   - `payment_intents(status, expiresAt)` — پاکسازی انقضا (پیش‌نیاز فاز ۴)
   - `email_logs(status, createdAt)` و `sms_logs(status, createdAt)` — retention (پیش‌نیاز فاز ۳)
3. **Sitemap** — `getProducts()` با `perPage: 10_000` همهٔ ستون‌ها (شامل `description` و `specs`) را می‌کشد؛ فقط `slug/updatedAt` لازم است.

### گام‌های اجرایی
1. **Migration اول — pg_trgm:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX IF NOT EXISTS products_name_trgm_idx  ON products USING GIN (name  gin_trgm_ops);
   CREATE INDEX IF NOT EXISTS products_model_trgm_idx ON products USING GIN (model gin_trgm_ops);
   CREATE INDEX IF NOT EXISTS products_sku_trgm_idx   ON products USING GIN (sku   gin_trgm_ops);
   CREATE INDEX IF NOT EXISTS products_brand_trgm_idx ON products USING GIN (brand gin_trgm_ops);
   ```
   + افزودن `postgresqlExtensions = [pg_trgm]` به `datasource` در schema (preview feature از قبل فعال است).
2. **Migration دوم — ایندکس‌های ترکیبی** (الگوی موجود `20260810130000` را دنبال کند: `CREATE INDEX IF NOT EXISTS` + کامنت فارسی):
   ```sql
   CREATE INDEX IF NOT EXISTS coupons_active_expiresAt_idx        ON coupons("active", "expiresAt");
   CREATE INDEX IF NOT EXISTS campaigns_active_dates_idx          ON campaigns("active", "startDate", "endDate");
   CREATE INDEX IF NOT EXISTS posts_isPublished_publishedAt_idx   ON posts("isPublished", "publishedAt");
   CREATE INDEX IF NOT EXISTS pages_isPublished_idx               ON pages("isPublished");
   CREATE INDEX IF NOT EXISTS payment_intents_status_expiresAt_idx ON payment_intents("status", "expiresAt");
   CREATE INDEX IF NOT EXISTS email_logs_status_createdAt_idx     ON email_logs("status", "createdAt");
   CREATE INDEX IF NOT EXISTS sms_logs_status_createdAt_idx       ON sms_logs("status", "createdAt");
   ```
   + همگام‌سازی `@@index` متناظر در `schema.prisma`.
3. **Endpoint سبک sitemap** — پشتیبانی `?fields=slug` در `GET /api/products` (فقط افزودن پارامتر اختیاری — contract نمی‌شکند): `select: { slug: true, updatedAt: true }` + `perPage` تا ۱۰٬۰۰۰ فقط برای این حالت. سپس `src/app/sitemap.ts` از آن استفاده کند (بدنهٔ `getProducts` در `lib/api.ts` دست نمی‌خورد؛ sitemap مستقیم `httpJson` یا service را صدا می‌زند).

### نکات ریسک
- `CREATE INDEX` بدون `CONCURRENTLY` روی جدول بزرگ قفل می‌گیرد — کاتالوگ فعلی کوچک است، مشکلی نیست؛ در runbook ذکر شود که روی دادهٔ بزرگ باید دستی با `CONCURRENTLY` اجرا شود (Prisma migration داخل تراکنش است و `CONCURRENTLY` نمی‌پذیرد).
- `CREATE EXTENSION` نیاز به superuser دارد — در `docker-entrypoint.sh` یا مستندات deploy لحاظ شود.

### معیار پذیرش
- `EXPLAIN ANALYZE` جستجوی `q=canon` → Bitmap Index Scan (نه Seq Scan)
- sitemap بدون کشیدن `description/specs`
- verify سبز

### دستورات git
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "کارایی: افزونه pg_trgm و ایندکس GIN برای جستجوی محصولات + ایندکس‌های ترکیبی کوپن، کمپین، محتوا و پرداخت"
git add src/app/api/products/route.ts src/server/modules/products/repository.ts src/server/modules/products/service.ts src/app/sitemap.ts
git commit -m "کارایی: پارامتر fields برای فهرست سبک محصولات و استفاده در sitemap"
git push origin arena/019ffd6d-saite
```

---

## فاز ۳ — امنیت تکمیلی: PII در لاگ، rate-limit جامانده، retention

### هدف
بستن سه شکاف چک‌لیست امنیتی: نشت PII در لاگ‌ها، mutationهای بدون سقف نرخ، و نگهداری بی‌انتهای لاگ‌های حاوی PII در DB.

### ۳.۱ — Redaction در pino
- `src/server/shared/logger.ts`: افزودن
  ```ts
  redact: {
    paths: ['to', '*.to', 'email', '*.email', 'phone', '*.phone', 'password', '*.password', 'authorization', '*.headers.authorization'],
    censor: '[REDACTED]',
  }
  ```
- نقاط نشت فعلی که پوشش می‌گیرند: `communications/providers/console.ts:20,49` و `smtp.ts:9` (ایمیل گیرنده)، و هر `logger.*({ to })` آینده.

### ۳.۲ — Rate-limit روی mutationهای جامانده
مسیرهای بدون سقف نرخ (فقط پشت RBAC) — شناسایی‌شده با grep:
| مسیر | سقف پیشنهادی |
|---|---|
| `api/marketing/coupons` POST | ۲۰/دقیقه (`coupon-create`) |
| `api/marketing/campaigns` POST | ۲۰/دقیقه (`campaign-create`) |
| `api/shipping/rates` POST | ۲۰/دقیقه (`shipping-rate-create`) |
| `api/shipping/shipments` POST | ۳۰/دقیقه (`shipment-create`) |
| `api/shipping/shipments/[id]` PATCH | ۳۰/دقیقه (`shipment-update`) |
| `api/products/[id]` PATCH/DELETE | ۳۰/دقیقه (`product-update`) |
| `api/content/pages/[slug]`, `posts/[slug]` PATCH/DELETE | ۳۰/دقیقه (`content-update`) |
| `api/orders/[id]` PATCH (لغو مشتری) | ۱۰/دقیقه (`order-cancel`) |
| `api/admin/emojis` POST/DELETE | ۳۰/دقیقه (`emoji-write`) |

الگو: همان `checkMutationRateLimit(req, prefix, max, 60_000)` در ابتدای handler — یکنواخت با بقیهٔ codebase.

### ۳.۳ — جدول متمرکز سقف‌ها
- فایل جدید `src/server/shared/rate-limit-policy.ts`: یک `const RATE_LIMITS = { 'order-create': {max:10, windowMs:60_000}, ... } as const` — همهٔ routeها از آن بخوانند؛ ممیزی امنیتی یک‌جا انجام شود.

### ۳.۴ — Retention لاگ‌های PII
- Job جدید `src/server/jobs/dispatchers/log-retention-dispatcher.ts` (فقط روی instance با `RUN_JOBS=1`):
  - `EmailLog`/`SmsLog` قدیمی‌تر از `LOG_RETENTION_DAYS` (پیش‌فرض ۹۰) → حذف
  - `OutboxEvent` پردازش‌شدهٔ قدیمی‌تر از ۳۰ روز → حذف
  - `AiUsageLog` قدیمی‌تر از ۱۸۰ روز → حذف
  - اجرا: روزی یک‌بار (poll ساده مثل الگوی `inventory-expiry`؛ مهاجرت به scheduler در فاز ۴)
- ثبت در `jobs/init.ts` + ثابت‌ها در `shared/constants.ts` (env-قابل‌تنظیم).

### معیار پذیرش
- لاگ ارسال ایمیل → `to: "[REDACTED]"`
- هیچ POST/PATCH/DELETE بدون rate-limit (تست grep-ای در tests)
- verify سبز

### دستورات git
```bash
git add src/server/shared/logger.ts
git commit -m "امنیت: redaction فیلدهای PII در pino — ایمیل، تلفن، رمز و هدر authorization"
git add src/server/shared/rate-limit-policy.ts src/app/api/marketing/ src/app/api/shipping/ src/app/api/products/ src/app/api/content/ src/app/api/orders/ src/app/api/admin/emojis/
git commit -m "امنیت: سقف نرخ برای همه mutation های جامانده با جدول سیاست متمرکز"
git add src/server/jobs/dispatchers/log-retention-dispatcher.ts src/server/jobs/init.ts src/server/shared/constants.ts
git commit -m "امنیت: job پاکسازی دوره‌ای لاگ‌های حاوی PII و outbox پردازش‌شده"
git push origin arena/019ffd6d-saite
```

---

## فاز ۴ — Jobs: انقضای PaymentIntent، مصرف idempotent، اصلاح retryCount

### هدف
بستن سه نقص عملیاتی در پردازش پس‌زمینه.

### ۴.۱ — انقضای PaymentIntent
- **مشکل:** `expiresAt` روی intent ست می‌شود ولی **هیچ‌کس** آن را expire نمی‌کند؛ intent با `redirectUrl` معتبر تا ابد `redirect_required` می‌ماند و `paymentsService.initialize` همان را برمی‌گرداند (کاربر به درگاه منقضی هدایت می‌شود).
- **راه‌حل:** در `inventory-expiry-dispatcher` (یا dispatcher جدید) `updateMany({ where: { status: { in: ['created','redirect_required','pending'] }, expiresAt: { lte: now } }, data: { status: 'expired' } })` + در `initialize` شرط `existing.expiresAt > now` قبل از بازگرداندن intent موجود (ایندکس فاز ۲ همین را پوشش می‌دهد).

### ۴.۲ — مصرف idempotent در outbox-worker
- **مشکل:** `outbox-worker.ts:158-161` — ثبت `processedAt` غیرشرطی است؛ با `concurrency: 5` و retry، دو job هم‌زمان می‌توانند side-effect (ایمیل) را دوبار بزنند.
- **راه‌حل:** ابتدای handler:
  ```ts
  const claimed = await prisma.outboxEvent.updateMany({
    where: { id: eventId, processedAt: null },
    data: { processedAt: new Date() },
  })
  if (claimed.count === 0) return // مصرف‌شده توسط job دیگر
  ```
  و در `catch`، برگرداندن `processedAt: null` تا retry ممکن بماند (یا الگوی `processingAt` جدا).

### ۴.۳ — معنای درست retryCount
- **مشکل:** `outbox-dispatcher.ts:36` — هر claim `retryCount` را زیاد می‌کند حتی وقتی پردازش موفق است؛ اگر worker کندتر از ۵ دورهٔ poll باشد، رویداد سالم DLQ می‌شود. ضمناً `outboxWorker.on('failed')` هم دوباره increment می‌کند (شمارش دوبل).
- **راه‌حل:** dispatcher به‌جای increment، فیلد `claimedAt` ست کند و شرط claim بشود `(claimedAt IS NULL OR claimedAt < now - interval '2 minutes')`؛ increment فقط در `on('failed')` بماند. نیاز به migration: ستون `claimedAt TIMESTAMP NULL` + جایگزینی ایندکس `(processedAt, createdAt)` با `(processedAt, claimedAt, createdAt)`.

### ۴.۴ — (اختیاری) مهاجرت از setInterval به BullMQ repeatable
- `outboxQueue.upsertJobScheduler('outbox-poll', { every: OUTBOX_POLL_MS })` — قفل داخلی BullMQ دوباره‌کاری بین instanceها را حذف می‌کند و job در UI/metrics دیده می‌شود. `setInterval` فعلی به‌عنوان fallback وقتی Redis نیست، حفظ شود.

### معیار پذیرش
- intent منقضی → `initialize` درگاه جدید می‌سازد
- تست: دو job موازی با یک eventId → فقط یک ایمیل
- رویداد موفق در اولین پردازش → `retryCount = 0`
- verify سبز

### دستورات git
```bash
git add src/server/payments/service.ts src/server/jobs/dispatchers/inventory-expiry-dispatcher.ts
git commit -m "پرداخت: انقضای PaymentIntent های قدیمی و رد intent منقضی در initialize"
git add src/server/jobs/workers/outbox-worker.ts
git commit -m "صف: مصرف idempotent رویدادهای outbox با claim شرطی processedAt"
git add prisma/schema.prisma prisma/migrations/ src/server/jobs/dispatchers/outbox-dispatcher.ts
git commit -m "صف: جداسازی claimedAt از retryCount — رویداد سالم دیگر به DLQ نمی‌رود"
git push origin arena/019ffd6d-saite
```

---

## فاز ۵ — الگوهای طراحی: Registry، Unit of Work، حذف تکرار

### هدف
کاهش هزینهٔ توسعهٔ آینده (افزودن درگاه/ماژول جدید) بدون تغییر رفتار.

### ۵.۱ — Registry برای providerهای پرداخت
- `payments/gateway.ts`: جایگزینی if/else با
  ```ts
  const PROVIDERS: Record<PaymentProviderCode, { adapter, envKey, name }> = {
    zarinpal: { adapter: zarinpalProvider, envKey: 'ZARINPAL_MERCHANT_ID', name: 'زرین‌پال' },
    idpay:    { adapter: idpayProvider,    envKey: 'IDPAY_API_KEY',        name: 'IDPay' },
  }
  ```
  افزودن درگاه سوم (سامان/به‌پرداخت) = یک سطر. mock همچنان فقط غیر-production. **fail-closed فعلی دقیقاً حفظ می‌شود.**

### ۵.۲ — Unit of Work سبک (تعمیم الگوی tx موجود)
- الگوی `inventoryRepository.reserveForOrder(tx, ...)` که درست است، به بقیه تعمیم یابد: متدهای نوشتاری repositoryهای orders/finance پارامتر اختیاری `tx?: Prisma.TransactionClient` بگیرند (پیش‌فرض `prisma`).
- سود فوری: `financeService.markInvoicePaid` بتواند update فاکتور + ثبت Transaction را در یک تراکنش انجام دهد (الان دو عمل جدا هستند — همان خانوادهٔ باگ W3).

### ۵.۳ — helper مشترک `paginatedList`
- `src/server/shared/repo-utils.ts`:
  ```ts
  export async function paginatedList<T>(model, { where, page, limit, orderBy, include })
  ```
  جایگزین ۶ کپی الگوی `[items,total] = Promise.all([findMany, count])` در finance/communications/shipping/marketing/content.

### ۵.۴ — `getSiteUrl()` متمرکز
- `src/server/shared/site-url.ts`: خواندن `NEXT_PUBLIC_SITE_URL` با validation (در production بدون مقدار → throw هنگام boot، نه fallback خاموش به localhost). جایگزین ۲ نقطهٔ فعلی (`payments/service.ts:8`، `webhook/zarinpal/route.ts`).

### ۵.۵ — TTLها و سقف‌های پراکنده به `shared/constants.ts`
- `PRODUCTS_LIST_TTL` (۶۰)، `SHIPPING_RATES_TTL` (۳۰۰) → constants با env-override.

### معیار پذیرش
- رفتار HTTP بدون تغییر (تست‌های موجود سبز)
- شمارش الگوی تکراری pagination در repositoryها → ۰
- verify سبز

### دستورات git
```bash
git add src/server/payments/gateway.ts
git commit -m "بازآرایی: Registry برای providerهای پرداخت به‌جای زنجیره if/else با حفظ fail-closed"
git add src/server/modules/finance/repository.ts src/server/modules/finance/service.ts src/server/modules/orders/repository.ts
git commit -m "بازآرایی: پارامتر tx اختیاری در repository ها و اتمیک‌سازی markInvoicePaid"
git add src/server/shared/repo-utils.ts src/server/communications/repository.ts src/server/modules/shipping/repository.ts src/server/modules/marketing/repository.ts src/server/modules/content/repository.ts
git commit -m "بازآرایی: helper مشترک paginatedList و حذف شش کپی الگوی صفحه‌بندی"
git add src/server/shared/site-url.ts src/server/shared/constants.ts src/server/payments/service.ts src/app/api/payments/webhook/zarinpal/route.ts src/server/modules/products/service.ts src/server/modules/shipping/service.ts
git commit -m "بازآرایی: getSiteUrl متمرکز با اعتبارسنجی env و انتقال TTL ها به constants"
git push origin arena/019ffd6d-saite
```

---

## فاز ۶ — تست‌های integration واقعی

### هدف
تست‌های `tests/integration/` فعلی همگی prisma را mock می‌کنند — منطق SQL خام (رزرو شرطی، SKIP LOCKED، advisory lock) که دقیقاً پرریسک‌ترین کد است، هرگز واقعاً اجرا نمی‌شود.

### گام‌های اجرایی
1. **پروفایل تست DB-دار** — `vitest.config.integration.ts` جدا با `include: ['tests/db-integration/**']` + اسکریپت `npm run test:db` (فقط وقتی `DATABASE_URL_TEST` ست است اجرا شود؛ در CI با service container postgres:17). تست‌های موجود دست نمی‌خورند.
2. **سناریوهای الزامی:**
   - **رزرو موازی:** ۲ سفارش هم‌زمان روی محصولی با ۱ موجودی → دقیقاً یکی موفق (اثبات `WHERE quantityOnHand - quantityReserved >= $1`)
   - **پرداخت دیرهنگام (W2):** رزرو → expire → confirm → کسر شرطی یا خطای دامنه‌ای
   - **گذار موازی (W3):** دو `transitionState(paid)` هم‌زمان → یک برنده، یکی `InvalidStateTransitionError`
   - **کوپن موازی:** ۵ apply هم‌زمان با `usageLimit=3` → دقیقاً ۳ redemption (advisory lock)
   - **webhook دوباره (W1):** verify موفق → کرش شبیه‌سازی‌شده قبل از transition → رویداد outbox موجود → worker جبران می‌کند
   - **outbox dispatcher موازی:** دو poll هم‌زمان → هیچ event دوبار enqueue نشود (SKIP LOCKED)
3. **e2e پرداخت mock** — سناریوی playwright: checkout → mock gateway → callback → داشبورد با `payment=success` (فقط در dev-mode با mock provider).
4. **CI** — به‌روزرسانی `docs/ci/ci.yml.npm` با job جدید `test-db` (postgres service + `prisma migrate deploy` + `npm run test:db`).

### معیار پذیرش
- ۶ سناریوی بالا سبز روی Postgres واقعی
- suite قدیمی (`npm run test`) بدون تغییر و سبز
- verify سبز

### دستورات git
```bash
git add vitest.config.integration.ts package.json tests/db-integration/
git commit -m "تست: پروفایل integration با Postgres واقعی برای رزرو موجودی، کوپن و گذار وضعیت"
git add e2e/payment-flow.spec.ts
git commit -m "تست: سناریوی e2e پرداخت با درگاه mock در حالت توسعه"
git add docs/ci/ci.yml.npm
git commit -m "CI: افزودن job تست دیتابیس با service container پستگرس"
git push origin arena/019ffd6d-saite
```

---

## جدول ردیابی (برای علامت‌گذاری پیشرفت)

| # | آیتم | فاز | وضعیت |
|---|---|---|---|
| ۱ | حذف `as any` با تایپ‌های Prisma | ۱ | ⬜ |
| ۲ | `create(input: unknown)` → تایپ صریح | ۱ | ⬜ |
| ۳ | نگاشت P2002→۴۰۹ / P2025→۴۰۴ | ۱ | ⬜ |
| ۴ | قاعدهٔ eslint ضد `as any` | ۱ | ⬜ |
| ۵ | pg_trgm + GIN روی products | ۲ | ⬜ |
| ۶ | ۷ ایندکس ترکیبی جامانده | ۲ | ⬜ |
| ۷ | endpoint سبک sitemap (`fields=slug`) | ۲ | ⬜ |
| ۸ | pino redact برای PII | ۳ | ⬜ |
| ۹ | rate-limit ۹ مسیر جامانده | ۳ | ⬜ |
| ۱۰ | جدول سیاست متمرکز rate-limit | ۳ | ⬜ |
| ۱۱ | retention لاگ‌های PII و outbox | ۳ | ⬜ |
| ۱۲ | انقضای PaymentIntent | ۴ | ⬜ |
| ۱۳ | مصرف idempotent outbox | ۴ | ⬜ |
| ۱۴ | جداسازی claimedAt از retryCount | ۴ | ⬜ |
| ۱۵ | BullMQ repeatable (اختیاری) | ۴ | ⬜ |
| ۱۶ | Registry پرداخت | ۵ | ⬜ |
| ۱۷ | Unit of Work (tx در repositoryها) | ۵ | ⬜ |
| ۱۸ | paginatedList مشترک | ۵ | ⬜ |
| ۱۹ | getSiteUrl متمرکز | ۵ | ⬜ |
| ۲۰ | تست‌های DB واقعی (۶ سناریو) | ۶ | ⬜ |
| ۲۱ | e2e پرداخت mock | ۶ | ⬜ |
| ۲۲ | CI job تست دیتابیس | ۶ | ⬜ |

> **یادداشت‌های خارج از scope این برنامه (تصمیم محصولی لازم):**
> - ساخت صفحهٔ عمومی `/orders/[id]` (الان redirect پرداخت به `/dashboard` می‌رود)
> - الگوهای فارسی prompt-injection در `ai/safety.ts` (نیاز به تعریف سیاست)
> - Docker secrets به‌جای env برای `DATABASE_URL` (تغییر فرآیند deploy)
> - پیاده‌سازی واقعی SMTP/S3/pgvector — TODO های فازبندی‌شدهٔ رسمی پروژه (فاز ۵ و ۸ roadmap)
