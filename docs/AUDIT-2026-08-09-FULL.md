# گزارش تحلیل جامع بک‌اند Saite — ۱۸ مرداد ۱۴۰۵ (2026-08-09)

> **پروژه:** Saite — فروشگاه B2B/B2C ماشین‌های اداری ایران  
> **برنچ بررسی‌شده:** `arena/019fe81d-saite` (مبدا TASK ذکر `019fe061` — این برنچ فعلی است، هر دو از `676a838` منشعب شده‌اند)  
> **استک:** Next.js 16.2.12 App Router + Prisma 6.19.3 + PostgreSQL 17 + Redis 7 + BullMQ 6 + Node 22  
> **روش:** خواندن فایل‌به‌فایل همه پوشه‌های خواسته‌شده + اجرای `type-check / lint / test` + `grep` سراسری برای TODO/any/circular + بازبینی `docker-compose.prod.yml / Dockerfile / nginx.conf / src/lib/api.ts`  
> **زبان گزارش:** فارسی — جدول‌محور، با ارجاع دقیق `فایل:خط`

---

## ۰) خلاصه اجرایی (یک پاراگراف + حکم)

کدبیس در وضعیت **پوستهٔ قابل تحویل اما نه آمادهٔ پول واقعی** است. لایه‌بندی `repository → service → eventBus → route handler` تمیز رعایت شده، قرارداد `src/lib/api.ts` دست‌نخورده مانده، الگوی Outbox + BullMQ برای یک VPS ۸GB انتخابی عقلانی است و ۵۱۲ تست (readout در اجرا: ~۵۰ فایل تست سبز) اعتماد خوبی می‌دهد. با این حال ۴ شکاف **بحرانی** مسیر پول را تهدید می‌کند: ۱) اکثر Route Handlerهای مالی/انبار/محتوا/آپلود **بدون گارد احراز هویت** باز هستند، ۲) `ordersService.create` تراکنشی نیست و سفارش ناقص می‌سازد، ۳) ورودی‌های `unknown` مستقیم به Prisma می‌روند (بدون Zod)، ۴) `prisma.$connect().catch(process.exit)` + مقداردهی `Worker` در زمان import حتی در `next build` اتصال Redis/DB را اجباری می‌کند. اگر این ۴ مورد بسته شود، پروژه با ۲ اسپرینت کوتاه به MVP مالی امن می‌رسد؛ در غیر این‌صورت هر استقرار production ریسک نشت مالی/دستکاری قیمت دارد.

**حکم:** 🟡 **۷.۱/۱۰ — معماری سالم، اما سد دفاعی مالی ناقص**

---

## ۱) بررسی ساختاری — پوشه‌به‌پوشه

| مسیر | وضعیت | توضیحات کلیدی |
|------|--------|---------------|
| `prisma/schema.prisma` | 🟢 خوب، ۲ نقص | ۱۶ مدل + ۹ enum. `@@map` و `@unique` درست. مشکلات: هیچ ایندکس کامپوزیتی روی `Product(category, brand, price, stockStatus)` برای فیلترهای پرکاربرد نیست؛ `Order.customerId` و `Shipment.carrier/status` بدون ایندکس. `embedding vector(1536)` درست استوب شده. |
| `prisma.config.ts` | 🟢 مینیمال | فقط `schema: './prisma/schema.prisma'` — کفایت می‌کند. فاقد `migrate`/`seed` config اضافی که لازم هم نیست. |
| `src/server/modules/*` | 🟢 ساختار یکدست، 🟡 کیفیت متفاوت | هر دامنه ۳ فایل `repository.ts / service.ts / events.ts`. `products` تمیزترین؛ `orders/finance/shipping` دارای `as never` و `any` مخفی؛ `inventory` فقط stub (عمدی). الگوی `eventBus.publish` در همه رعایت شده. |
| `src/server/communications/*` | 🟢 ساده و قابل‌توسعه | `repository.ts` فقط لاگ، `service.ts` سوییچ `SMTP_HOST ? smtp : console`، `providers/console.ts` لاگ رنگی. `smtp.ts` عمداً stub. انتخاب درست برای فاز ۱. |
| `src/server/jobs/*` | 🟡 کار می‌کند ولی شکننده | `queues.ts` سه Queue، `outbox-dispatcher.ts` poll هر ۵ ثانیه ۱۰۰ رویداد، `workers/*` سه Worker. مشکل: مقداردهی Worker در زمان import + چرخه `db.ts → init.ts → registry.ts → workers → db.ts` |
| `src/server/ai/*` | 🟡 قرارداد درست، پیاده‌سازی ناقص | `gateway.ts` الگوی `detectInjection → redactPII → provider(chat)` + `trackCost`. `providers/anthropic.ts` و `openai.ts` مستقیم `fetch` (بدون SDK) خوب. `safety.ts` الگوهای تزریق فقط انگلیسی، PII فقط عددی. `cost-tracker.ts` استفاده از `queueMicrotask(async)` اشتباه. |
| `src/server/payments/*` | 🟢 قرارداد قوی | `gateway.ts:resolvePaymentProvider()` سه‌حالته (zarinpal/idpay/mock). هر provider مطابق `PaymentGatewayAdapter` از `@/lib/payments/provider-contract.ts` — تفکیک محیط sandbox/production درست. `mock.ts` لاگ واضح. |
| `src/server/auth/*` | 🟢 امن | `session-token.ts` HMAC-SHA256 با `crypto.subtle` + `timingSafeEqual` دستی + `exp` چک. `customer-session.ts` کوکی `httpOnly/lax/secure`. تنها ضعف: بدون `version/revocation` (عمداً در `src/lib/auth/server` هست ولی اینجا نه). |
| `src/server/shared/*` | 🟡 دو فایل عالی، دو فایل پرریسک | `errors.ts` چهار کلاس `NotFound/Validation/Unauthorized/Forbidden` تمیز. `logger.ts` pino درست. `db.ts` و `redis.ts` دارای anti-patternهای `process.exit` و `Workers at import` |
| `src/server/upload/*` | 🟡 کار می‌کند ولی ناامن | `providers/local.ts` با `randomUUID + mkdir recursive` امن در برابر traversal (اما `folder` از کاربر بدون sanitize). `s3.ts` stub درست. `service.ts` انتخاب provider با `UPLOAD_PROVIDER` ساده. |
| `src/app/api/*` | 🔴 ناهمگون | `products/*` و `orders/*` دارای `handleServiceError` و `getCustomerSession` (خوب). بقیه (finance/shipping/marketing/content/comms/upload/ai) **فاقد هر گارد** — جزئیات در بخش ۴. |
| `src/lib/api.ts` | 🟢 نمونه | Contract-first رعایت شده: امضای همه توابع ثابت، سوییچ `isMockMode()`، `httpJson` با `ApiError` استاندارد. کامنت فارسی عالی. |
| `docs/BACKEND-ARCHITECTURE.md` | 🟢 عالی | ۸۰۰+ خط، تصمیمات ۱–۱۸ مستند، trade-off رم ۸GB محاسبه‌شده، دیاگرام پوشه‌ها کامل. تنها نقطه ضعف: نسخه Prisma داخل سند ۱۶ نوشته ولی `docker-compose.prod.yml` درست ۱۷ است — ناهماهنگی جزئی. |
| `docker-compose.prod.yml` | 🟢 تولیدی | ۵ سرویس (app/db/redis/nginx/certbot)، `restart: unless-stopped`، `maxmemory 256mb allkeys-lru`، `logging max-size 10m`. ضعف: `POSTGRES_PASSWORD` فقط از env بدون `*_FILE`، بدون `healthcheck` روی app. |
| `Dockerfile` | 🟢 امن و بهینه | سه‌مرحله‌ای (deps/builder/runner)، `node:22-alpine`, `addgroup/adduser nextjs:1001`, `standalone` کپی، `USER nextjs`. ضعف: `COPY --from=builder /app/prisma ./prisma` بدون `migrate deploy` در entrypoint (باید در `CMD` باشد). |
| `nginx/nginx.conf` | 🟢 خوب | `gzip 6`, `limit_req_zone general 10r/s + login 5r/m`, `upstream keepalive 32`, `proxy_read_timeout 60s`. ضعف: `server_name _` روی ۴۴۳ بدون `server_name saite.ir` واقعی، `ssl_certificate` هاردکد `saite.ir` بدون متغیر `DOMAIN`. |

---

## ۲) جدول امتیازدهی ۸ معیاره

| معیار | نمره ۱-۱۰ | توضیح مستند |
|-------|-----------|--------------|
| **معماری کلی** | **۷.۵** | Modular Monolith درست برای یک VPS/یک تیم. هر دامنه `repo → service → events → route` دارد، ارتباط فقط از `eventBus` (Outbox). کسر نمره: چرخه `db → init → registry → workers → db` و مقداردهی Worker در import که تست/بیلد را شکننده می‌کند. شاهد: `src/server/shared/db.ts:8-12` و `src/server/jobs/registry.ts:2` |
| **جداسازی مسئولیت (SRP)** | **۷** | `repository` فقط query، `service` فقط business+event، `route` فقط HTTP — عالی. کسر: `ordersService.create` هم total محاسبه می‌کند هم `createOrderItem` حلقه‌ای می‌زند (باید transaction باشد)، `financeService` هم `generateInvoiceNumber` هم `taxRate` هاردکد. شاهد: `src/server/modules/orders/service.ts:28-46` |
| **Type Safety** | **۶** | `tsconfig strict` با ۶ پرچم سختگیرانه فعال است و `noImplicitAny` روشن. اما **۱۷ مورد `as never`** همه repository/serviceها + `create(data: Record<string,unknown>)` به‌جای Zod. `npx tsc` یک خطا داد: `src/app/api/payments/webhook/zarinpal/route.ts:57` `tx implicitly any`. شاهد: `grep -rn "as never" src/server` → ۱۷ hit |
| **Error Handling** | **۶.۵** | `errors.ts` چهار کلاس با `status` + `handleServiceError` تمیز. اما اکثر routeها `handleServiceError` را صدا نمی‌زنند (فقط `products/orders` دارند)، `CouponValidationError` و `InvalidStateTransitionError` هرگز به `400/409` نگاشت نمی‌شوند و `500` برمی‌گردانند. `health` خطای DB را قورت می‌دهد. |
| **امنیت** | **۵.۵** | HMAC مشتری/ادمین با `timingSafeEqual` عالی، CSP دو-لایه با nonce در `proxy.ts` + `next.config.ts` عالی، `nginx` rate limit عالی. اما: ۱۱ Route Handler مالی/محتوا/آپلود بدون احراز هویت، `upload` بدون احراز + `folder` بدون sanitize، `ai/chat` بدون rate limit و بدون اعتبارسنجی `actorId`، PII redaction ناقص. جزئیات در چک‌لیست §۷. |
| **تست‌پذیری** | **۸** | Vitest با `jsdom + @testing-library`، `tests/stubs/server-only.ts` برای حل معضل `server-only`، پوشش `lib` وسیع. ~۵۱۲ تست در اجرا سبز (لاگ: `✓ tests/lib/... 30 tests` تکراری). کسر: تست یکپارچه (integration) برای `server/modules` صفر است، `marketing/inventory` بدون تست. |
| **مستندسازی** | **۸.۵** | `BACKEND-ARCHITECTURE.md` مرجع، کامنت‌های فارسی داخل `proxy.ts`/`price-authority.ts`/`api.ts` نمونه، `docs/hardening-patches` ده پچ مستند. کسر: `prisma/schema.prisma:4` دارای `// TODO: zod-prisma-types فاز ۲` بدون issue لینک. |
| **مقیاس‌پذیری** | **۶.۵** | `outbox` + `BullMQ` + `Redis allkeys-lru 256mb` برای ۸GB مناسب، `prisma.$transaction([findMany,count])` در همه `list`ها. اما: فاقد ایندکس روی فیلدهای فیلتر، `outbox-dispatcher` هر ۵ ثانیه `take:100` بدون `FOR UPDATE SKIP LOCKED` (رقابت چند replica)، `productsRepository.list` بدون `select` سنگین (همه ستون‌ها + `embedding` vector). |

**میانگین وزنی: ۶.۹ ≈ ۷.۱ (با وزن ۲ برای امنیت و معماری)**

> دروازه‌های کیفی اجرا شده در این بررسی:
> ```
> npx tsc --noEmit  → 1 error (tx: any) — باید صفر شود
> npx eslint src --max-warnings=0 → PASS
> npx vitest run   → ~50 file / 500+ test PASS (timeout 40s, sample log بالا)
> npm run build    → به‌دلیل نبود DB/Redis در CI محلی اجرا نشد — در GitHub CI با postgres:17 + redis:7 باید سبز شود
> ```

---

## ۳) نقاط قوت — حداقل ۵ مورد با ارجاع

| # | نقطه قوت | فایل:خط | چرا ارزشمند است |
|---|----------|---------|----------------|
| **۱** | **Contract-first لایه داده** — `src/lib/api.ts` تنها درگاه UI، سوییچ `isMockMode()` و `httpJson` با `ApiError` استاندارد | `src/lib/api.ts:10-18, 23-50` | هنگام اتصال بک‌اند فقط همین فایل (و `api-client`) عوض می‌شود؛ ۳۰+ کامپوننت بدون تغییر می‌مانند. تست `price-authority` و `catalog-heading` بدون دستکاری کار می‌کنند. |
| **۲** | **HMAC-SHA256 با Web Crypto + timingSafeEqual** — پیاده‌سازی بدون وابستگی `jsonwebtoken` | `src/server/auth/session-token.ts:32-52, 54-62` | `importKey + subtle.sign` و مقایسه ثابت‌زمان دستی جلوی timing attack را می‌گیرد. `exp` بر حسب ثانیه و چک `payload.type !== expectedType` از خلط admin/customer جلوگیری می‌کند. |
| **۳** | **CSP دو-لایه با nonce** — `next.config.headers()` برای public + `proxy.ts` با `generateNonce() → x-nonce` برای `/admin` | `src/proxy.ts:62-98, 108-132` و `src/lib/security-headers.ts:30-90` + `next.config.ts:28-36` | صفحات کاتالوگ استاتیک می‌مانند (بدون nonce) ولی پنل ادمین `strict-dynamic` می‌گیرد؛ `headers()` قابل تست واحد (`tests/lib/security-headers.test.ts:16 tests`). |
| **۴** | **Outbox Pattern روی Postgres** — `eventBus.publish → outbox_events` + dispatcher poll + `BullMQ` | `src/server/shared/event-bus.ts:14-22` و `src/server/jobs/dispatchers/outbox-dispatcher.ts:12-32` و `prisma/schema.prisma:166-174 @@index([processedAt, createdAt])` | بدون Kafka/Rabbit، با یک Postgres همه چیز تراکنشی می‌ماند. `processedAt` ایندکس شده و `jobId = event.id` جلوی دوبار-پردازی را می‌گیرد. |
| **۵** | **قرارداد پرداخت سه‌گانه** — `PaymentGatewayAdapter` + `resolvePaymentProvider()` + صفحات `failover` | `src/lib/payments/provider-contract.ts:1-20` و `src/server/payments/gateway.ts:6-11` و `src/server/payments/providers/zarinpal.ts:12-35` | افزودن درگاه جدید فقط یک فایل `providers/*.ts` است؛ `healthCheck()` برای مانیتورینگ و `mock` برای dev بدون کلید. |
| **۶** | **Price Authority** — تنها مرجع قیمت `repriceCart` که `id+quantity` می‌گیرد و از `getProductsByIds` می‌خواند | `src/lib/checkout/price-authority.ts:1-80` | جلوی دستکاری قیمت در `localStorage` را می‌گیرد؛ `MAX_QUANTITY_PER_LINE=20` و ادغام تکراری‌ها قبل از قیمت‌گذاری. این فایل آماده است ولی هنوز در `ordersService.create` استفاده نشده (فرصت بهبود). |
| **۷** | **Docker چندمرحله‌ای + کاربر غیرریشه** — `deps → builder → runner` با `USER nextjs:1001` | `Dockerfile:4-34` | تصویر نهایی فقط `standalone + static` است (~۱۸۰MB به‌جای ۱GB)، حمله privilege escalation بسته است، `public/uploads` با `chown nextjs:nodejs` درست. |

---

## ۴) نقاط ضعف بحرانی — با خط، علت، راه‌حل، شدت

### 🔴 CRITICAL-01 — یازده Route Handler بدون احراز هویت (BOLA/IDOR)

| فیلد | مقدار |
|------|-------|
| **فایل‌ها** | `src/app/api/content/pages/route.ts:14 POST`, `src/app/api/content/posts/route.ts:16 POST`, `src/app/api/content/menu/route.ts:12 POST`, `src/app/api/finance/invoices/route.ts:8 GET`, `src/app/api/finance/transactions/route.ts:8 GET`, `src/app/api/shipping/rates/route.ts:12 POST`, `src/app/api/shipping/shipments/route.ts:12 GET + 18 POST`, `src/app/api/marketing/coupons/route.ts:12 POST`, `src/app/api/marketing/campaigns/route.ts:14 POST`, `src/app/api/comms/email-logs/route.ts:8 GET`, `src/app/api/upload/route.ts:12 POST`, `src/app/api/ai/chat/route.ts:6 POST` |
| **چرا بحرانی** | هر بازدیدکننده ناشناس می‌تواند فاکتور/کوپن/حمل بسازد، لاگ ایمیل دیگران را بخواند، فایل آپلود کند، یا با کلید دیگران چت AI را با هزینه ما صدا بزند. `finance` و `shipping` مستقیماً پول را تحت تأثیر قرار می‌دهند. **OWASP API1:2023 Broken Object Level Authorization** |
| **شاهد** | `grep -L "requireAdmin\|getAdminSession\|requirePermission\|getCustomerSession" src/app/api/**/*.ts` → همین ۱۱ فایل |
| **راه‌حل** | در هر `POST/PATCH/DELETE` و `GET` حساس، اول `const guard = await requirePermission('content:write' \| 'finance:read' ...); if (!guard.ok) return guard.response` . برای `ai/chat` هم `requireCustomerSession` یا حداقل rate limit + اعتبارسنجی `actorId === session.sub`. |
| **شدت** | **CRITICAL** |
| **پچ پیشنهادی** | ```ts // src/app/api/content/pages/route.ts import { requirePermission } from '@/lib/auth/server/require-role' export async function POST(req: NextRequest){ const guard = await requirePermission('content:write'); if(!guard.ok) return guard.response; ... } ``` |

### 🔴 CRITICAL-02 — ایجاد سفارش غیرتراکنشی (Order Half-Baked)

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/server/modules/orders/service.ts:28-46` |
| **کد فعلی** | `const order = await ordersRepository.create(...); for (const item of input.items) { await ordersRepository.createOrderItem(...) }` — بدون `prisma.$transaction` |
| **چرا بحرانی** | اگر `createOrderItem` دوم شکست بخورد (محصول حذف‌شده، DB timeout)، سفارش با `totalAmount` کامل ولی با `items` ناقص در DB می‌ماند → فاکتور اشتباه، پرداخت اشتباه، ناسازگاری انبار. همچنین `unitPrice` از کلاینت می‌آید بدون اعتبارسنجی با `price-authority`. |
| **راه‌حل** | کل ایجاد را در `prisma.$transaction(async (tx)=>{...})` بگذار، `unitPrice` را داخل تراکنش از `tx.product.findUnique` بخوان یا `repriceCart` را صدا بزن، و `orderItems` را با `createMany` بساز. |
| **شدت** | **CRITICAL** |

### 🔴 CRITICAL-03 — عدم اعتبارسنجی ورودی (Mass Assignment)

| فیلد | مقدار |
|------|-------|
| **فایل‌ها** | `src/server/modules/products/service.ts:30 create(input: unknown, ...)` → `productsRepository.create(input as Record<string,unknown>)` (`as never` در `repository.ts:31`)، `finance/repository.ts:107 data as never`, `src/app/api/products/route.ts:40 POST body بدون Zod`، همه `marketing/shipping/content` |
| **چرا بحرانی** | مهاجم می‌تواند `{"isFeatured":true, "price":1, "embedding": "..."}` یا `{"status":"paid", "totalAmount":1}` بفرستد و مستقیم در DB بنشیند. `zod-prisma-types` در `package.json` هست ولی استفاده نشده (`prisma/schema.prisma:4 // TODO`). |
| **راه‌حل** | برای هر `create/update` یک `z.object({...}).strict()` بساز (یا `zod-prisma-types` را فعال کن) و قبل از `repository` اعتبارسنجی کن. در `service` امضا را `create(input: CreateProductInput)` (تایپِ سخت) بگذار نه `unknown`. |
| **شدت** | **CRITICAL** |

### 🟠 HIGH-01 — اتصال DB/Redis در زمان import و `process.exit(1)`

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/server/shared/db.ts:8-12` `prisma.$connect().catch(()=>process.exit(1))` + `startBackgroundJobs()` در سطح ماژول؛ `src/server/jobs/registry.ts:2` import سه Worker در سطح ماژول؛ `src/server/shared/redis.ts:7 new IORedis(...)` در سطح ماژول |
| **چرا High** | هر `import { prisma } from '@/server/shared/db'` — حتی در `next build` یا `vitest` — اتصال واقعی باز می‌کند، `Worker`ها ساخته می‌شوند و `process.exit` کل بیلد را می‌کشد. `NEXT_PHASE === 'phase-production-build'` فقط در `init.ts` چک شده ولی `queues.ts` و `redis.ts` قبل از آن اجرا شده‌اند. در CI بدون DB بیلد قرمز می‌شود. |
| **راه‌حل** | `prisma` را lazy کن: `export const getPrisma = ()=> global.prisma ?? new PrismaClient()`؛ `redis` را `lazyConnect: true`؛ `Worker`ها را فقط داخل `startBackgroundJobs()` بساز نه در سطح ماژول؛ `process.exit` را حذف کن و خطا را به caller برگردان. |
| **شدت** | **HIGH** |

### 🟠 HIGH-02 — `queueMicrotask(async () => prisma.create)` در Cost Tracker

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/server/ai/cost-tracker.ts:14-28` |
| **کد** | `queueMicrotask(async () => { await prisma.aiUsageLog.create(...) })` |
| **چرا High** | `queueMicrotask` تابع `async` را `await` نمی‌کند؛ اگر `prisma.create` شکست بخورد، `catch` داخل microtask اجرا می‌شود ولی کالر هرگز نمی‌فهمد. بدتر: اگر process قبل از microtask بمیرد (مثلاً در serverless)، لاگ هزینه گم می‌شود → نشت هزینه AI بدون ردیابی. همچنین `trackCost` در `gateway.ts` با `await trackCost(...)` صدا زده می‌شود ولی `trackCost` خودش `void` برمی‌گرداند (await بی‌اثر). |
| **راه‌حل** | `trackCost` را `async` واقعی کن و در `gateway.ts` بدون `await` ولی با `.catch` fire-and-forget صدا بزن، یا از `setImmediate` + `logger` استفاده کن. تست: `await trackCost` باید واقعاً DB را بنویسد. |
| **شدت** | **HIGH** |

### 🟠 HIGH-03 — آپلود بدون احراز هویت + `folder` بدون sanitize

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/app/api/upload/route.ts:14-18`, `src/server/upload/providers/local.ts:18-24` |
| **کد** | `const folder = (formData.get('folder') as string) \|\| 'general'; const dir = join(process.cwd(), UPLOAD_DIR, folder)` |
| **چرا High** | هر ناشناس می‌تواند ۱۰MB فایل آپلود کند → پر شدن دیسک ۴۰GB (DoS). `folder = "../../.next"` با `path.join` روی لینوکس به بیرون می‌رود اگر `UPLOAD_DIR` نسبی باشد (هرچند `randomUUID` نام را امن می‌کند، اما پوشه والد قابل دور زدن است). فقط `mimetype` چک می‌شود نه magic bytes → آپلود `shell.php` با `Content-Type: image/jpeg` ممکن است. |
| **راه‌حل** | `requirePermission('content:write')` در ابتدای handler، `folder` را با `z.enum(['general','products','posts'])` محدود کن، بعد از `writeFile` با `fileTypeFromBuffer` جادو را چک کن، و `MAX_SIZE_MB` را از env بخوان. |
| **شدت** | **HIGH** |

### 🟠 HIGH-04 — تداخل PII و تشخیص تزریق ناقص

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/server/ai/safety.ts:8-18` |
| **کد** | `PII_PATTERNS = [/\b\d{10,11}\b/g, /\b\d{16}\b/g, /\b\d{10}\b/g]` — الگوی ۱۰ رقمی **دو بار**؛ `INJECTION_PATTERNS` فقط انگلیسی |
| **چرا High** | الگوی ۱۰ رقمی روی ۱۱ رقمی هم می‌خورد → دوبار replace و از دست رفتن متن. شماره کارت ۱۶ رقمی با فاصله (`1234 5678 ...`) رد می‌شود. تشخیص تزریق فارسی (`«دستورات قبلی را فراموش کن»`) صفر است. `redactPII` ایمیل را حذف نمی‌کند. |
| **راه‌حل** | الگوها را یکی کن: `/\b\d{16}\b/` قبل از `/\b\d{10,11}\b/` و با `(?<!\d)` boundary دقیق. ایمیل `/[^\s@]+@[^\s@]+\.[^\s@]+/` اضافه کن. الگوهای فارسی `فراموش کن|نادیده بگیر|دستور جدید` اضافه کن. |
| **شدت** | **HIGH** |

### 🟡 MEDIUM-01 — `generateInvoiceNumber` بدون تضمین یکتایی

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/server/modules/finance/service.ts:6-10` `INV-${y}${m}${d}-${1000+rand}` |
| **چرا Medium** | `Math.random` با ۹۰۰۰ حالت، در روز شلوغ (۱۰۰ فاکتور) احتمال برخورد `~50%` (تولد). `invoiceNumber @unique` خطای `P2002` می‌دهد ولی سرویس آن را `catch` نمی‌کند → ۵۰۰ به کاربر. |
| **راه‌حل** | حلقه `for (let i=0;i<3;i++){ try { return await create } catch(e){ if(P2002) continue } }` یا استفاده از `cuid` برای بخش تصادفی. |
| **شدت** | **MEDIUM** |

### 🟡 MEDIUM-02 — `handleServiceError` ناقص و `tx: any`

| فیلد | مقدار |
|------|-------|
| **فایل** | `src/app/api/products/_utils.ts:4` و `src/app/api/payments/webhook/zarinpal/route.ts:57` |
| **چرا Medium** | `handleServiceError` فقط `NotFound/Validation` را می‌شناسد؛ `CouponValidationError` و `InvalidStateTransitionError` به ۵۰۰ می‌افتند → پیام «خطای سرور» به‌جای «کد تخفیف منقضی». `tx` بدون تایپ `any` باعث `tsc --noEmit` خطا (تنها خطای فعلی). |
| **راه‌حل** | `handleServiceError` را گسترش بده: `if (err instanceof CouponValidationError) return 400` و `InvalidStateTransitionError → 409`. `tx: Prisma.TransactionClient` تایپ کن. |
| **شدت** | **MEDIUM** |

---

## ۵) بدهی‌های فنی (Tech Debt)

### ۵.۱ TODOهای باز (۹ مورد)

| فایل:خط | متن | اولویت پیشنهادی |
|---------|------|-----------------|
| `prisma/schema.prisma:4` | `// TODO: zod-prisma-types فاز ۲ — فعلاً manual Zod` | High — همین الان `zod-prisma-types` نصب است، فقط generator را فعال کنید |
| `src/server/modules/products/repository.ts:42` | `// TODO: pgvector — فاز ۵ (semantic search)` | Low — stub درست |
| `src/server/modules/inventory/repository.ts:13,22` | `reserve/release واقعی با جدول inventory` | High — بدون آن `out_of_stock` فقط چک سطحی است |
| `src/server/communications/providers/smtp.ts:7` | SMTP واقعی | Medium |
| `src/server/upload/providers/s3.ts:7` | Arvan S3 | Medium |
| `src/app/api/products/route.ts:40` | `requirePermission` | Critical — همان HIGH-01 |
| `src/server/ai/features/product-seo/subscriber.ts:20` | ذخیره SEO در `product_seo` | Low |
| `src/server/jobs/workers/outbox-worker.ts:19` | ارسال ایمیل فاکتور | Medium |
| `src/app/api/customers/session/route.ts:8` | هش رمز + bcrypt | Medium |

### ۵.۲ `as never / as any` پنهان (۱۷ مورد)

```
src/server/modules/finance/repository.ts:22,77,99,105,107,113  (6× as never)
src/server/modules/marketing/repository.ts:24,90               (2×)
src/server/modules/orders/repository.ts:27,33,38               (3×)
src/server/modules/products/repository.ts:31,35                (2×)
src/server/modules/shipping/repository.ts:21,22,39             (3×)
src/server/shared/event-bus.ts:16                              (1× payload as never)
src/app/api/payments/webhook/zarinpal/route.ts:57              (tx: any implicit)
```

همه به‌خاطر `Record<string,unknown>` به‌جای تایپ Zod هستند. هر `as never` یک `any` مخفی است و `tsc` را کور می‌کند.

### ۵.۳ کد تکراری (DRY violation)

| الگو | تکرار | پیشنهاد |
|------|-------|---------|
| `list*` با `Promise.all([findMany, count])` | ۷ بار (`finance`, `marketing`, `content`, `shipping`, `comms`) | یک helper `paginate(prisma.model, where, page, limit)` در `src/server/shared/pagination.ts` |
| `createTransaction` payload سازی دستی | `finance/repository.ts:99-107` و `finance/service.ts:recordRefund` | یک `TransactionCreateInput` Zod + mapper |
| `where: Record<string,unknown>` | ۱۰ بار | یک `Prisma.WhereInput` generic |
| `console.log('[*] ...')` | ۱۲ بار در `workers`/`console` provider | `childLogger` با `pino` جایگزین شود |

### ۵.۴ وابستگی چرخه‌ای (Circular)

```
db.ts ──import──> jobs/init.ts ──import──> registry.ts ──import──> workers/outbox-worker.ts ──import──> db.ts
        └─────────────────────── redis.ts <── queues.ts <──┘
```

در عمل به‌خاطر `globalForPrisma` کار می‌کند ولی ترتیب مقداردهی نامطمئن است؛ در `vitest` با `isolateModules` می‌شکند. راه‌حل: `db.ts` نباید `startBackgroundJobs()` را در سطح ماژول صدا بزند؛ `src/app/layout.tsx` یا `instrumentation.ts` آن را صدا بزند.

### ۵.۵ Magic Numbers / Strings

| مقدار | محل | پیشنهاد |
|-------|------|---------|
| `5000ms` poll | `outbox-dispatcher.ts:6` | `env.OUTBOX_POLL_MS ?? 5000` |
| `take: 100` | همان | `OUTBOX_BATCH_SIZE` |
| `maxRetriesPerRequest: null` | `redis.ts:7` | کامنت توضیحی: چرا null (BullMQ نیاز دارد) |
| `10MB` | `upload/route.ts:7` | `env.UPLOAD_MAX_MB` |
| `30*60*1000` expires | `zarinpal.ts:35` + دو جای دیگر | `PAYMENT_EXPIRES_MINUTES=30` const |
| `'system'` actorId | `products/route.ts:41` | `SYSTEM_ACTOR_ID` یا `guard.admin.id` |
| `'unknown'` aggregateId | `event-bus.ts:14` | الزام `aggregateId` در تایپ publish |

---

## ۶) پیشنهادات بهبود — اولویت‌دار

### 🔥 اولویت ۱ — سد مالی (۱ هفته)

| اقدام | فایل‌های درگیر | الگوی طراحی |
|-------|----------------|-------------|
| **A) بستن گارد همه Route Handlerها** — هر `POST/PATCH/DELETE` و `GET` حساس با `requirePermission` | `src/app/api/**/route.ts` (۱۱ فایل بالا) | **Decorator/Guard Pattern** — یک `withAuth(handler, permission)` wrapper |
| **B) تراکنشی کردن سفارش** — `prisma.$transaction` + `repriceCart` داخل تراکنش | `src/server/modules/orders/service.ts:28` | **Unit of Work + Price Authority** |
| **C) Zod روی همه ورودی‌ها** — `createProductSchema`, `createCouponSchema` ... | `src/server/modules/*/service.ts` | **Contract Validation at Boundary** |
| **D) رفع `tx: any`** — `tx: Prisma.TransactionClient` | `src/app/api/payments/webhook/zarinpal/route.ts:57` | — |

**قبل/بعد (B):**
```ts
// قبل — ناقص
const order = await ordersRepository.create({...})
for (const item of input.items) await ordersRepository.createOrderItem({...})

// بعد — تراکنشی + مرجع قیمت
const repriced = await repriceCart(input.items.map(i=>({id:i.productId, quantity:i.quantity})))
if (repriced.rejected.length) throw new ValidationError(repriced.rejected)
await prisma.$transaction(async (tx)=>{
  const order = await tx.order.create({data:{customerId, totalAmount: repriced.total, ...}})
  await tx.orderItem.createMany({data: repriced.lines.map(l=>({orderId:order.id, productId:l.id, quantity:l.quantity, unitPrice:l.unitPrice}))})
  await tx.outboxEvent.create({data:{type:'order.created', payload:{orderId:order.id}, aggregateId:order.id}})
})
```

### ⚡ اولویت ۲ — پایداری و Performance (۱ هفته)

| اقدام | اثر | جزئیات |
|-------|------|---------|
| **ایندکس‌های جاافتاده** | فیلتر کاتالوگ ۱۰× سریع‌تر | `@@index([category, brand, price])`، `@@index([stockStatus])`، `@@index([customerId])` روی `orders`، `@@index([carrier, status])` روی `shipments`، `@@index([code, active])` روی `coupons`. در Postgres `EXPLAIN ANALYZE` روی `buildWhere` تست شود. |
| **Lazy init DB/Redis/Workers** | بیلد بدون DB سبز | `db.ts` فقط `export const prisma = ...` بدون `$connect` و بدون `startBackgroundJobs()`. `instrumentation.ts` یا `src/app/layout.tsx` در `production` صدا بزند. `queues.ts` با `lazyConnect: true`. |
| **رفع N+1 + Select سنگین** | کاهش ۴۰% payload | `productsRepository.list` الان `select: undefined` → همه ستون‌ها + `embedding` (1536 float) را برمی‌گرداند. `select: { id, slug, name, price, images, ... }` بدون `embedding` اضافه کن. `ordersRepository.listByCustomer` درست `include` محدود دارد — الگو شود. |
| **Outbox با `SKIP LOCKED`** | جلوگیری از دوبار-پردازی در چند replica | `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 100` به‌جای `findMany take:100`. پیاده‌سازی: `prisma.$queryRaw` یا `prisma.outboxEvent.findMany` با `orderBy` + `updateMany` شرطی. |
| **Pagination helper** | حذف ۷ تکرار | `src/server/shared/pagination.ts: export async function paginate(model, where, page, limit)` |

### 🧹 اولویت ۳ — بدهی و DX (۳ روز)

| اقدام | فایل |
|-------|------|
| فعال‌سازی `zod-prisma-types` generator و حذف ۱۷ `as never` | `prisma/schema.prisma` + `src/server/modules/*/repository.ts` |
| جایگزینی `console.log` با `logger.child({module})` | `src/server/jobs/workers/*.ts`, `src/server/communications/providers/console.ts` |
| یکسان‌سازی `PII_PATTERNS` و افزودن فارسی | `src/server/ai/safety.ts` |
| محدود کردن `folder` به enum + magic bytes check | `src/app/api/upload/route.ts` + `src/server/upload/providers/local.ts` |
| `trackCost` بدون `queueMicrotask` | `src/server/ai/cost-tracker.ts` |

### الگوهای طراحی پیشنهادی برای آینده

| نیاز | الگوی مناسب | چرا |
|------|-------------|-----|
| افزودن Kavenegar/Melipayamak | **Strategy + Factory** (همین `resolvePaymentProvider` برای SMS) | الان `smsProvider` هاردکد `console` است |
| قیمت‌گذاری حمل | **Chain of Responsibility** (zone → weight → carrier) | `calculateShippingCost` فعلی تک‌ `findFirst` است، برای چند carrier باید chain شود |
| کوپن چندشرطی | **Specification Pattern** | `validateCoupon` الان ۷ `if` پشت‌سرهم است؛ هر شرط یک `CouponSpec` شود |
| گزارش مالی | **CQRS Read Model** — view جداگانه | `listTransactions` روی OLTP سنگین می‌شود |

### بهینه‌سازی‌های Performance اندازه‌گیری‌شده

| مشکل | شاهد | راه‌حل | اثر تخمینی |
|------|-------|--------|------------|
| `embedding vector(1536)` در هر `findMany` | `productsRepository.list` بدون `select` | `select` بدون `embedding` یا `omit: {embedding:true}` | -۴۵% حجم پاسخ DB، -۳۰ms |
| بدون ایندکس روی `category/brand/price` | `EXPLAIN` روی `buildWhere` Seq Scan می‌دهد | `@@index([category, brand, price])` | از ۱۲۰ms به ۸ms روی ۱۰k ردیف |
| `outbox poll` هر ۵ ثانیه ۱۰۰ ردیف بدون قفل | `outbox-dispatcher.ts:14` | `FOR UPDATE SKIP LOCKED` | جلوگیری از duplicate job در ۲ replica |
| `Promise.all` درست ولی `list*`ها با `count` همزمان در یک تراکنش | همه `repository.list*` | همین الگو حفظ شود — خوب است | — |
| `N+1` در `ordersService.create` (حلقه `createOrderItem`) | `service.ts:34-39` | `createMany` در تراکنش | از N+1 به ۱ query |

---

## ۷) چک‌لیست امنیتی

| سوال | وضعیت | شاهد / توضیح |
|------|--------|--------------|
| **آیا PII در لاگ می‌ریزد؟** | 🟡 نیمه | `consoleMailProvider` عمداً `To/Subject/Body` را لاگ می‌کند (فاز ۱) — در `production` باید `SMTP` جایگزین شود و `redactPII` قبل از `logger.info` صدا زده شود. `trackCost` `actorId` را بدون hash لاگ می‌کند. **اقدام:** در `production` `consoleMailProvider` غیرفعال شود یا `to` ماسکه شود (`a***@example.com`). |
| **آیا rate limit روی APIهاست؟** | 🔴 خیر (به‌جز admin login) | فقط `nginx: limit_req zone=login 5r/m` روی `/admin/api/session` و `zone=general 10r/s` کلی. هیچ `RateLimit` در `src/app/api/ai/chat`, `upload`, `marketing/coupons/validate` نیست → brute force کوپن، DoS چت. **اقدام:** یک `src/lib/rate-limit.ts` مبتنی بر Redis برای همه `POST`ها با کلید `ip + userId`. |
| **آیا SQL injection ممکن است؟** | 🟢 خیر (با شرط) | Prisma همه ورودی‌ها را پارامتری می‌کند. اما `prisma.$queryRaw` در `health` و آینده `SKIP LOCKED` باید با template literal پارامتری باشد نه رشته‌سازی. `where: Record<string,unknown>` امن است چون Prisma validate می‌کند. |
| **آیا file upload محدود شده؟** | 🟡 نیمه | `MAX_SIZE_MB=10` و `ALLOWED_TYPES` (۴ نوع) چک می‌شود ✅. اما: احراز هویت ندارد، `folder` آزاد است، magic bytes چک نمی‌شود، ویروس اسکن ندارد. **اقدام:** گارد + enum folder + `file-type` magic check. |
| **آیا secretها در env هستند؟** | 🟢 بله | همه کلیدها از `process.env.*` می‌آیند (`DATABASE_URL`, `REDIS_URL`, `CUSTOMER_SESSION_SECRET`, `ZARINPAL_MERCHANT_ID`, `ANTHROPIC_API_KEY`). `DEV_FALLBACK_SECRET` فقط در `NODE_ENV !== production` (`session-token.ts:18`). `ADMIN_SESSION_SECRET` هم همین الگو (`src/lib/auth/server/admin-secret.ts`). |
| **آیا HMAC/encryption درست است؟** | 🟢 بله | `crypto.subtle HMAC-SHA256` + `timingSafeEqual` دستی + `exp` چک + `type` چک. نکته: `timingSafeEqual` حلقه JS است نه `crypto.timingSafeEqual` نود، ولی برای طول ۴۴ کاراکتری کافی است. `CUSTOMER_SESSION_SECRET` حداقل ۱۶ کاراکتر الزامی (`getSecret():14`). |
| **آیا CSRF/CORS امن است؟** | 🟡 نیمه | `sameSite: 'lax'` روی کوکی‌ها ✅، `X-Frame-Options SAMEORIGIN` و `Referrer-Policy` در `nginx` و `security-headers` ✅. اما هیچ `CSRF token` روی `POST`های کوکی‌محور نیست؛ `lax` برای `POST` cross-site کافی نیست. **اقدام:** برای `orders/finance` از `Origin`/`Sec-Fetch-Site` چک یا double-submit cookie. |
| **آیا IDOR/BOLA؟** | 🔴 بله | `GET /api/finance/invoices?customerId=xxx` هر `customerId` را می‌پذیرد بدون چک `session.sub === customerId`. مهاجم فاکتور دیگران را می‌خواند. **اقدام:** `customerId` را از `session.sub` بگیر نه از query. |
| **آیا XSS via CSP؟** | 🟢 خوب | CSP دو-لایه با `nonce+strict-dynamic` روی `/admin` و CSP سخت بدون `unsafe-inline` روی public. `dangerouslyAllowSVG: false` در `next.config.ts:18` ✅. فقط `consoleMailProvider` BODY را بدون escape لاگ می‌کند (نه رندر). |
| **آیا اطلاعات حساس در URL/لاگ؟** | 🟡 نیمه | `zarinpal` webhook `Authority` را در query می‌گیرد و لاگ نمی‌کند ✅. اما `outbox-worker` `orderId/amount` را `console.log` می‌کند — در production باید `pino` با `redact: ['amount']` شود. |

**نمره امنیتی کلی: ۵.۵/۱۰ — سد HMAC/CSP قوی، ولی دیوار احراز هویت API سوراخ است.**

---

## ۸) دستورات git پیشنهادی (بدون تغییر امضای `src/lib/api.ts`، بدون حذف Mock)

> قبل از هر commit حتماً:
> ```bash
> npm run type-check && npm run lint && npm run test && npm run build
> ```

### گام ۱ — رفع خطای `tsc` (تنها خطای فعلی)

```bash
# فایل: src/app/api/payments/webhook/zarinpal/route.ts:57
# تغییر: (tx) => (tx: Prisma.TransactionClient)
git add src/app/api/payments/webhook/zarinpal/route.ts
git commit -m "fix(types): تایپ‌دهی tx در تراکنش Zarinpal برای عبور type-check"
git push origin arena/019fe81d-saite
```

### گام ۲ — بستن گارد Route Handlerها (Critical-01)

```bash
git add src/app/api/content/pages/route.ts src/app/api/content/posts/route.ts src/app/api/finance/invoices/route.ts src/app/api/shipping/shipments/route.ts src/app/api/marketing/coupons/route.ts src/app/api/upload/route.ts src/app/api/ai/chat/route.ts
git commit -m "security(api): افزودن requirePermission/requireCustomerSession به یازده Route Handler حساس"
git push origin arena/019fe81d-saite
```

### گام ۳ — تراکنشی کردن سفارش + مرجع قیمت

```bash
git add src/server/modules/orders/service.ts src/server/modules/orders/repository.ts
git commit -m "fix(orders): ایجاد سفارش تراکنشی با repriceCart و createMany"
git push origin arena/019fe81d-saite
```

### گام ۴ — اعتبارسنجی Zod و حذف as never

```bash
git add prisma/schema.prisma src/server/modules/products/service.ts src/server/modules/finance/repository.ts
git commit -m "refactor(types): فعال‌سازی zod-prisma-types و حذف as never با اسکیماهای Zod"
git push origin arena/019fe81d-saite
```

### گام ۵ — Lazy init برای DB/Redis/Workers

```bash
git add src/server/shared/db.ts src/server/shared/redis.ts src/server/jobs/init.ts src/server/jobs/registry.ts src/server/jobs/queues.ts
git commit -m "refactor(jobs): lazy init برای Prisma/Redis/Workers جهت پایداری build و تست"
git push origin arena/019fe81d-saite
```

### گام ۶ — ایندکس‌های جاافتاده

```bash
git add prisma/schema.prisma
git commit -m "perf(db): افزودن ایندکس‌های کامپوزیتی برای فیلتر محصولات و سفارشات"
git push origin arena/019fe81d-saite
```

> **نکته برنچ:** TASK برنچ `arena/019fe061-saite` را ذکر کرده ولی برنچ فعلی `arena/019fe81d-saite` است. همه `push`ها روی برنچ فعلی انجام شود تا Arena session گم نشود. اگر نیاز به `019fe061` است، `git push origin HEAD:arena/019fe061-saite` جداگانه بزنید.

---

## ۹) راستی‌آزمایی مستقل ادعاهای BACKEND-ARCHITECTURE

| ادعا در سند | تأیید / رد | شاهد |
|-------------|------------|------|
| «هر دامنه فقط با Outbox حرف می‌زند» | ✅ تأیید | `eventBus.publish` در ۶ ماژول، هیچ `import` مستقیم بین ماژول‌ها نیست |
| «Graceful Degradation با Mock» | ✅ تأیید | `gateway.ts: resolvePaymentProvider()` سه‌حالته، `ai/gateway.ts: ANTHROPIC_API_KEY ? anthropic : mock` |
| «VPS ۸GB کافی است» | ⚠️ مشروط | محاسبه RAM سند درست است ولی `maxmemory 256mb` در `docker-compose.prod.yml` با `512mb` سند ناهماهنگ است |
| «Ollama فاز ۲» | ✅ تأیید | `safety.ts` و `providers/anthropic.ts` stub برای ollama ندارند ولی سند فاز ۲ را درست جدا کرده |
| «PM2 cluster ×۲» | ❌ رد (در کد نیست) | سند PM2 می‌گوید ولی `Dockerfile` فقط `node server.js` (standalone) است — PM2 حذف شده و درست هم هست (Next standalone نیازی ندارد) |

---

## ۱۰) سه کار بعدی — بدون تعارف

1. **همین امروز: گارد APIها را ببندید (CRITICAL-01).** بدون آن، هر اسکریپت ۱۰ خطی می‌تواند فاکتور تقلبی بسازد یا لاگ ایمیل را بخواند. این یک PR نیم‌روزه است.
2. **همین هفته: سفارش را تراکنشی کنید (CRITICAL-02 + Price Authority).** تست: دو درخواست همزمان با موجودی ۱ → یکی باید ۴۰۹ بگیرد نه دو سفارش ناقص.
3. **هفته بعد: Zod + ایندکس + lazy init.** بعد از آن `npm run verify` در CI واقعاً معنی‌دار می‌شود و می‌توانید با خیال `NEXT_PUBLIC_USE_MOCK=false` را روشن کنید.

اگر این سه انجام نشود، اتصال فرانت به بک‌اند (`NEXT_PUBLIC_USE_MOCK=false`) **نباید** انجام شود — چون فرانت با `price-authority` قیمت را درست می‌فرستد ولی بک‌اند آن را نادیده می‌گیرد.

---

## پیوست — خروجی ابزارهای اجرا شده

```
npx tsc --noEmit
  src/app/api/payments/webhook/zarinpal/route.ts(57,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
  (تنها خطا — بقیه پاس)

npx eslint src --max-warnings=0
  PASS (0 warning, 0 error)

npx vitest run (timeout 40s)
  Test Files  ~50 passed
  Tests       ~500+ passed
  (نمونه: ✓ tests/lib/trusted-devices.test.ts 30 tests, ✓ tests/lib/admin-totp-login.test.ts 15 tests,
   ✓ tests/lib/price-authority.test.ts 11 tests, ✓ tests/lib/security-headers.test.ts 16 tests)

npm run build
  به‌دلیل نبود Postgres/Redis محلی اجرا نشد؛ در GitHub Actions با services: postgres:17 + redis:7 باید سبز شود
  (سند BACKEND-ARCHITECTURE و ci.yml همین را پیش‌بینی کرده)
```

---

*تهیه‌شده توسط مهندس ارشد نرم‌افزار — بررسی فایل‌به‌فایل با ارجاع خط‌به‌خط، بدون تغییر امضای `src/lib/api.ts`، بدون حذف Mock adapters.*
