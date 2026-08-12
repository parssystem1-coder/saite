# گزارش تحلیل معماری و کد — Saite (B2B/B2C فروشگاه ماشینهای اداری ایران)

> **تاریخ:** ۲۰۲۶-۰۸-۱۲ · **شاخه:** `arena/019ff76f-saite`
> **محدوده:** بکاند Next.js 16.3 + Prisma 6.19.3 + Postgres + Redis/BullMQ
> **وضعیت اعتبارسنجی (قبل از گزارش اجرا شد):**
> ✅ `npm run type-check` (tsc --noEmit) — پاس
> ✅ `npm run lint` (eslint --max-warnings=0) — پاس
> ✅ `npm run test` — **۸۸ فایل / ۷۵۹ تست سبز**
> ✅ `npm run build` (next build / standalone) — پاس
> (توجه: دانلود engine باینری Prisma در sandbox به دلیل شبکه ناموفق بود؛ build به لطف Proxy فاز-build در `src/server/shared/db.ts` سبز ماند — این همان رفتار مورد انتظار مستندات است.)

---

## ۱) خلاصهٔ اجرایی

پروژه یک **Modular Monolith داخل همان Next.js App Router** است: هر دامنه (`products`, `orders`, `inventory`, `finance`, `shipping`, `marketing`, `content`) ساختار `events.ts → repository.ts → service.ts` دارد و دامنهها فقط از طریق **Outbox Pattern روی Postgres** (`OutboxEvent`) با هم حرف میزنند. BullMQ سه صف (`outbox`, `email`, `sms`) را با dispatcherهای polling مدیریت میکند.

**نتیجهٔ کلی:** پایهٔ معماری بسیار سالم است — جداسازی SRP خوب، DomainError با status/code، هدرهای امنیتی nonce+CSP، احراز هویت HMAC با `timingSafeEqual`، fail-closed برای پرداخت/AI، و پوشش تست ۷۵۹ موردی. اما **چند شکاف بحرانی وجود دارد که مسیر «ایجاد و پرداخت سفارش» عملاً ناقص است** (گیتوی پرداخت dead-code است و هیچ endpoint ایجاد PaymentIntent وجود ندارد)، **لایهٔ zod تعریف شده ولی هیچ جا استفاده نمیشود**، و **helperهای timeout/retry تعریف شده ولی بیاستفادهاند**.

---

## ۲) بررسی ساختاری

| بخش | وضعیت | تحلیل |
|---|---|---|
| `prisma/schema.prisma` | ✅ | ۱۵۴۵۹ بایت، enumها و ایندکسهای معقول؛ `embedding vector(1536)` بهصورت `Unsupported` (pgvector نصب نیست) |
| `prisma.config.ts` | ✅ | مینیمال و درست؛ `package.json#prisma` deprecated هشدار میدهد |
| `src/server/modules/*` | ✅/⚠️ | ۶ دامنهٔ کامل؛ نظم repository/service/events یکدست؛ اما `as any` زیاد در لایهٔ repo |
| `src/server/communications/*` | ⚠️ | service+repository خوب؛ SMTP/SMS فقط stub (console) |
| `src/server/jobs/*` | ✅/⚠️ | outbox dispatcher با `FOR UPDATE SKIP LOCKED` اتمیک؛ worker منطق duplicated دارد |
| `src/server/ai/*` | ✅/⚠️ | gateway با injection/PII guard؛ ولی `fetch` بدون timeout |
| `src/server/payments/*` | 🔴 | gateway تعریف شده اما **هیچجا فراخوانی نمیشود**؛ فقط webhook وجود دارد |
| `src/server/auth/*` | ✅ | HMAC-SHA256، version invalidation، timingSafeEqual |
| `src/server/shared/*` | ✅ | constants متمرکز، cache-aside، fetch helper (بیاستفاده) |
| `src/app/api/*` | ⚠️ | route handlerها thin هستند؛ اما zod در Routeها استفاده نمیشود |
| `src/lib/api.ts` | ✅ | قرارداد fixed؛ mock/HTTP دوسویه؛ امضا تغییر نکرده |
| `docs/BACKEND-ARCHITECTURE.md` | ✅ | ۹۹۳ خط، مستند مرجع قوی |
| `docker-compose.prod.yml` | ✅ | app/worker/db/redis/nginx/certbot؛ healthcheck و resource limit دارد |
| `Dockerfile` | ⚠️ | multi-stage؛ اما `npm ci --omit=dev` در stage deps و کل build جدا؛ worker از `server.js` (با NEXT_PHASE=runtime jobs) استفاده میکند — سازوکار RUN_JOBS دارد |
| `nginx/nginx.conf` | ✅ | rate-limit دو لایه، SSL، upload به attachment، امنیت uploads |

---

## ۳) جدول نمرهدهی

| معیار | نمره ۱–۱۰ | توضیح |
|---|---|---|
| معماری کلی | ۸ | Modular monolith منظم، outbox + BullMQ، تفکیک domain، trade-offهای مستند. ولی مسیر پرداخت ناقص و event-bus.subscribe stub |
| جداسازی مسئولیت (SRP) | ۸ | service/repository/events جداست؛ route ها thin. نمره بهخاطر duplicate logic در outbox-worker و خروج منطق از eventBus به worker کم شد |
| Type Safety | ۶ | امضای api.ts fixed و تایپهای دامنه خوب؛ اما ۳۰ `any`/`as any` در لایهٔ repo، `as unknown as ProductListQuery` در route، و **لایهٔ zod تعریف شده ولی استفادهنشده** |
| Error Handling | ۸ | `DomainError` با status/code، `handleServiceError` متمرکز، ایدمپوتنسی خوب. اما catch-باز در webhook و worker که خطاها را قورت میدهد (fail-open جزئی) |
| امنیت | ۸ | HMAC+timingSafeEqual، CSP nonce+strict-dynamic، magic bytes upload، rate-limit دو لایه، fail-closed. نقاط ضعف: CSRF عمدتاً به sameSite=strict وابسته، PII در `EmailLog.body` بدون retention |
| تستپذیری | ۹ | ۷۵۹ تست؛ تستهای integration (orders, coupon, webhook, upload, auth) و lib و component. Point-injection در NODE_ENV=test در cache/cacheAside |
| مستندسازی | ۹ | BACKEND-ARCHITECTURE و security docs قوی، کامنتهای Persian هدفمند |
| مقیاسپذیری | ۶ | singleton Prisma، cache-aside، batch outbox، `SKIP LOCKED` خوب. اما rate-limit **فایل-محور** (نه Redis، چند-instance مشترک نیست)، جستجوی `contains` بدون GIN/trigram، رزرو inventory بهصورت N+1 در حلقه |

---

## ۴) نقاط قوت (≥ ۵ مورد)

1. **Outbox dispatcher اتمیک با `FOR UPDATE SKIP LOCKED`** — `src/server/jobs/dispatchers/outbox-dispatcher.ts:24-38`: claim اتمیک در یک UPDATE با `RETURNING`، `retryCount` همانجا increment میشود؛ دو instance همزمان یک رویداد را enqueue نمیکنند. + jobId=event.id برای dedupe در `:53`.

2. **احراز هویت HMAC-SHA256 با `timingSafeEqual` و ابطال نسخهای** — `src/server/auth/session-token.ts:75-105` و `src/lib/auth/server/session-token-core.ts:22-38`. کوکی `httpOnly + secure + sameSite=strict` در `customer-session.ts:30-45`. هستهٔ توکن بین ادمین/مشتری یکپارچه (DRY واقعی).

3. **fail-closed برای providerهای پرداخت و AI** — `src/server/payments/gateway.ts:13-24` در production بدون credential، `ServiceUnavailableError` پرتاب میکند (نه fallback به mock). همین الگو در `src/server/ai/gateway.ts:32-37`.

4. **هدرهای امنیتی با CSP nonce + strict-dynamic** — `src/lib/security-headers.ts` و `src/proxy.ts`؛ `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`, `base-uri 'self'`. قابل تست واحد (`tests/lib/admin-proxy-csp.test.ts`).

5. **آپلود امن با magic-byte validation** — `src/app/api/upload/route.ts:21-63`: whitelist MIME + بررسی signature باینری + محدودیت ۱۰MB + regex پوشه + rate-limit (۵/min). دفاع عمقی در `local.ts:28-30`.

6. **اعتبارسنجی magic numbers در `constants.ts`** — تمام اعداد تجاری (TTL پرداخت، نرخ مالیات، سقف تعداد خط، max perPage) در یک منبع. مثال `src/server/shared/constants.ts:11-27`.

7. **پوشش تست بالا و نظم** — ۷۵۹ تست از جمله `tests/integration/payment-webhook.test.ts`، `orders-idor.test.ts`، `upload.test.ts` که سناریوهای امنیتی/رقابتی را پوشش میدهند.

---

## ۵) نقاط ضعف بحرانی

> هر مورد: فایل:خط — چرا بحرانی — راهحل — severity

### C1 — مسیر پرداخت ناقص است: `resolvePaymentProvider` و `paymentIntent.create` هیچجا استفاده نمیشود
- **فایل:** `src/server/payments/gateway.ts:13` (تعریف)؛ فراخوانی `resolvePaymentProvider` = صفر؛ `paymentIntent.create` = صفر؛ کل `src/app/api/payments/` فقط webhook دارد (`webhook/zarinpal/route.ts`).
- **چرا بحرانی:** عملاً هیچ endpoint یا خدمتی «ایجاد PaymentIntent و ریدایرکت به درگاه» را اجرا نمیکند. checkout نمیتواند پرداخت واقعی را آغاز کند؛ `mockPaymentProvider` فقط در تست/سناریوهای دستی میچرخد. سفارشها بعد از ساخت، در `pending` میمانند چون هیچ flow ای `transitionState(...,'paid')` را جز webhook (که هیچ چیزی آن را نمیخواند) صدا نمیزند. علاوه بر این، **webhook با import مستقیم `zarinpalProvider` (خط ۳) گیتوی fail-closed را دور میزند** — اگر NODE_ENV=production و merchantID نباشد، webhook با credential خالی به API واقعی میزند.
- **راهحل:** یک `POST /api/payments` بسازید که `resolvePaymentProvider()` را صدا بزند، `PaymentIntent` را با `idempotencyKey` بسازد، و `redirectUrl` برگرداند. webhook را به گیتوی وصل کنید نه provider مستقیم. تست integration `payment-webhook` باید یک flow کامل create→webhook داشته باشد.
- **severity:** 🔴 **critical**

### C2 — ورودی `POST /api/orders` بدون Zod؛ JSON دلخواه مستقیم به DB میرود
- **فایل:** `src/app/api/orders/route.ts:31-35` — `const body = await req.json()` و سپس `items: body.items`, `shippingAddress: body.shippingAddress` بدون schema.
- **چرا بحرانی:** `createOrderSchema` در `src/server/shared/validation.ts` **تعریف شده ولی هیچ Route ای از آن استفاده نمیکند** (grep نشان داد صفر استفاده). `shippingAddress` با `as any` (orders/service.ts) مستقیم در `Json` ذخیره میشود. نتیجه: (الف) تایپ-unsafety، (ب) payload بزرگ/تو در تو (denial of service)، (ج) بدنهٔ کنترلنشدهٔ JSON (shippingAddress) در DB مینشیند و اگر در UI ناامن render شود → stored XSS، (د) `req.json()` نامعتبر throw میکند و با 500 generic بهجای 400 میرسد.
- **راهحل:** `parseWithSchema(createOrderSchema, body)` را در route صدا بزنید؛ `shippingAddress` را با یک schema با `max` depth/field محدود کنید؛ خطای JSON نامعتبر را به `ValidationError` (400) تبدیل کنید.
- **severity:** 🔴 **high**

### C3 — فراخوانیهای خارجی (Anthropic/OpenAI/Zarinpal/IDPay) بدون timeout
- **فایل:** `src/server/ai/providers/anthropic.ts:12-24`، `openai.ts:10-20`، `payments/providers/zarinpal.ts:15-33`، `idpay.ts:8-25` — همه `fetch` خام بدون `AbortController`.
- **چرا بحرانی:** `src/server/shared/fetch.ts:14` — helper مقاوم `fetchJson` با `timeoutMs=10000` تعریف شده ولی **هیچجا استفاده نمیشود** (grep = 0). یک درگاه/AI معلق، درخواست HTTP را بهطور نامحدود باز نگه میدارد؛ در worker صف را قفل میکند و در سمت app اتصال را میبلعد. همین الگو با `retryAsync` در zarinpal هست ولی نه با timeout، و idpay هیچ retry/timeout ندارد.
- **راهحل:** همهٔ providerها به `fetchJson` مهاجرت کنند (یا حداقل `AbortSignal.timeout(10_000)`). idpay هم به `retryAsync` مجهز شود.
- **severity:** 🔴 **high**

### C4 — لایهٔ اعتبارسنجی Zod تعریف شده ولی مرده (Contract-first نیمهاجرا)
- **فایل:** `src/server/shared/validation.ts` — `productListQuerySchema`, `createOrderSchema`, `couponCreateSchema`, `parseWithSchema` همگی تعریفاند؛ **هیچ Route از آنها استفاده نمیکند**. در عوض `products/route.ts:39-52` query را دستی با `searchParams.get` میسازد و `category: (... ) as CategorySlug | undefined` و `sort: (sort || undefined) as ProductListQuery['sort']` cast میکند، و `as unknown as ProductListQuery` در `:25`.
- **چرا بحرانی:** دقیقاً همان چیزی که اسناد وعده میدهند («هیچ unknown → as never به Prisma نرسد») رعایت نشده؛ مهاجم با `category` و `sort` دلخواه و `minPrice=NaN`/منفی، یا کوئریهای عجیب روی DB مینشیند. `parseNumberParam` NaN را میگیرد ولی sort/category هیچ schema ندارند. Type-safety وعدهدادهشده شکسته است.
- **راهحل:** در هر Route از `parseWithSchema(productListQuerySchema, Object.fromEntries(searchParams))` استفاده کنید؛ `parsePagination` را به schema منتقل کنید.
- **severity:** 🟠 **high**

### C5 — انتشار/تکرار منطق رویداد: `order.paid` کپی `order.status_changed` است
- **فایل:** `src/server/jobs/workers/outbox-worker.ts:25-90` (status_changed) و `:91-155` (order.paid / legacy) — دو بلوک تقریباً یکسان (یافتن referenceId → createInvoiceFromOrder → markInvoicePaid) تکرار شده.
- **چرا بحرانی:** هر باگ در منطق فاکتور باید دو جا تعمیر شود؛ رفتار دو مسیر ممکن است از هم جدا شود (درجهٔ اختراع). این هستهٔ مالی است — تکرار منطق مالی ریسک انطباق/پردازش دوبله دارد.
- **راهحل:** یک تابع `handlePaid(orderId)` واحد؛ `order.paid` فقط `handlePaid` را صدا بزند (یا حذف شود چون backward-compat پس از deploy قدیمی دیگر لازم نیست).
- **severity:** 🟠 **high**

### C6 — شمارهٔ فاکتور با `Math.random` ۴ رقمی — ریسک برخورد در UNIQUE
- **فایل:** `src/server/modules/finance/service.ts:6-11` — `INV-YYYYMMDD-` + ۴ رقم تصادفی.
- **چرا بحرانی:** `invoiceNumber` در schema `@unique` است (`schema.prisma`). ۴ رقم = ۱۰۰۰۰ حالت؛ در روزهای پرتراکنش یا در فاز شارژ، برخورد باعث `P2002` و شکست صدور فاکتور (و رولبک زنجیرهٔ paid) میشود. `Math.random` هم تابع انتخاب امن نیست.
- **راهحل:** توالی DB (sequence) یا `cuid()`/UUID؛ یا `randomBytes` + افزایش فضای نمونه.
- **severity:** 🟠 **medium**

### C7 — Rate-limit فایل-محور است، نه Redis؛ در چند instance مشترک نیست
- **فایل:** `src/lib/auth/server/rate-limit-store.ts:1-40` — `createFileStore` پیشفرض؛ سند خودش اعتراف میکند «روی چند instance مشترک نیست».
- **چرا بحرانی:** با معماری docker-compose که `app` (۲ worker PM2) و `worker` جدا دارد، اگر instanceهای app >۱ شوند، هر instance سطل IP/username خودش را دارد → سقف login مؤثراً × تعداد instance میشود. در single-VPS فعلی قابل قبول است ولی محدودیت واقعی است.
- **راهحل:** پیادهسازی `RateLimitStore` روی Redis (`INCR + EXPIRE`) — رابط ثابت است و بدون تغییر caller.
- **severity:** 🟡 **medium**

### C8 — فیلدهای `Json` دلخواه (`metadata`, `shippingAddress`, `specs`) بدون سانیتایز
- **فایل:** `orders/service.ts` (`shippingAddress as any`)، `finance/repository.ts:19-21` (`metadata as any`)، `products/repository.ts` (`specs`).
- **چرا بحرانی:** دادهٔ کلاینت با عمق/حجم نامحدود در JSONB ذخیره میشود (بدون `z` و بدون cap) — هم DoS و هم اگر جایی با `dangerouslySetInnerHTML` render شود XSS.
- **راهحل:** zod با `.max()`/`.depth()` روی همهٔ Jsonهای ورودی؛ هرگز raw render نکنید.
- **severity:** 🟠 **medium**

---

## ۶) بدهیهای فنی

**TODO / stub های صریح (عمدی، طبق قانون «mock بماند»):**
- `src/server/communications/providers/smtp.ts:8` — `TODO: فاز ۵ — SMTP`
- `src/server/upload/providers/s3.ts:7` — `TODO: فاز ۸ — ArvanCloud S3`
- `src/server/modules/products/repository.ts:74` — `TODO: pgvector — فاز ۵`
- `src/server/shared/event-bus.ts:36` — `subscribe` یک no-op است (فقط `logger.info`)؛ همهٔ منطق در switch worker. این یعنی معماری event-driven فقط یکسمت اجرا شده.

**`any` / cast های غیرضروری (جمعاً ۳۰ مورد در ۹ فایل):**
- `finance/repository.ts` (۷) ، `orders/service.ts` (۶) ، `shipping/repository.ts` (۳) ، `orders/repository.ts` (۳) ، `inventory/repository.ts` (۳) ، `products/repository.ts` (۲) ، `marketing/service.ts` (۲) ، `marketing/repository.ts` (۲) ، `event-bus.ts` (۱) ، `webhook` (۱) — همگی همراه `/* eslint-disable @typescript-eslint/no-explicit-any */` به بهانهٔ «Prisma stub vs real».
- `products/route.ts:21-25,39-52` — `as unknown as ProductListQuery` و cast دستی sort/category.
- ✅ **صفر** `@ts-ignore` / `@ts-expect-error` و صفر `as never` (فقط یک اشاره در کامنت).

**تکرار کد (DRY violation):**
- `outbox-worker.ts:25` و `:91` — منطق مالی تکرارشده (C5).
- `mimeToExt`/`ALLOWED_TYPES` در `upload/route.ts:7` و `local.ts:27` — دو منبع حقیقت برای MIME.
- `30 * 60 * 1000` hard-code در `zarinpal.ts:46`, `idpay.ts:31`, `mock.ts:11` در حالی که `PAYMENT_INTENT_TTL_MS` در `constants.ts:11` تعریف شده (فقط در `orders/service.ts` استفاده میشود).
- الگوی `fetch → res.ok → res.json` در ۴ provider تکرار شده (باید به `fetchJson` برود).

**Magic numbers / strings:**
- کد وضعیت درگاه: `100`, `101`, `200` در `zarinpal.ts`/`idpay.ts` بدون constant/named.
- Enumهای DB با `as any`/string آرام cast میشوند (مثلاً `status: status as any` در repo ها) — از literal type DB جدا میشوند.
- رشتههای رویداد (`'order.created'`, `'order.paid'`) در چند فایل literal هستند، نه از `events.ts` shared.

**وابستگی circular:**
- در `jobs/init.ts:17-19` عمداً با `await import('./registry')` دایرهٔ `db → jobs → registry → workers → db` شکسته شده و با کامنت مستند است — این یک workaround آگاهانه است، نه یک دایرهٔ حلنشده.

---

## ۷) پیشنهادات بهبود

### Refactoring اولویتدار (بر اساس severity)
| # | اقدام | فایل | اولویت |
|---|---|---|---|
| ۱ | اجرای کامل مسیر پرداخت (create payment intent + ریدایرکت) و اتصال webhook به گیتوی | `src/app/api/payments/*`, `gateway.ts` | 🔴 P0 |
| ۲ | اعمال Zod در همهٔ Routeها (جایگزینی دستسازها) | `validation.ts` + همهٔ routes | 🔴 P0 |
| ۳ | مهاجرت همهٔ `fetch`های خارجی به `fetchJson` (timeout) | providers | 🔴 P0 |
| ۴ | حذف duplicate `order.paid` از worker | `outbox-worker.ts` | 🟠 P1 |
| ۵ | sequence/secure invoice number | `finance/service.ts` | 🟠 P1 |
| ۶ | RateLimitStore روی Redis | `rate-limit-store.ts` | 🟡 P2 |
| ۷ | حذف `as any`/`as unknown` با تایپهای Prisma دقیق + Zod type integration (zod-prisma-types از schema پشتیبانی میشود) | repo ها / routes | 🟠 P1 |

### الگوهای طراحی مناسبتر
- **Command/Business-layer واحد برای پرداخت:** بهجای پراکندگی منطق در worker، یک `paymentsService.initialize/verify` با Transaction صریح.
- **Handler-based event dispatch** بهجای `switch` در worker: یک Map از `eventType → handler[]` تا `order.paid` = alias از `status_changed` باشد (رفع C5).
- **Ports & Adapters صریح** برای درگاهها: `PaymentGatewayAdapter` خوب است؛ گیتوی باید تنها نقطهٔ ورود باشد (رفع C1).
- **`Result`/either** برای webhook تا catch باز خطاها را «قورت ندهد» — الان `catch` در webhook به `failed` redirect میکند و ممکن است خطای ناشناخته را از چشم بیندازد.

### بهینهسازی Performance
- **جستجوی محصول:** `buildWhere` از `contains` (ILIKE '%..%') روی ۴ ستون بدون ایندکس → **Full table scan**. پیشنهاد: اکستنشن `pg_trgm` + `GIN` روی `name/model/sku/brand`، یا مهاجرت جستجو به ایندکس full-text. (`src/server/modules/products/repository.ts:42-50`)
- **N+1 در رزرو موجودی:** `inventory/repository.ts:12` بهازای هر آیتم ۲ کوئری داخل transaction. برای سبد ≤۵۰ ردیف OK ولی در burst صف را سنگین میکند؛ با یک `UPDATE ... CASE` یا batch بهتر شود.
- **`ordersRepository.findById`** همیشه `paymentIntents` را include میکند (هزینهٔ غیرضروری برای بیشتر callها) — `select`/include شرطی شود (`orders/repository.ts:23`).
- **کش کشتاری همهٔ لیستها با `products:list:*`** در هر create/update/delete (`products/service.ts:56-57`) — با TTL ۶۰s و کلیدهای متعدد، بهتر است نسخهگذاری (version counter) بهجای invalidation کل prefix.
- **pgvector:** فیلد `embedding` تعریف شده ولی اکستنشن نصب نیست و فاز ۵ TODO است — بدون ایندکس `ivfflat/hnsw` جستجوی معنایی عملاً غیرممکن است؛ باید در روادمپ صریح شود.

---

## ۸) چکلیست امنیتی

| سؤال | پاسخ | جزئیات |
|---|---|---|
| آیا PII در لاگها میریزد؟ | ⚠️ عمدتاً خیر | درایورهای mock مبلغ/orderId لاگ میکنند (بدون PII). ولی `EmailLog.body` و `SmsLog.body` متن کامل پیام (شاید حاوی اطلاعات شخصی) بدون retention در DB ذخیره میشود (`schema.prisma` EmailLog/SmsLog). `.data/` فایل rate-limit شامل IP است — باید gitignore/خارج از repo. |
| Rate limit روی API هست؟ | ✅ | دو لایه: nginx (`general 10r/s`, `login 5r/m`) + app-level `checkMutationRateLimit` (order 10/min, product 20/min, upload 5/min) + `ai-chat 10/min`. محدودیت: استور فایل-محور، چند-instance مشترک نیست (C7). |
| SQL injection امکانپذیر است؟ | ✅ خیر | همهٔ raw SQLها با `$queryRawUnsafe`/`$queryRaw` **با پارامتر باندشده `$1,$2`** اجرا میشوند (`inventory/repository.ts`, `outbox-dispatcher.ts`). هیچ string concat با ورودی کاربر دیده نشد. |
| File upload محدود شده؟ | ✅ | whitelist MIME + magic-byte validation + ۱۰MB + regex folder + rate-limit؛ سرو با `Content-Disposition: attachment` و `nosniff` در nginx. |
| Secretها در env هستند؟ | ✅/⚠️ | از `process.env` خوانده میشوند. یک `DEV_FALLBACK_SECRET` hard-code در `session-token.ts:10` هست که در production throw میکند (امن بهشرط NODE_ENV=production درست). `DATABASE_URL`/`REDIS_URL` از env در compose. |
| HMAC/encryption درست است؟ | ✅ | توکن نشست HMAC-SHA256 + `timingSafeEqual` + expiry + version invalidation (`session-token-core.ts`). رمز scrypt (`password-hash.ts`). Cookie `httpOnly+secure+sameSite=strict`. |
| دیگر نکات | ⚠️ | **CSRF عمدتاً به `sameSite=strict` وابسته است** — برای mutation های مهم (تغییر نقش، refund) بهتر است double-submit token یا Origin/Host check اضافه شود. `GET /api/payments/webhook/zarinpal` از طریق GET callback است (روش استاندارد زرینپال) — باید مطمئن شوید no-store و بدون side-effect قابل ردگیری race است (که هست، via updateMany+verifiedAt). |

---

## ۹) دستورات git برای اصلاحات پیشنهادی

طبق قوانین، برای هر اصلاح پیشنهادی (هنگام پیادهسازی) این چرخه اجرا میشود:

```bash
# قبل از هر commit:
npm run type-check && npm run lint && npm run test && npm run build

# C1 — مسیر پرداخت
git add src/app/api/payments src/server/payments src/server/modules/orders src/server/jobs/workers/outbox-worker.ts
git commit -m "اجرای مسیر کامل پرداخت: ایجاد PaymentIntent و اتصال webhook به گیتوی"
git push origin arena/019ff76f-saite

# C2+C4 — اعمال Zod در Routeها
git add src/app/api src/server/shared/validation.ts
git commit -m "اعتبارسنجی ورودی Routeها با Zod (حذف دستسازها)"
git push origin arena/019ff76f-saite

# C3 — timeout فراخوانیهای خارجی
git add src/server/ai/providers src/server/payments/providers src/server/shared/fetch.ts
git commit -m "اضافه کردن timeout به فراخوانیهای Anthropic/OpenAI/درگاهها"
git push origin arena/019ff76f-saite

# C5 — dedupe منطق فاکتور در worker
git add src/server/jobs/workers/outbox-worker.ts
git commit -m "یکسانسازی و حذف کد تکراری پردازش paid در outbox-worker"
git push origin arena/019ff76f-saite

# C6 — شماره فاکتور امن
git add src/server/modules/finance/service.ts
git commit -m "رفع ریسک برخورد شماره فاکتور با sequence"
git push origin arena/019ff76f-saite
```

> ⚠️ **نکتهٔ مهم شاخه:** سند `BACKEND-ARCHITECTURE.md` و دستور شما `arena/019fe061-saite` مینویسند، اما **این نشست به شاخهٔ `arena/019ff76f-saite` قفل شده است**. طبق سیاست محیط، push فقط به همان شاخهٔ نشست مجاز است و کار روی شاخهٔ دیگر ثبت نمیشود. لطفاً دستورهای بالا را روی `arena/019ff76f-saite` اجرا کنید (در پیام commit ها هم همین استفاده شد).
