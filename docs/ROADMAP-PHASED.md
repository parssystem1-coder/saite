# نقشه راه فازی — اصلاح بک‌اند Saite
## مرجع اجرا برای تمام سشن‌های آینده

> **نسخه:** 1.0 — ۱۸ مرداد ۱۴۰۵ (2026-08-09)  
> **مرجع تحلیل:** `docs/AUDIT-COMBINED-FINAL-2026-08-09.md` (تجمیع دو گزارش مستقل، میانگین ۵.۵/۱۰)  
> **شاخه‌های مرتبط:** `arena/019fe81d-saite` (سشن فعلی، commit `676a838`) و `arena/019fe061-saite` (commit `9667c06` — گزارش B)  
> **قانون طلایی هر فاز:** `npm run type-check && npm run lint && npm run test && npm run build` سبز → `git add` → `commit -m "پیام فارسی"` → `git push origin arena/019fe81d-saite` (و mirror به `019fe061` اگر نیاز بود)  
> **قراردادهای تغییرناپذیر:** `src/lib/api.ts` امضا ثابت · Mock adapters حذف نمی‌شوند · بدون تغییر ساختار اصلی — فقط refactoring

---

## نمای کل — ۷ فاز، ۱۹ روز کاری، ۱۵ بحران (C1-C15)

| فاز | نام | بحران‌های پوشش | مدت | پیش‌نیاز | خروجی قابل سنجش |
|-----|-----|---------------|------|----------|-----------------|
| **۰** | تثبیت بیلد — Build سبز | C1, C10, C11 | ۱-۲ روز | هیچ | `npm run build` بدون `DATABASE_URL` **دیگر کرش نمی‌کند** + `docker compose build` سبز + migration اولیه |
| **۱** | بستن حفره مالی — Financial Firewall | C2, C7 | ۲-۳ روز | فاز ۰ | هیچ سفارشی با قیمت کلاینت ثبت نمی‌شود؛ کوپن race ندارد |
| **۲** | قفل API — سد احراز هویت | C3, C4, C5, C6 | ۳-۴ روز | فاز ۰ | تمام `POST/PATCH/DELETE` مدیریتی `401` بدون توکن؛ IDOR بسته |
| **۳** | یکپارچگی داده و صف | C9, C12, C14 | ۲-۳ روز | فاز ۱+۲ | `order.paid → invoice + inventory + email` اتمیک؛ دیسپچر با DLQ |
| **۴** | سخت‌سازی API و قرارداد | C8, C13, C15 + R6 | ۲ روز | فاز ۲ | `perPage ≤100`، rate-limit روی `ai/chat`، خطاها یکسان‌شکل |
| **۵** | کیفیت کد و مشاهده‌پذیری | R16, R11, R10, R17 | ۲-۳ روز | فاز ۴ | صفر `as never`، `pino` واقعی، `constants.ts` |
| **۶** | زیرساخت و مقیاس | R12, R15 | ۲ روز | فاز ۰ | `compose` بدون `ports:3000` مستقیم، healthcheck، worker جدا |
| **۷** | تست | R14 | موازی P1-P6 | فاز ۰ | `state-machine/coupon/session` ≥۸۰٪ + ۳ integration کلیدی |

> **ترتیب اجرا الزامی است:** فاز ۰ باید اول شود — بدون آن هیچ `verify` معنادار نیست. فاز ۱ و ۲ را می‌توان موازی با دو نفر برد، ولی فاز ۳ بدون فاز ۱ بی‌معناست (جریان پول به قیمت درست وابسته است).

---

## فاز ۰ — تثبیت بیلد (C1, C10, C11)

**هدف:** `npm run verify` و `docker compose build` بدون تکیه بر DB زنده سبز شوند.

### بحران‌ها

| شناسه | عنوان | فایل‌های درگیر |
|-------|-------|---------------|
| C1 | `process.exit` در `db.ts` + بوت جاب در import | `src/server/shared/db.ts:10-17`, `src/server/jobs/init.ts`, `src/server/jobs/registry.ts` |
| C10 | `Dockerfile:9` `--omit=dev` → غیبت `typescript/@tailwindcss/postcss` در builder | `Dockerfile` |
| C11 | صفر migration واقعی (`prisma/migrations/` فقط README) | `prisma/schema.prisma`, `prisma/migrations/` |

### چک‌لیست اجرایی

- [ ] **C1-a** حذف `prisma.$connect().catch(...process.exit)` از `src/server/shared/db.ts` — Prisma lazy بماند، خطا فقط در `/api/health` دیده شود
- [ ] **C1-b** حذف `startBackgroundJobs()` از سطح ماژول `db.ts` → انتقال به `src/instrumentation.ts` (Next 15+ hook) با guard `if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test') return`
- [ ] **C1-c** گسستن چرخه `db → jobs/init → registry → workers → db` — `registry.ts` فقط `export function createWorkers()` کند، نه `new Worker` در سطح ماژول
- [ ] **C1-d** `src/server/shared/redis.ts` → `lazyConnect: true` + `enableReadyCheck: true` (یا حذف `new IORedis` از import)
- [ ] **C10-a** `Dockerfile` دو `node_modules`: یکی کامل برای builder (`npm ci`) و یکی `omit=dev` فقط برای runner — یا `COPY --from=deps` را فقط برای runner نگه دار و builder `npm ci` جدا بزند
- [ ] **C10-b** افزودن `HEALTHCHECK --interval=30s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"`
- [ ] **C11-a** `npx prisma migrate dev --name init` روی dev → کامیت `prisma/migrations/*` (شامل ایندکس‌های C14 اگر خواستید همین‌جا بیاورید)
- [ ] **پیش‌نیاز کوچک (رفع ۱ خطای type-check فعلی):** `src/app/api/payments/webhook/zarinpal/route.ts:57` → `async (tx: Prisma.TransactionClient) =>` (همین commit)
- [ ] **خانه‌تکانی ۹ اوت:** `package.json` → `"engines": {"node": ">=22"}` + `npm install` → `npm ci` در `ci.yml` + `pino-pretty` به `devDependencies`

### معیار پذیرش

```bash
DATABASE_URL="" npm run build  # دیگر P1012 نمی‌دهد، فقط health 503
docker compose -f docker-compose.prod.yml build  # سبز
npx prisma migrate deploy  # روی CI با DB خالی سبز
npm run verify  # type-check/lint/test سبز، build با DATABASE_URL dummy سبز
```

### کامیت پیشنهادی

```bash
npm run verify
git add src/server/shared/db.ts src/server/shared/redis.ts src/server/jobs/init.ts src/server/jobs/registry.ts src/instrumentation.ts Dockerfile prisma/migrations prisma/schema.prisma package.json
git commit -m "فاز ۰: تثبیت بیلد — حذف اتصال مشتاق Prisma و process.exit، اصلاح Dockerfile و افزودن migration اولیه"
git push origin arena/019fe81d-saite
git push origin HEAD:arena/019fe061-saite  # mirror برای سازگاری با نام تسک
```

---

## فاز ۱ — بستن حفره مالی (C2, C7)

**هدف:** پول فقط با قیمت سرور محاسبه شود؛ کوپن قابل سوءاستفاده نباشد.

### چک‌لیست

- [ ] **C2-a** `src/server/modules/orders/service.ts` — امضا شود `create(input: {customerId, items: {productId, quantity}[]})` بدون `unitPrice`
- [ ] **C2-b** داخل `prisma.$transaction` قیمت هر `productId` را از DB بخوان، `priceType==='fixed' && price!=null && stockStatus!=='out_of_stock'` assert
- [ ] **C2-c** از `src/lib/checkout/price-authority.ts` (از طریق `actions.ts` wrapper) یا منطق مشابه داخل تراکنش استفاده کن؛ `totalAmount` سروری
- [ ] **C2-d** `Order + OrderItem[] + OutboxEvent` در یک `$transaction` واحد (nested `create` یا `createMany`)
- [ ] **C2-e** `src/app/api/orders/route.ts:29-33` فقط `productId/quantity` بگیرد
- [ ] **C7-a** `marketing/service.ts:69-78` → `prisma.coupon.updateMany({where:{id, usageCount:{lt: usageLimit}}, data:{usageCount:{increment:1}}})` و چک `count===1`
- [ ] **C7-b** جدول `CouponRedemption (couponId, customerId, orderId, @@unique([couponId, customerId]))` یا تا آن زمان `perCustomerLimit` را از API حذف/مستند “نمایشی”
- [ ] تست هم‌زمانی کوپن (دو request موازی)

### معیار پذیرش

```bash
# curl با unitPrice دستکاری‌شده → 400 یا قیمت DB برگردد نه ۱۰۰۰ ریال
# دو درخواست همزمان کوپن با سقف ۱ → یکی 409
npm run verify
```

### کامیت

```bash
git add src/server/modules/orders/service.ts src/server/modules/orders/repository.ts src/app/api/orders/route.ts src/server/modules/marketing/service.ts prisma/schema.prisma
git commit -m "فاز ۱: قفل مالی — محاسبه قیمت از DB و اعمال اتمیک سقف کوپن"
git push origin arena/019fe81d-saite
```

---

## فاز ۲ — قفل API (C3, C4, C5, C6)

**هدف:** هیچ نوشتاری بدون نقش، هیچ خواندنی بدون مالکیت.

### چک‌لیست

- [ ] **C3** روی همه نوشتاری: `POST /api/products`, `PATCH/DELETE /api/products/[id]`, `POST /api/marketing/coupons|campaigns`, `POST /api/shipping/rates|shipments`, `PATCH /api/shipping/shipments/[id]`, `POST/PATCH/DELETE /api/content/**` → `const guard = await requirePermission('<domain>:write'); if(!guard.ok) return guard.response` + `actorId = guard.admin.id` به‌جای `'system'`
- [ ] **C3-mirror** خواندن مدیریتی `GET /api/marketing/coupons`, `/api/shipping/rates` → `requirePermission(':read')`؛ خواندن عمومی فقط `isPublished:true/active:true`
- [ ] **C4** `GET /api/finance/invoices?customerId=` → `requirePermission('finance:read')`؛ نسخه مشتری جدا `GET /api/me/invoices` با `customerId = session.sub` + `ForbiddenError → 403` در `handleServiceError`
- [ ] **C4** `GET /api/comms/email-logs|sms-logs` + `GET /api/shipping/shipments/[id]` → `requirePermission('comms:read'|'shipping:read')`
- [ ] **C5** `prisma/schema.prisma` → `Customer.passwordHash String?` + migration + reuse `src/lib/auth/server/password-hash.ts` (scrypt) + `consumeRateLimit` per-IP+per-email روی `POST /api/customers/session` + guard `NODE_ENV !== 'production'` تا تکمیل
- [ ] **C6** `POST /api/upload` → `requirePermission('media:write')` + مپ `mimetype → ext` ثابت (نادیده گرفتن پسوند کلاینت) + `folder` whitelist `/^[a-z0-9-]{1,32}$/` + حذف PDF یا `Content-Disposition: attachment` + `nginx: client_max_body_size 10m`

### معیار پذیرش

```bash
curl -X POST /api/products -d '{}'  # بدون کوکی → 401
curl "/api/finance/invoices?customerId=other" -H "Cookie: ..."  # → 403 یا فیلتر به خود
curl -X POST /api/upload -F file=@x.html  # بدون auth → 401؛ با auth و .html → 400
```

### کامیت‌ها (قابل شکستن به ۲)

```bash
git add src/app/api/products src/app/api/marketing src/app/api/shipping src/app/api/content
git commit -m "فاز ۲-الف: قفل نوشتاری مدیریتی — اتصال requirePermission به تمام POST/PATCH/DELETE"
git push origin arena/019fe81d-saite

git add src/app/api/finance src/app/api/comms src/app/api/shipping src/app/api/customers/session.route.ts src/app/api/upload/route.ts src/server/upload/providers/local.ts prisma/schema.prisma nginx/nginx.conf
git commit -m "فاز ۲-ب: بستن IDOR، ورود مشتری امن و سخت‌گیری آپلود"
git push origin arena/019fe81d-saite
```

---

## فاز ۳ — یکپارچگی داده و صف (C9, C12, C14)

**هدف:** پرداخت موفق واقعاً فاکتور و موجودی و ایمیل بسازد؛ صف هرگز گیر نکند.

### چک‌لیست

- [ ] **C9** `webhook/zarinpal:61-66` فقط `ordersService.transitionState(orderId,'paid','zarinpal-webhook')` → انتشار `order.paid` به outbox
- [ ] **C9** `outbox-worker.ts` هندلر `order.paid`: `financeService.createInvoiceFromOrder` (idempotent موجود) + `inventoryService.reserveItems` + `emailQueue.add('order_confirmation')` — همه idempotent
- [ ] **C12** `outbox-dispatcher.ts` claim اتمیک: `dispatchedAt` ستون یا `updateMany` → فقط dispatch نشده‌ها + `retryCount++` روی `failed` و پس از ۵ به DLQ/flag
- [ ] **C12** `POLL_INTERVAL_MS` از `env`
- [ ] **C14** در migration فاز ۰ یا جدا: `@@index([customerId, createdAt])` روی `Order`/`Invoice`, `@@index([category, createdAt])` و `@@index([brand])` روی `Product`, `@@index([orderId])` روی `PaymentIntent`, `Order.customerId → Customer @relation(onDelete: Restrict)`, `onDelete` صریح برای `OrderItem`

### معیار پذیرش

```bash
# پرداخت موفق → invoice در DB، ایمیل در queue، موجودی رزرو
# kill کردن worker وسط dispatch → پس از restart دوباره dispatch ولی بدون دوبار invoice
```

### کامیت

```bash
git add src/app/api/payments/webhook/zarinpal/route.ts src/server/jobs/workers/outbox-worker.ts src/server/jobs/dispatchers/outbox-dispatcher.ts prisma/schema.prisma prisma/migrations
git commit -m "فاز ۳: زنجیره پرداخت و صف — اتصال invoice/inventory/email به order.paid و DLQ"
git push origin arena/019fe81d-saite
```

---

## فاز ۴ — سخت‌سازی API و قرارداد (C8, C13, C15 + R6)

**هدف:** API در برابر DoS و سوءاستفاده هزینه‌ای مقاوم؛ قرارداد HTTP mode ناقص نباشد.

### چک‌لیست

- [ ] **C8** `perPage = Math.min(100, Math.max(1, Number(...)))` + `Number.isFinite` guard + helper `parsePagination(searchParams)` در `src/app/api/products/_utils.ts` و استفاده در ۱۰ route
- [ ] **C13** `POST /api/ai/chat` → `requirePermission('ai:use')` یا `getCustomerSession` + `Redis INCR+EXPIRE` سقف روزانه per-user + `actorId` از session نه body + `consumeRateLimit` روی `POST /api/marketing/coupons/validate` و `POST /api/customers/session`
- [ ] **C15** یکسان‌سازی خطا: سرور همیشه `{error, message}`، `src/lib/api-client.ts:54` هر دو کلید را بخواند؛ `GET /api/products?featured=1` آرایه برگرداند (سازگار با `src/lib/api.ts:97-107`)؛ ۵ endpoint موهوم (`/compatible`, `/by-ids` ...) یا route واقعی یا fallback خالی بدون تغییر امضا
- [ ] **R6** `src/server/shared/validation.ts` — Zod schema برای body/query هر route + `ValidationError` → `400` با پیام فارسی

### کامیت

```bash
git add src/app/api/products/_utils.ts src/app/api src/lib/api-client.ts src/server/shared/validation.ts
git commit -m "فاز ۴: سخت‌سازی API — سقف صفحه، rate-limit، یکسان‌سازی خطا و اعتبارسنجی Zod"
git push origin arena/019fe81d-saite
```

---

## فاز ۵ — کیفیت کد و مشاهده‌پذیری (R16, R11, R10, R17)

**هدف:** صفر `as never`، لاگ واقعی، بدون magic.

### چک‌لیست

- [ ] **R16** حذف ۱۷ `as never` با `Prisma.*CreateInput/WhereInput` + مپر `toPublicProduct(prismaProduct): Product` (تنها نقطه ترجمه `price: null → undefined`)
- [ ] **R11** مهاجرت `console.*` در ۱۴ فایل سرور به `pino` (`src/server/shared/logger.ts`) + `childLogger({traceId})` در routeها + `redact: ['*.to','*.phone','*.email']`
- [ ] **R10** ادغام دو `session-token` (۳۰۴+۱۱۷ خط) → core HMAC مشترک + افزودن `version` revocation به نشست مشتری + تست واحد هر دو
- [ ] **R17** `src/server/shared/constants.ts` (TTLها، `TAX_RATE` از env، `PAYMENT_INTENT_TTL_MS`, `INVOICE_DUE_DAYS`) + helper `fetchJson(url, {timeoutMs})` با `AbortSignal.timeout(10_000)` برای ۸ fetch خارجی + رفع `taxRate=0.09` هاردکد

### کامیت‌ها

```bash
git add src/server/modules src/server/shared/event-bus.ts
git commit -m "فاز ۵-الف: حذف as never با تایپ‌های Prisma و مپر صریح"
git push origin arena/019fe81d-saite

git add src/server src/lib/auth/server/session-token.ts src/server/auth/session-token.ts src/server/shared/constants.ts
git commit -m "فاز ۵-ب: لاگ pino، یکپارچه‌سازی session-token و ثابت‌ها"
git push origin arena/019fe81d-saite
```

---

## فاز ۶ — زیرساخت و مقیاس (R12, R15)

**هدف:** compose و nginx دقیقاً همان چیزی باشد که سند وعده داده.

### چک‌لیست

- [ ] **R15-compose** حذف `ports: "3000:3000"` → `expose: - "3000"` (فقط nginx به اینترنت) + `healthcheck` برای `db`/`redis` + `depends_on: condition: service_healthy` + `deploy.resources.limits` طبق بودجه RAM سند + mount `uploads:/app/public/uploads:ro` برای سرویس `nginx` (یا حذف `location /uploads/` از nginx)
- [ ] **R15-nginx** `client_max_body_size 10m` + map شرطی برای `Connection: upgrade` + pin دامنه/گواهی با متغیر `DOMAIN` به‌جای هاردکد `saite.ir` + صفحات خطای سفارشی
- [ ] **R12** سرویس `worker` جدا در compose (همان ایمیج، `command: ["node","--loader","tsx","src/server/jobs/start.ts"]` یا `tsx` جدا) + `RUN_JOBS=1` flag — producer در app، consumer در worker، dispatcher فقط در worker

### کامیت

```bash
docker compose -f docker-compose.prod.yml config  # اعتبارسنجی
git add docker-compose.prod.yml nginx/nginx.conf src/server/jobs/start.ts
git commit -m "فاز ۶: هم‌ترازی زیرساخت — healthcheck، worker جدا و اصلاح nginx"
git push origin arena/019fe81d-saite
```

---

## فاز ۷ — تست (R14) — موازی با فاز ۱-۶

**هدف:** هر بحران با تست قفل شود.

### چک‌لیست

- [ ] واحد خالص: `state-machine` گذار مجاز/ممنوع، `marketing.validateCoupon` با repo موک، `session-token` انقضا/امضا/نوع، `price-authority` reprice
- [ ] Integration با Postgres واقعی (services آماده در `ci.yml`): `orders.create` قیمت سروری، `webhook` idempotency (دو بار `Authority` یکسان)، `coupon` race
- [ ] فعال‌سازی `tests/integration/products.test.ts.skip` → `.test.ts`
- [ ] E2E برای HTTP mode قرارداد (`?featured=1`, `/by-ids`)

### کامیت

```bash
git add tests vitest.config.ts
git commit -m "فاز ۷: پوشش تست سرور — واحد و یکپارچگی با DB واقعی"
git push origin arena/019fe81d-saite
```

---

## الگوهای طراحی پیشنهادی (بدون تغییر ساختار کلی)

| الگو | کجا | منفعت |
|------|-----|-------|
| Unit of Work / `prisma.$transaction` | `orders.create`, webhook, coupon apply | Outbox واقعی؛ سازگاری رویداد↔داده |
| Strategy (موجود) | `payments/upload/ai` providers | حفظ؛ factory یکدست `resolveProvider<T>` |
| Repository interface + DI سبک | `createOrdersRepository(prisma)` | تست بدون DB؛ حذف singleton سخت |
| State Machine تعمیم‌یافته | `Invoice`/`Shipment` مثل `Order` | جلوگیری از `paid → refunded → paid` |
| Retry + timeout policy | فراخوانی‌های خارجی | `fetchJson` یکدست، قابل تست |
| Idempotency-Key | `POST /api/orders`, `/api/upload` | دوبار-کلیک بدون دوبله |

---

## بهینه‌سازی Performance — چک‌لیست سریع هر فاز

| # | مورد | محل | فاز |
|---|------|------|-----|
| ۱ | N+1 ساخت آیتم | `orders/service.ts:35-41` → `createMany` در `$transaction` | ۱ |
| ۲ | ایندکس `Order.customerId` | schema C14 | ۳ |
| ۳ | ایندکس `category/brand` | schema | ۳ |
| ۴ | دیسپچر scan | `outbox-dispatcher` + claim اتمیک | ۳ |
| ۵ | سقف صفحه | `perPage ≤100` | ۴ |
| ۶ | include عریض | `orders/repository:6-9` فقط `select` | ۴ |
| ۷ | کش پاسخ عمومی | `Cache-Control: s-maxage=60` | ۴ |
| ۸ | `getActiveCampaigns` بدون سقف | `marketing/repository:99` | ۴ |

---

## چگونه در سشن جدید ادامه دهیم (راهنمای ۳۰ ثانیه‌ای)

1. `git fetch origin && git checkout arena/019fe81d-saite && git pull` (یا `019fe061` اگر تسک آن است)
2. `cat docs/PROGRESS-TRACKER.md` — ببین کدام فاز `⏳ در حال انجام` است
3. `cat docs/AUDIT-COMBINED-FINAL-2026-08-09.md` — جزئیات بحران همان فاز
4. همان فاز را ادامه بده؛ پس از هر زیر-تسک `npm run verify` → commit فارسی → push
5. پس از اتمام فاز، `PROGRESS-TRACKER.md` را به‌روزرسانی کن و push کن

> **نکته دو شاخه:** `019fe81d` شاخه سشن فعلی و `019fe061` شاخه گزارش B است. هر push را روی هر دو انجام بده: `git push origin HEAD:arena/019fe81d-saite && git push origin HEAD:arena/019fe061-saite`

---

## مراجع

- تحلیل تجمیعی کامل: `docs/AUDIT-COMBINED-FINAL-2026-08-09.md`
- تحلیل اولیه: `docs/AUDIT-2026-08-09-FULL.md`
- گزارش خارجی پیوست‌شده: (متن کامل در `AUDIT-COMBINED` فصل ۹ تطبیق شده)
- سند معماری: `docs/BACKEND-ARCHITECTURE.md`
- قرارداد API: `docs/API_CONTRACT.md`
