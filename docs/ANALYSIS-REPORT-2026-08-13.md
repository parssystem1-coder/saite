# گزارش تحلیل معماری بک‌اند Saite — ۱۳ اوت ۲۰۲۶

> **دامنهٔ بررسی:** `prisma/schema.prisma`، `src/server/**` (modules, communications, jobs, ai, payments, auth, shared)، `src/app/api/**`، `src/lib/api.ts`، `docs/BACKEND-ARCHITECTURE.md`، `docker-compose.prod.yml`، `Dockerfile`، `nginx/nginx.conf`
> **وضعیت verify در زمان بررسی:** `type-check` ✅ — `lint` ✅ — `test` ✅ (۹۳۷ تست / ۱۲۰ فایل) — `madge --circular` ✅ (بدون وابستگی چرخه‌ای)

---

## ۱) جدول ارزیابی

| معیار | نمره ۱-۱۰ | توضیح |
|-------|-----------|-------|
| معماری کلی | **۸٫۵** | Modular Monolith تمیز با لایه‌بندی `route → service → repository`، Outbox Pattern روی Postgres، BullMQ برای jobs، جداسازی app/worker در compose. مستندات معماری (BACKEND-ARCHITECTURE.md) با کد هم‌راستاست. |
| جداسازی مسئولیت (SRP) | **۸** | ماژول‌ها خودکفا هستند و فقط از طریق event bus حرف می‌زنند. نقض‌های محدود: `orders/service.ts` مستقیماً `prisma.product.findMany` می‌زند (دور زدن productsRepository)، و webhook زرین‌پال منطق تراکنشی را خودش دارد. |
| Type Safety | **۶٫۵** | ۲۳ مورد `as any` (عمدتاً «Prisma stub vs real»)، `create(input: unknown)` با cast در products/service، `as any[]` در orders/service.ts:72. Zod در مرز HTTP خوب است اما در مرز repository ضعیف می‌شود. |
| Error Handling | **۷٫۵** | سلسله‌مراتب `DomainError` + `handleServiceError` یکنواخت و عالی. اما `finance/service.ts` هنوز `throw new Error('Invoice not found')` دارد (۵۰۰ به‌جای ۴۰۴) و routeهای content بدون try/catch هستند. |
| امنیت | **۸** | fail-closed برای پرداخت/AI در production، HMAC session با timing-safe compare، RBAC با requirePermission، magic-bytes در upload، nonce-CSP، rate-limit چندلایه. ضعف‌ها: نبود Zod در content POST و ai/chat، `feature` آزاد در ai/chat. |
| تست‌پذیری | **۸٫۵** | ۹۳۷ تست سبز؛ لایه‌ها با آبجکت‌های ساده (service/repository literal) به‌راحتی mock می‌شوند؛ `security-headers` عمداً به ماژول خالص جدا شده تا تست‌پذیر باشد. تست integration واقعی DB (reservation race) محدود است. |
| مستندسازی | **۹** | کامنت‌های «چرا» (نه «چه») در همه‌جا، docstring فارسی، سند معماری ۹۹۳ خطی، runbook و patchهای hardening آرشیوشده. کم‌نظیر برای این اندازه پروژه. |
| مقیاس‌پذیری | **۷** | Outbox + SKIP LOCKED چند-instance-safe است؛ cache-aside روی Redis؛ اما rate-limit پیش‌فرض file-store تک‌instance است، جستجوی `contains` بدون ایندکس trigram، و polling با setInterval به‌جای repeatable job. |

---

## ۲) نقاط قوت (با ارجاع)

1. **رزرو موجودی اتمیک و شرطی** — `src/server/modules/inventory/repository.ts:11-25`: `UPDATE ... WHERE quantityOnHand - quantityReserved >= $1 RETURNING` داخل همان تراکنش ساخت سفارش (`orders/service.ts:99-133`) یعنی oversell در لحظهٔ checkout ناممکن است؛ پارامترها همگی bound هستند.
2. **Outbox Dispatcher با claim اتمیک** — `src/server/jobs/dispatchers/outbox-dispatcher.ts:34-46`: `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) RETURNING` + `jobId=event.id` در BullMQ؛ دو instance هرگز یک رویداد را دوبار enqueue نمی‌کنند.
3. **fail-closed برای providerهای mock** — `src/server/payments/gateway.ts:54-68` و `src/server/ai/gateway.ts:38-40`: در production بدون credential واقعی، `ServiceUnavailableError` (۵۰۳) پرتاب می‌شود؛ mock هرگز پرداخت/پاسخ جعلی تولید نمی‌کند. `ServiceUnavailableError` هم عمداً ۵۰۳ است نه ۵۰۰ (`shared/errors.ts:43-55`).
4. **اعمال کوپن ضد-race** — `src/server/modules/marketing/service.ts:76-140`: `pg_advisory_xact_lock` + `updateMany` شرطی روی `usageCount < usageLimit` + unique constraint دوگانه (`couponId+customerId` و `orderId`) در schema — سه لایه دفاع برای سقف استفاده.
5. **امنیت webhook پرداخت بدون امضا** — `src/app/api/payments/webhook/zarinpal/route.ts:8-23`: مدل امنیتی مستند (amount از DB، verify سمت سرور، idempotency با `verifiedAt`, atomic `updateMany` با شرط `verifiedAt: null` در خط ۶۸-۸۲).
6. **upload سخت‌گیرانه** — `src/app/api/upload/route.ts:14-51` + `src/server/upload/mime.ts`: whitelist MIME، اعتبارسنجی magic-bytes، regex پوشه، سقف حجم، rate-limit جدا، و در nginx (`nginx/nginx.conf:95-104`) سرو با `Content-Disposition: attachment` + `nosniff` علیه Stored XSS.
7. **هستهٔ مشترک توکن نشست** — `src/lib/auth/server/session-token-core.ts`: حذف ۸۰٪ کد تکراری admin/customer، `timingSafeEqual` واحد، ابطال نسخه‌ای با fingerprint از secret (`server/auth/session-token.ts:40-48`).
8. **جداسازی app/worker با RUN_JOBS** — `docker-compose.prod.yml:17,58`: web instance صفهای پس‌زمینه را اجرا نمی‌کند؛ فشار حافظه قابل کنترل است.

---

## ۳) نقاط ضعف بحرانی

### W1 — گم شدن گذار `paid` پس از verify موفق (پول گرفته شده، سفارش pending می‌ماند)
- **فایل:** `src/app/api/payments/webhook/zarinpal/route.ts:68-104`
- **چرا بحرانی:** `updateMany` ابتدا `verifiedAt` را ست می‌کند و **بعد** `transitionState(orderId,'paid')` صدا زده می‌شود. اگر بین این دو، process بمیرد یا `transitionState` خطای غیر از `InvalidStateTransitionError` بدهد (مثلاً قطع لحظه‌ای DB)، درخواست بعدی webhook به شاخهٔ «Already verified» می‌رود و **هیچ‌وقت** سفارش paid نمی‌شود — پرداخت موفق ولی سفارش/فاکتور/ایمیل ساخته نمی‌شود.
- **راه‌حل:** در همان تراکنش که `verifiedAt` ست می‌شود، یک `OutboxEvent` از نوع `order.paid` هم ثبت شود (الگوی موجود outbox همین است). worker با retry تضمین می‌کند گذار انجام شود. در شاخهٔ «Already verified» هم وضعیت order چک شود و در صورت pending بودن، رویداد جبرانی ثبت گردد.
- **Severity: critical**

### W2 — پرداخت دیرهنگام پس از انقضای رزرو → ناسازگاری موجودی (oversell)
- **فایل‌ها:** `src/server/modules/inventory/repository.ts:27-35` (confirmOrder) + `:87-92` (expireReservations)، `src/server/modules/orders/service.ts:149`
- **چرا بحرانی:** رزرو پس از ۳۰ دقیقه (`PAYMENT_INTENT_TTL_MS`) با وضعیت `expired` آزاد می‌شود، اما سفارش همچنان `pending` می‌ماند و PaymentIntent قدیمی هنوز قابل پرداخت است. اگر مشتری دیر پرداخت کند: `confirmOrder` هیچ رزرو `active`ای پیدا نمی‌کند، حلقه صفر بار اجرا می‌شود، **موجودی هرگز کم نمی‌شود** ولی سفارش `paid` ثبت می‌شود → فروش کالای ناموجود.
- **راه‌حل:** در `confirmOrder` اگر تعداد رزروهای active با تعداد اقلام سفارش نخواند، یا رزرو مجدد اتمیک انجام شود (همان `reserveForOrder` + کسر فوری) یا خطای دامنه‌ای برگردد و مسیر refund/بازبینی دستی فعال شود. مکمل: در `expireReservations` سفارش‌های منقضی به `cancelled` گذار داده شوند تا `paymentsService.initialize` (که فقط `pending` را می‌پذیرد) پرداخت دیرهنگام را رد کند.
- **Severity: critical**

### W3 — گذار وضعیت سفارش غیراتمیک
- **فایل:** `src/server/modules/orders/service.ts:142-153`
- **چرا بحرانی:** `updateStatus` → `confirmOrder/releaseOrder` → `eventBus.publish` سه عمل جدا هستند. اگر پس از `updateStatus('paid')` فراخوانی `confirmOrder` شکست بخورد، وضعیت paid ثبت شده ولی موجودی کسر نشده و رویداد هم publish نشده (فاکتور/ایمیل ساخته نمی‌شود). read-check + update هم بدون قفل است (دو درخواست هم‌زمان می‌توانند هر دو گذار بزنند).
- **راه‌حل:** کل گذار داخل `prisma.$transaction` با `updateMany({ where: { id, status: from } })` شرطی (optimistic state check) + ثبت outbox در همان تراکنش؛ عملیات inventory هم با همان `tx`.
- **Severity: high**

### W4 — routeهای content بدون Zod و بدون try/catch
- **فایل:** `src/app/api/content/pages/route.ts:21-28` (و مشابه در `posts/route.ts`, `menu/route.ts`)
- **چرا بحرانی:** `const body = await req.json()` مستقیم به `contentService.createPage` می‌رود: (الف) JSON خراب → exception بدون handle → ۵۰۰ خام؛ (ب) هیچ سقف طولی روی `title/content/slug` نیست (تا `@db.Text` هر حجمی پذیرفته می‌شود)؛ (ج) خطای Prisma (مثلاً slug تکراری P2002) به‌صورت ۵۰۰ با پیام عمومی برمی‌گردد نه ۴۰۹/۴۰۰. الگوی بقیهٔ routeها (`parseWithSchema` + `handleServiceError`) اینجا رعایت نشده.
- **راه‌حل:** `pageCreateSchema`/`postCreateSchema` در `src/server/shared/validation.ts` + پوشش `try { ... } catch (err) { return handleServiceError(err) }` + `checkMutationRateLimit` مانند سایر mutationها.
- **Severity: high**

### W5 — `feature` و `variables` آزاد در `/api/ai/chat`
- **فایل:** `src/app/api/ai/chat/route.ts:23-34` و `src/server/ai/gateway.ts:180-192`
- **چرا بحرانی:** هر مشتری لاگین‌شده می‌تواند `feature: 'admin-assist'` یا `'product-seo'` بفرستد — قالب‌هایی که برای ادمین طراحی شده‌اند — و هزینهٔ توکن واقعی Anthropic تولید کند. `variables` هم بدون schema است.
- **راه‌حل:** whitelist نقش‌محور (`support-chat` برای مشتری؛ بقیه فقط با `requirePermission`) + Zod schema برای body.
- **Severity: high**

### W6 — خطای دامنه‌ای نادرست در finance
- **فایل:** `src/server/modules/finance/service.ts:60,95`
- **چرا مهم:** `throw new Error('Invoice not found')` به‌جای `NotFoundError` → `handleServiceError` آن را ۵۰۰ `INTERNAL_ERROR` می‌کند و به‌عنوان «Unhandled API error» با کل شیء err لاگ می‌شود؛ semantics API می‌شکند و monitoring آلوده به false-positive می‌شود.
- **راه‌حل:** جایگزینی با `NotFoundError('فاکتور یافت نشد')` از `@/server/shared/errors`.
- **Severity: medium**

### W7 — رویداد دوبارهٔ `coupon.applied`
- **فایل:** `src/server/modules/marketing/service.ts:128-148`
- **چرا مهم:** داخل تراکنش یک `outboxEvent` ساخته می‌شود و **بعد از** تراکنش دوباره `eventBus.publish` همان رویداد را ثبت می‌کند → دو ردیف outbox، دو بار پردازش در worker. امروز handler این رویداد فقط لاگ است، اما هر subscriber آینده (مثلاً آمار کمپین) دوبار می‌شمارد.
- **راه‌حل:** حذف `eventBus.publish` بیرونی؛ outbox داخل تراکنش کافی و درست‌تر است.
- **Severity: medium**

### W8 — redirect پرداخت به مسیری که وجود ندارد
- **فایل:** `src/app/api/payments/webhook/zarinpal/route.ts:113-116`
- **چرا مهم:** `orderStatusUrl` به `/orders/{id}` هدایت می‌کند اما در `src/app/` هیچ صفحهٔ `orders/[id]` عمومی وجود ندارد (فقط `/dashboard` و `admin/(panel)/orders`) → کاربر پس از پرداخت موفق ۴۰۴ می‌بیند.
- **راه‌حل:** هدایت به `/checkout/success?orderId=...&status=...` (صفحهٔ موجود) یا ساخت صفحهٔ `orders/[id]`.
- **Severity: medium** (تجربهٔ پرداخت = اعتماد مشتری)

### W9 — rate-limit پیش‌فرض file-store در استقرار چند-instance
- **فایل:** `src/lib/auth/server/rate-limit.ts:28-44` + `docker-compose.prod.yml` (بدون `RATE_LIMIT_STORE=redis`)
- **چرا مهم:** compose فعلی تک-app است، اما به محض scale افقی، هر instance شمارندهٔ خودش را دارد و سقف مؤثر × تعداد instance می‌شود. `RATE_LIMIT_STORE=redis` پیاده‌سازی شده ولی در compose فعال نیست.
- **راه‌حل:** افزودن `RATE_LIMIT_STORE=redis` به سرویس app در `docker-compose.prod.yml`.
- **Severity: medium**

### W10 — stage مردهٔ `deps` در Dockerfile
- **فایل:** `Dockerfile:5-9`
- **چرا:** stage `deps` (`npm ci --omit=dev`) در هیچ `COPY --from=deps` استفاده نمی‌شود — فقط زمان build و cache را هدر می‌دهد.
- **راه‌حل:** حذف stage یا استفادهٔ واقعی از آن.
- **Severity: low**

---

## ۴) بدهی‌های فنی

### TODOهای کد (۳ مورد — همگی مستند و فازبندی‌شده ✅)
| فایل:خط | متن | وضعیت |
|---|---|---|
| `src/server/communications/providers/smtp.ts:8` | اتصال SMTP — فاز ۵ | stub سالم؛ `success:false` برمی‌گرداند (fail-closed) |
| `src/server/modules/products/repository.ts:74` | pgvector semantic search — فاز ۵ | ستون `embedding` در schema آماده است |
| `src/server/upload/providers/s3.ts:7` | ArvanCloud S3 — فاز ۸ | provider انتخاب‌پذیر با env |
| `prisma/schema.prisma:9` | zod-prisma-types — فاز ۲ | فعلاً Zod دستی در `shared/validation.ts` |

### `as any` ها (۲۳ مورد در سرور)
- **الگوی غالب:** «Prisma stub vs real» — چون `db.ts` در build یک Proxy برمی‌گرداند، تایپ‌ها cast می‌شوند. متمرکزترین‌ها:
  - `finance/repository.ts:41,96,105,108,114,116,128` — status/type/metadata
  - `orders/repository.ts:44,50,55` و `orders/service.ts:72,74,80,106,127`
  - `products/repository.ts:63,67` — کل `data as any` (خطرناک‌ترین: هر فیلد اضافه‌ای پاس می‌شود)
  - `event-bus.ts:24`, `shipping/repository.ts:45,46,63`, `marketing/*:41,129,137`
- **ریشه:** تایپ‌های تولیدی Prisma (`Prisma.ProductCreateInput`, `$Enums.InvoiceStatus`) استفاده نمی‌شوند. با client تولیدشده، اکثر این castها حذف‌شدنی‌اند.
- **`unknown → cast`:** `products/service.ts:76-87` — `create(input: unknown)` سپس `input as CreateProductData`؛ اتکاء کامل به این‌که «route حتماً Zod زده باشد».

### DRY violations
| تکرار | مکان‌ها | پیشنهاد |
|---|---|---|
| `DEFAULT_PER_PAGE = 9` / `MAX_PER_PAGE = 100` | `shared/constants.ts:19-20`، `products/service.ts:10-11`، `lib/api.ts:19` | import از `shared/constants` (سمت سرور) |
| بلوک rate-limit + 429 دستی | `marketing/coupons/validate/route.ts:24-34`، `ai/chat/route.ts:14-20`، `ai/advisor/route.ts` | استفاده از `checkMutationRateLimit` یا helper مشابه برای non-mutation |
| الگوی `listX(opts) { page/limit/where/Promise.all }` | `finance/repository.ts:67-90,132-156`، `communications/repository.ts:30-64`، shipping/marketing | helper ژنریک `paginatedList` |
| ساخت `orderStatusUrl` / `SITE_URL` fallback | `payments/service.ts:8`، `webhook/zarinpal/route.ts:114` | یک `getSiteUrl()` در shared با اعتبارسنجی env |

### Magic numbers / strings باقی‌مانده
- `'claude-sonnet-4'` چهار بار hardcode در `ai/gateway.ts:56,71,141,154` → باید `AI_CHAT_MODEL` (env/constant) شود.
- TTLهای cache به‌صورت inline: `products/service.ts:14` (۶۰s)، `shipping/service.ts:8` (۳۰۰s) — قابل قبول ولی بهتر است در `shared/constants.ts` باشند.
- سقف‌های rate-limit پراکنده در routeها (10/20/30 در دقیقه) — یک جدول متمرکز خوانایی ممیزی را بالا می‌برد.
- `perPage: 500` در `lib/api.ts:93` (getProductsByCategory) و `10_000` در `getProducts`.

### وابستگی چرخه‌ای
- `madge --circular` روی ۴۸۹ فایل: **صفر چرخه** ✅. چرخهٔ بالقوهٔ `db → jobs → registry → workers → db` با dynamic import در `jobs/init.ts:17` عمداً شکسته شده است.

### سایر
- `errors.ts:69` — `(this as { code: string }).code = ...` برای دور زدن `readonly`؛ بهتر است `code` از constructor پاس شود.
- `safety.ts:12-16` — الگوی سوم `\b\d{10}\b` عملاً dead است (الگوی اول `\d{10,11}` زودتر می‌گیرد)؛ الگوهای injection فقط انگلیسی‌اند (فارسی: «دستورهای قبلی را نادیده بگیر» رد می‌شود).
- `outbox-dispatcher.ts:36` — `retryCount` در هر claim افزایش می‌یابد حتی وقتی پردازش موفق است؛ اگر worker کندتر از ۵ دورهٔ poll باشد، رویداد سالم DLQ می‌شود.

---

## ۵) پیشنهادات بهبود (اولویت‌دار)

### P0 — صحت مالی/موجودی
1. **outbox داخل تراکنش verify** (W1) و **گذار اتمیک سفارش** (W3) — الگوی موجود outbox را فقط باید به این دو نقطه تعمیم داد.
2. **قاعدهٔ «پرداخت فقط با رزرو زنده»** (W2) — یا انقضای سفارش هم‌زمان با انقضای رزرو، یا رزرو مجدد در `confirmOrder`.

### P1 — قرارداد API و Type Safety
3. Zod برای content routes + ai/chat (W4, W5) و نگاشت `P2002 → 409` در `handleServiceError` (تشخیص `Prisma.PrismaClientKnownRequestError`).
4. حذف تدریجی `as any` با تایپ‌های تولیدی Prisma — شروع از `products/repository.ts` و `finance/repository.ts` (پرریسک‌ترین‌ها).
5. `NotFoundError` در finance (W6).

### P2 — Performance
6. **جستجوی محصول:** `contains insensitive` روی ۴ ستون (`products/repository.ts:81-88`) = full scan. افزودن extension `pg_trgm` + ایندکس GIN روی `name/model/sku/brand` (schema از `postgresqlExtensions` پشتیبانی می‌کند).
7. **ایندکس‌های جامانده:** `coupons(active, expiresAt)` برای listActiveCampaigns/کوپن‌ها، `campaigns(active, startDate, endDate)`، `posts(isPublished, publishedAt)`، `pages(isPublished)`، `payment_intents(status, expiresAt)` (برای پاکسازی انقضا).
8. **N+1 پنهان در `lib/api.ts`:** `getProducts(perPage:10_000)` برای sitemap — با رشد کاتالوگ باید endpoint سبک `fields=slug,updatedAt` اضافه شود (بدون تغییر امضا؛ فقط بدنهٔ سرور).
9. **صف به‌جای polling:** `outbox-dispatcher` و `inventory-expiry` با `Queue.upsertJobScheduler` (BullMQ repeatable) به‌جای `setInterval` — عدم دوبار اجرا با قفل داخلی BullMQ و شفافیت در UI/metrics.

### P3 — الگوهای طراحی
10. **Strategy/Registry برای providerها:** `resolvePaymentProviderByCode` با if/else؛ یک `Map<code, adapter>` تمیزتر و توسعه‌پذیرتر است (افزودن سامان/به‌پرداخت بدون دست زدن به gateway).
11. **Unit of Work سبک:** پاس دادن `tx` به repositoryها (الگوی `inventoryRepository.reserveForOrder(tx, ...)` که همین حالا درست است) به بقیهٔ ماژول‌ها تعمیم یابد تا service بتواند چند repository را در یک تراکنش هماهنگ کند.
12. **Idempotent consumer:** در `outbox-worker`، ثبت `processedAt` شرطی (`updateMany where processedAt: null`) تا مصرف موازی دو worker یک event را دوبار side-effect نزند.

---

## ۶) چک‌لیست امنیتی

| پرسش | وضعیت | جزئیات |
|---|---|---|
| PII در لاگ‌ها؟ | ⚠️ **نسبی** | pino ساختاریافته است و پیام‌های اصلی فقط id لاگ می‌کنند؛ اما `commsService`/`smtp.ts:9` ایمیل گیرنده (`to`) را لاگ می‌کند و `EmailLog/SmsLog` بدنهٔ کامل پیام + شماره/ایمیل را **بدون retention policy** در DB نگه می‌دارند. `redactPII` فقط در مسیر AI اعمال می‌شود، نه روی loggerها. پیشنهاد: redaction paths در pino (`redact: ['to','email','phone']`) + سیاست پاکسازی دوره‌ای logs. |
| Rate limit روی APIها؟ | ✅ / ⚠️ | دولایه: nginx (10r/s عمومی، 5r/m لاگین ادمین) + اپلیکیشن (`checkMutationRateLimit` روی orders/payments/products/upload، دو‌لایه در login مشتری و advisor). **شکاف:** mutationهای content/coupons/shipments فقط پشت RBAC هستند بدون سقف نرخ، و GET webhook زرین‌پال فقط سقف nginx دارد. |
| SQL Injection؟ | ✅ | تمام `$queryRawUnsafe`ها با پارامتر bound (`$1, $2`) هستند؛ در `api/inventory/route.ts:26-33` بخش `WHERE` از رشته‌های ثابت انتخاب می‌شود نه ورودی کاربر. Prisma برای بقیه. نقطهٔ قابل پایش: هر `Unsafe` جدید باید code-review اجباری داشته باشد (قاعدهٔ eslint سفارشی پیشنهاد می‌شود). |
| File upload محدود؟ | ✅ | whitelist MIME + magic bytes + سقف ۱۰MB (اپ و nginx `client_max_body_size 10m` هم‌راستا) + regex پوشه + RBAC `content:write` + rate-limit 5/min + سرو با `attachment/nosniff`. |
| Secretها در env؟ | ✅ | هیچ secret hardcode یافت نشد؛ `.env.example` کامل است؛ compose از `env_file` می‌خواند؛ fallback فقط dev-secret با نام صریح `do-not-use-in-production` و در production پرتاب خطا (`session-token.ts:18-27`). ⚠️ `DATABASE_URL` با پسورد در `environment` compose تعریف می‌شود — با `docker inspect` قابل خواندن است؛ secrets driver بهتر است. |
| HMAC/Encryption درست؟ | ✅ | HMAC-SHA256 با WebCrypto، مقایسهٔ timing-safe، base64url استاندارد، ابطال نسخه‌ای توکن. پسورد با scrypt (`password-hash.ts`) + dummy-hash علیه user-enumeration و تأخیر ثابت در login. نکته: `timingSafeEqual` طول را زودتر لو می‌دهد (early return) — برای HMAC با طول ثابت بی‌اثر است. |
| CSRF/XSS | ✅ | کوکی `sameSite: strict` + `httpOnly`؛ CSP مبتنی بر nonce + `strict-dynamic`؛ uploads با `attachment`. |
| Fail-closed پرداخت/AI | ✅ | mock در production ممنوع (۵۰۳)؛ amount از DB نه callback؛ verify سمت سرور. |

---

## ۷) جمع‌بندی

کد در ردهٔ «بسیار خوب برای فاز فعلی» است: معماری مدولار منضبط، مستندسازی الگو، و مهم‌ترین سطوح حمله (پرداخت، upload، session) درست مهار شده‌اند. سه ریسک واقعیِ تولید، هر سه در **مرز پرداخت↔سفارش↔موجودی** هستند (W1، W2، W3) و هر سه با همان الگوی outbox/transaction موجودِ خود پروژه قابل حل‌اند — بدون تغییر ساختار، بدون شکستن قرارداد `src/lib/api.ts`، و بدون حذف mock adapterها.
