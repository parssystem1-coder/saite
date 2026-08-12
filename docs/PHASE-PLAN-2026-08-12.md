# نقشهٔ راه فازبندی اصلاحات — Saite بکاند

> **تاریخ:** ۲۰۲۶-۰۸-۱۲ · **شاخهٔ نشست:** `arena/019ff76f-saite`
> **هدف:** تقسیم اصلاحات گزارش تحلیلی به فازهای مستقل و قابل commit، با رعایت قوانین:
> - بدون تغییر ساختار اصلی — فقط refactoring و بهبود
> - Mock adapters حذف نشوند؛ فقط stub بماند
> - Contract-first — امضای `src/lib/api.ts` تغییر نکند
> - قبل از هر commit: `npm run type-check && npm run lint && npm run test && npm run build`

---

## ۰) قواعد کلی هر فاز

1. هر فاز با یک commit جداگانه به `arena/019ff76f-saite` بسته و push میشود.
2. هر فاز مستقل است — تقدم صرفاً پیشنهادی است و میتوان ترتیب را عوض کرد.
3. بعد از هر فاز: `git push origin arena/019ff76f-saite` + اعلام پیام commit به کاربر.
4. هر جا از جدول گزارش ارجاع داده میشود (C1..C8).

---

## فاز ۱ — اعتبارسنجی ورودی با Zod + تمیزکاری Type Safety (رفع C2 و C4)

**چرا اول:** پایهٔ امنیت و درستیداده است و فاز پرداخت (فاز ۲) روی بدنهٔ اعتبارسنجیشدهٔ سفارش سوار میشود. بلست ریداس هر تغییر کم است و تستهای integration موجود، محافظت میکنند.

**محدوده:**
- فعالسازی `parseWithSchema` در Routeهای: `orders` (POST)، `products` (GET/POST/PATCH)، `marketing/coupons` (POST/validate)، `finance/invoices`, `finance/transactions`, `shipping/shipments`, `shipping/rates`.
- جایگزینی دستساز `searchParams.get(...) as X` در `products/route.ts` با `productListQuerySchema`.
- محدود کردن `Json`های ورودی (`shippingAddress`, `metadata`, `specs`) با `.max()`/`.depth()` در zod.
- تبدیل `req.json()` نامعتبر به `ValidationError` (400) بهجای throw خام.
- برداشتن `as unknown as ProductListQuery` و `as unknown as Record<string,unknown>` با تایپ صحیح schema.

**فایلها:** `src/server/shared/validation.ts`، همهٔ route handlerهای بالا، `products/repository.ts`، `finance/repository.ts`.

**خطر:** متوسط (تعداد فایل) ولی هر تغییر محلی و قابلتست.
**پیام commit پیشنهادی:** `اعتبارسنجی ورودی Routeها با Zod و حذف cast های دستی`

---

## فاز ۲ — تکمیل مسیر پرداخت (رفع C1 — 🔴 بحرانی)

**چرا:** بزرگترین شکاف عملکردی؛ بدون آن سفارش از `pending` به `paid` نمیرسد. به فاز ۱ وابسته است (بدنهٔ سفارش اعتبارسنجی شود).

**محدوده:**
- **سرویس پرداخت** `src/server/payments/service.ts`:
  - `initialize(orderId, providerCode?)` → resolve provider از `resolvePaymentProvider()`، ساخت `PaymentIntent` با `idempotencyKey`، بازگشت `redirectUrl`.
  - استفاده از helper های موجود در `src/lib/payments/payment-rules.ts` (`canTransitionPayment`, `assertPaymentAmount`).
  - transition های payment-intent با `paymentIntents` در `PrismaClient` و state-machine سفارش.
- **Endpoint جدید** `POST /api/payments` (بدون تغییر `src/lib/api.ts` — endpoint مستقل): دریافت `orderId`، احراز هویت مشتری، rate-limit، فراخوانی سرویس.
- **اتصال webhook به گیتوی:** در `webhook/zarinpal/route.ts` بهجای import مستقیم `zarinpalProvider`، از `resolvePaymentProvider()` استفاده شود تا fail-closed حفظ شود.
- **رفتار mock:** mockAdapter موجود دستنخورده میماند؛ در NODE_ENV!=production بدون credential، mock برگردد (fail-open فقط برای dev).

**فایلها:** `src/server/payments/service.ts` (جدید)، `src/server/payments/gateway.ts`، `src/app/api/payments/route.ts` (جدید)، `webhook/zarinpal/route.ts`، شاید `orders/service.ts`.

**خطر:** بالا (هستهٔ مالی) — تست integration `payment-webhook` باید به flow کامل create→webhook ارتقا یابد.
**پیام commit پیشنهادی:** `اجرای مسیر کامل پرداخت: ایجاد PaymentIntent و اتصال webhook به گیتوی`

---

## فاز ۳ — Timeout/Retry برای فراخوانیهای خارجی (رفع C3 — 🔴)

**چرا:** جلوگیری از قفلشدن صف/اتصال توسط درگاه یا AI معلق؛ helper آماده (`fetchJson`) بلااستفاده است.

**محدوده:**
- مهاجرت `anthropic.ts`, `openai.ts`, `zarinpal.ts`, `idpay.ts` به `fetchJson` (با `timeoutMs`).
- افزودن retry با backoff به `idpay` (الگوی موجود در zarinpal).
- (اختیاری) افزودن `retryAsync` اختیاری داخل `fetchJson` تا یک helper واحد شود.

**فایلها:** `src/server/shared/fetch.ts`، `src/server/ai/providers/*`، `src/server/payments/providers/*`.

**خطر:** پایین–متوسط.
**پیام commit پیشنهادی:** `افزودن timeout و retry به فراخوانیهای Anthropic/OpenAI/درگاهها`

---

## فاز ۴ — Dedupe منطق worker + شمارهٔ فاکتور امن (رفع C5 و C6)

**چرا:** هر دو کمخطر و مجزا؛ کاهش ریسک خطا در هستهٔ مالی.

**محدوده:**
- یک تابع `handlePaid(orderId)` واحد در `outbox-worker.ts`؛ `order.paid` فقط آن را صدا بزند (حذف کپی).
- جایگزینی `generateInvoiceNumber()` با توالی DB (sequence) یا `cuid()` + ثبت صریح (رفع ریسک برخورد UNIQUE).

**فایلها:** `src/server/jobs/workers/outbox-worker.ts`، `src/server/modules/finance/service.ts` (+ migration برای sequence در صورت لزوم).

**خطر:** پایین–متوسط.
**پیام commit پیشنهادی:** `یکسانسازی منطق پردازش paid و رفع ریسک برخورد شماره فاکتور`

---

## فاز ۵ — Rate-limit چند-نمونهای روی Redis (رفع C7)

**چرا:** با معماری app/worker جدا و مقیاسپذیری آینده، سطلهای فایل-محور مشترک نیستند. رابط `RateLimitStore` ثابت میماند؛ mock/file حفظ میشوند.

**محدوده:**
- افزودن `createRedisStore` در `rate-limit-store.ts` (INCR + EXPIRE، atomic).
- switch در `rate-limit.ts` با env مثل `RATE_LIMIT_STORE=redis` (پیشفرض: file یا memory در test).
- پشتیبانی fallback به file اگر Redis نباشد.

**فایلها:** `src/lib/auth/server/rate-limit-store.ts`, `src/lib/auth/server/rate-limit.ts`.

**خطر:** پایین (رابط بدون تغییر).
**پیام commit پیشنهادی:** `RateLimitStore توزیعشده روی Redis با fallback فایل`

---

## فاز ۶ — پاکسازی بدهیهای کمخطر (DRY / magic numbers / `as any`)

**چرا:** کاهش نگهداری؛ هیچ رفتار تجاری را تغییر نمیدهد.

**محدوده:**
- یک منبع واحد برای MIME map (جلوگیری از تکرار `ALLOWED_TYPES`/`mimeToExt`).
- جایگزینی `30 * 60 * 1000` در ۳ provider با `PAYMENT_INTENT_TTL_MS`.
- متمرکزکردن literal های نوع رویداد (`'order.created'` و…) در `events.ts` shared.
- برداشتن `as any`های باقیمانده در repo ها با تایپهای دقیق (تا جایی که امکانپذیر و بدون شکستن تست باشد).
- (اختیاری) فعالسازی `zod-prisma-types` برای تولید تایپ ورودی از schema.

**فایلها:** `src/server/upload/*`, `src/server/payments/providers/*`, `src/server/modules/*/repository.ts`, `src/server/shared/constants.ts`.

**خطر:** پایین.
**پیام commit پیشنهادی:** `پاکسازی بدهیهای DRY و magic numbers`

---

## جدول خلاصه

| فاز | محتوا | رفع | فایلهای کلیدی | خطر | وابسته به |
|----|------|-----|--------------|----|----------|
| ۱ | Zod در Routeها + Type Safety | C2, C4 | validation.ts, routes, repos | متوسط | — |
| ۲ | تکمیل مسیر پرداخت | C1 | payments/service (جدید), payments/route, webhook | بالا | فاز ۱ |
| ۳ | Timeout/Retry فراخوانیها | C3 | shared/fetch, ai/providers, payments/providers | پایین–متوسط | — |
| ۴ | Dedupe worker + شمارهٔ فاکتور | C5, C6 | outbox-worker, finance/service | پایین–متوسط | — |
| ۵ | Rate-limit روی Redis | C7 | rate-limit-store, rate-limit | پایین | — |
| ۶ | پاکسازی بدهی کمخطر | DRY/magic/any | upload, providers, repos, constants | پایین | — |

> **پیشنهاد ترتیب اجرا:** فاز ۱ → ۲ → ۳ → ۴ → ۵ → ۶ (فازهای ۵ و ۶ مستقلاند و هر وقت خواستی درجا قابل جابهجاییاند).

---

## گیت — هر فاز

```bash
# داخل فاز (پس از اعمال تغییرات):
npm run type-check && npm run lint && npm run test && npm run build
git add <فایلها>
git commit -m "<پیام فارسی فاز>"
git push origin arena/019ff76f-saite
```

> **یادآوری شاخه:** با وجود ذکر `arena/019fe061-saite` در سند و دستور اولیه، این نشست به `arena/019ff76f-saite` قفل است؛ push فقط به همین شاخه انجام میشود.
