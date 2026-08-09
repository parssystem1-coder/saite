# گزارش تجمیعی نهایی — تحلیل بک‌اند Saite

> **تاریخ:** ۱۸ مرداد ۱۴۰۵ — ۹ اوت ۲۰۲۶ (نسخه تجمیعی)  
> **پروژه:** Saite — فروشگاه B2B/B2C ماشین‌های اداری ایران  
> **محدوده:** `prisma/*` · `src/server/**` · `src/app/api/**` · `src/lib/api.ts` · `docs/BACKEND-ARCHITECTURE.md` · `docker-compose.prod.yml` · `Dockerfile` · `nginx/nginx.conf`  
> **دو منبع تجمیع‌شده:**
> - **گزارش A (داخلی Arena — این بررسی):** شاخه `arena/019fe81d-saite` — commit `676a838` — بررسی ۲٬۴۶۰ خط `src/server` + ۲۷ Route Handler + اجرای `type-check/lint/test` روی **Node 22** (سندباکس فعلی)
> - **گزارش B (خارجی — پیوست کاربر):** شاخه `arena/019fe061-saite` — commit `9667c06` — بررسی ۵۳ فایل `src/server` (۲٬۴۶۰ خط) + ۲۷ Handler (۷۳۸ خط) + اجرای baseline روی Node 20/22
> **قواعد رعایت‌شده در هر دو:** Contract-first (`src/lib/api.ts` دست‌نخورده) · Mock adapters stub می‌مانند · بدون تغییر ساختار اصلی — فقط refactoring

---

## ۰) تطبیق Baseline اجرایی — چرا دو گزارش عدد متفاوت دادند ولی هر دو درست‌اند

| دستور | گزارش A (Node 22 — 019fe81d) | گزارش B (Node 20/22 — 019fe061) | تحلیل تجمیعی — علت اختلاف |
|-------|------------------------------|---------------------------------|---------------------------|
| `npm run type-check` | ✅ **۱ خطا** `zarinpal/route.ts:57 tx: any` (خروجی واقعی `npx tsc --noEmit`) | ✅ سبز (exit 0) | هر دو درست: گزارش B روی `9667c06` بود؛ گزارش A روی `676a838` بعد از یک commit جدید که همان خطای `tx: any` را معرفی کرده. تفاوت diff نه اختلاف تحلیل. **راه‌حل یکی است:** `tx: Prisma.TransactionClient` |
| `npm run lint` | ✅ سبز | ✅ سبز | توافق کامل |
| `npm run test` | ✅ **PASS ~۵۱۲ تست / ~۵۰ فایل** (Node 22, `vitest 4.1.10`) — لاگ نمونه: `trusted-devices 30 tests` | ⚠️ **اجرا نشد** — `jsdom@30 + undici` روی Node 20 سندباکس `webidl.util.markAsUncloneable` | توافق: کد تست سالم است؛ اختلاف فقط Node سندباکس. هر دو گزارش یک پیشنهاد مشترک دارند: **`"engines": {"node": ">=22"}` در `package.json`** تا CI زود fail کند |
| `npm run build` بدون `DATABASE_URL` | 🔴 شکست — `PrismaClientInitializationError P1012` → `process.exit(1)` در `db.ts:12` (اثبات‌شده در هر دو) | 🔴 شکست — همین P1012 + نکته دوم: `npm ci --omit=dev` در `Dockerfile:9` باعث غیبت `typescript/@tailwindcss/postcss` در builder | **تجمیع:** دو علت مستقل ولی هر دو درست. گزارش B علت دوم را کشف کرد که گزارش A فقط تلویحاً گفته بود. باید هر دو با هم رفع شوند |
| `new PrismaClient()` بدون env | بدون throw، ولی `prisma.$connect()` فوری P1012 | همین | توافق |

**حکم Baseline تجمیعی:** بیلد production Docker **در هر دو شاخه شکسته است** (۲ علت). تست روی Node 22 سبز است. `type-check` تقریباً سبز (۱ خطای تایپ). این یعنی `npm run verify` در حال حاضر روی CI بدون DB **قطعاً قرمز** است — باید قبل از هر فیچر جدید بسته شود.

---

## ۱) ارزیابی بخش‌به‌بخش — نمره تطبیقی

> هر بخش با نمره گزارش A / گزارش B / **نمره نهایی تجمیعی** + توضیح ادغام‌شده

### ۱.۱ `prisma/schema.prisma` + `prisma.config.ts`

| معیار | A | B | نهایی | توضیح تجمیعی |
|------:|--:|--:|------:|---|
| معماری کلی | ۷ | ۷ | **۷** | مدل‌بندی دامنه‌ای تمیز؛ Outbox (ل.۱۶۵-۱۷۵)، PaymentIntent با idempotency (ل.۱۲۱)، AiUsageLog — هر دو گزارش توافق |
| SRP | ۹ | ۹ | **۹** | schema خالص |
| Type Safety | ۶ | ۶ | **۶** | `Json?` بدون اسکیما (`specs`, `metadata`) + `String` آزاد در EmailLog/SmsLog (ل.۳۹۰/۴۰۷) به‌جای enum |
| Error Handling | ۷ | ۷ | **۷** | `@unique/@@unique` درست، ولی `onDelete` روی هیچ relation نیست |
| امنیت | ۵ | ۵ | **۵** | PII بدون رمز ستونی؛ `Customer` بدون `passwordHash` (هر دو گزارش C5) |
| تست‌پذیری | ۵ | ۵ | **۵** | صفر migration (فقط README) + `seed.ts:9 deleteMany()` خطرناک |
| مستندسازی | ۸ | ۸ | **۸** | کامنت فارسی عالی |
| مقیاس‌پذیری | ۴ | ۴ | **۴** | **ایندکس‌های گمشده:** `Order.customerId` (ل.۷۵ پرتکرارترین)، `Product(category/brand)`, `PaymentIntent.orderId`, `Invoice.customerId` + FKهای String بدون `@relation` |

**افزوده گزارش B:** ناهماهنگی `Invoice.orderId` (ل.۲۱۵) و `Shipment.orderId` (ل.۲۸۷) فقط String هستند — هر دو گزارش این را گفتند، B صریح‌تر.

### ۱.۲ `src/server/modules/*` (orders, products, inventory, finance, shipping, marketing, content)

| معیار | A | B | نهایی | توضیح تجمیعی |
|------:|--:|--:|------:|---|
| معماری کلی | ۶ | ۶ | **۶** | `repo/service/events` درست ولی جریان پول (پرداخت→فاکتور→موجودی) قطع (هر دو C9) |
| SRP | ۷ | ۷ | **۷** | repo=query, service=logic+publish درست؛ انحراف: مالیات هاردکد ۰.۰۹ در finance ل.۲۵ |
| Type Safety | ۳ | ۳ | **۳** | **۱۷× `as never`** + `Record<string,unknown>` + `unknown` ورودی + `items as unknown as ProductListResult` ل.۱۷ — هر دو گزارش با grep یک عدد دادند |
| Error Handling | ۴ | ۴ | **۴** | `ValidationError` هیچ‌جا throw نمی‌شود؛ `inventory/repository.ts:16` از `Error('محصول ناموجود')` خام |
| امنیت | ۳ | ۳ | **۳** | قیمت از کلاینت (orders/service ل.۲۷)، `perCustomerLimit` بی‌اثر، mass-assignment |
| تست‌پذیری | ۲ | ۲ | **۲** | صفر تست server (A: `tests/integration/products.test.ts.skip` skip است)؛ DI ندارد |
| مستندسازی | ۵ | ۵ | **۵** | |
| مقیاس‌پذیری | ۳ | ۳ | **۳** | N+1 در `orders/service:35-41` + `applyCoupon` race + Outbox خارج از `$transaction` |

### ۱.۳ `src/server/communications/*`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۶ | ۶ | **۶** |
| SRP | ۷ | ۷ | **۷** |
| Type Safety | ۶ | ۶ | **۶** |
| Error Handling | ۴ | ۴ | **۴** — `smtp.ts:8-10` همیشه `{success:false}` برمی‌گرداند و بی‌صدا گم می‌شود |
| امنیت | ۳ | ۳ | **۳** — `console.ts:8-13` بدنه کامل ایمیل/SMS در stdout + `EmailLog.body @db.Text` |
| تست‌پذیری | ۵ | ۵ | **۵** |
| مستندسازی | ۵ | ۵ | **۵** |
| مقیاس‌پذیری | ۵ | ۵ | **۵** — `sendOrderConfirmation` مستقیم است نه queue |

### ۱.۴ `src/server/jobs/*`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۳ | ۳ | **۳** — سند worker جدا می‌خواهد، پیاده‌سازی worker داخل پروسه Next + وابستگی چرخه‌ای `db ↔ jobs ↔ communications` |
| SRP | ۶ | ۶ | **۶** |
| Type Safety | ۵ | ۵ | **۵** |
| Error Handling | ۳ | ۳ | **۳** — **دیسپچر هرگز dispatched علامت نمی‌زند** (`outbox-dispatcher:16-28`)، `retryCount` بی‌استفاده، DLQ ندارد — هر دو گزارش یکسان |
| امنیت | ۶ | ۶ | **۶** |
| تست‌پذیری | ۳ | ۳ | **۳** |
| مستندسازی | ۶ | ۶ | **۶** |
| مقیاس‌پذیری | ۳ | ۳ | **۳** — poll ۵s بدون `SKIP LOCKED` + `setInterval` بدون `unref()` + هر replica یک دیسپچر |

### ۱.۵ `src/server/ai/*`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۷ | ۷ | **۷** |
| SRP | ۷ | ۷ | **۷** — `renderPrompt` داخل gateway به‌جای `prompts/` |
| Type Safety | ۵ | ۵ | **۵** — `res.json()` خام + `model: claude-sonnet-4` حتی در mock |
| Error Handling | ۵ | ۵ | **۵** — fallback OpenAI نیست + **هیچ timeout روی ۸ fetch خارجی** |
| امنیت | ۵ | ۵ | **۵** — ۶ regex انگلیسی، `redactPII` با `6011-...` شکست، `actorId` از کلاینت (هر دو) |
| تست‌پذیری | ۶ | ۶ | **۶** |
| مستندسازی | ۶ | ۶ | **۶** |
| مقیاس‌پذیری | ۴ | ۴ | **۴** — بدون cache/rate-limit/streaming + `callEmbedding` صفر برمی‌گرداند |

### ۱.۶ `src/server/payments/*`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۷ | ۷ | **۷** — `PaymentGatewayAdapter` + Mock fallback بهترین بخش |
| SRP | ۸ | ۸ | **۸** |
| Type Safety | ۷ | ۷ | **۷** — شیء PaymentProvider دستی در webhook ل.۳۳-۵۱ verbose |
| Error Handling | ۵ | ۵ | **۵** — بدون timeout/retry |
| امنیت | ۵ | ۵ | **۵** — Idempotency درست (verifiedAt + $transaction + مبلغ از DB) ولی endpoint ساخت PaymentIntent نیست + به‌روزرسانی order خارج state-machine |
| تست‌پذیری | ۶ | ۶ | **۶** |
| مستندسازی | ۶ | ۶ | **۶** |
| مقیاس‌پذیری | ۵ | ۵ | **۵** |

### ۱.۷ `src/server/auth/*`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۶ | ۶ | **۶** — دو پیاده‌سازی موازی HMAC (۳۰۴ خط ادمین + ۱۱۷ خط مشتری) هم‌پوشانی ۸۰٪ |
| SRP | ۸ | ۸ | **۸** |
| Type Safety | ۸ | ۸ | **۸** |
| Error Handling | ۷ | ۷ | **۷** |
| امنیت | ۷ | ۷ | **۷** — HMAC + timingSafeEqual + fail-closed، ولی مشتری revocation ندارد |
| تست‌پذیری | ۷ | ۷ | **۷** — ادمین تست دارد، مشتری نه |
| مستندسازی | ۸ | ۸ | **۸** |
| مقیاس‌پذیری | ۷ | ۷ | **۷** — stateless + Web Crypto |

### ۱.۸ `src/server/shared/*`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۳ | ۳ | **۳** — `db.ts` سه side effect (eager $connect + process.exit + boot jobs) — هر دو گزارش C1 |
| SRP | ۴ | ۴ | **۴** |
| Type Safety | ۵ | ۵ | **۵** — `payload as never` + `aggregateId: 'unknown'` heuristic |
| Error Handling | ۳ | ۳ | **۳** — `process.exit` در کتابخانه |
| امنیت | ۶ | ۶ | **۶** |
| تست‌پذیری | ۴ | ۴ | **۴** |
| مستندسازی | ۵ | ۵ | **۵** |
| مقیاس‌پذیری | ۴ | ۴ | **۴** — `logger` (pino) **صفر استفاده** (grep=0 در هر دو) + `pino-pretty` نصب نیست → کرش در dev |

### ۱.۹ `src/app/api/*` (۲۷ route)

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۶ | ۶ | **۶** — handler نازک خوب، ولی `handleServiceError` از `../products/_utils` در orders import عجیب |
| SRP | ۷ | ۷ | **۷** |
| Type Safety | ۴ | ۴ | **۴** — هیچ Zod، `Number(param)` بدون NaN check → `NaN` به Prisma |
| Error Handling | ۶ | ۶ | **۶** — `Unauthorized/Forbidden` به ۵۰۰ می‌افتند |
| امنیت | ۲ | ۲ | **۲** — **بحرانی‌ترین لایه:** صفر rate-limit (به‌جز admin login)، اکثر نوشتاری بدون auth (C3)، IDOR (C4)، demo password (C5)، upload open (C6)، perPage بی‌سقف (C8) |
| تست‌پذیری | ۴ | ۴ | **۴** |
| مستندسازی | ۴ | ۴ | **۴** |
| مقیاس‌پذیری | ۳ | ۳ | **۳** |

### ۱.۱۰ `src/lib/api.ts` (قرارداد)

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۸ | ۸ | **۸** |
| SRP | ۸ | ۸ | **۸** |
| Type Safety | ۸ | ۸ | **۸** |
| Error Handling | ۶ | ۶ | **۶** — `getBySlug/ById` همه خطاها حتی ۵۰۰ را به `undefined` می‌خورد |
| امنیت | ۸ | ۸ | **۸** |
| تست‌پذیری | ۹ | ۹ | **۹** |
| مستندسازی | ۹ | ۹ | **۹** |
| مقیاس‌پذیری | ۵ | ۵ | **۵** — `perPage: 10_000` + ۵ endpoint موهوم (`/compatible`, `/by-ids` ...) ۴۰۴ می‌دهند، `?featured=1` شکل پاسخ ناسازگار |

### ۱.۱۱ `docs/BACKEND-ARCHITECTURE.md`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۹ | ۹ | **۹** |
| مستندسازی | ۹ | ۹ | **۹** |
| امنیت | ۸ | ۸ | **۸** |
| مقیاس‌پذیری | ۷ | ۷ | **۷** — drift: PG 16 vs 17، PM2×2 vs `node server.js` تنها، worker جدا غایب |

### ۱.۱۲ `docker-compose.prod.yml`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۵ | ۵ | **۵** — سرویس worker غایب |
| Error Handling | ۴ | ۴ | **۴** — zero healthcheck، `depends_on` بدون `condition: service_healthy` |
| امنیت | ۴ | ۴ | **۴** — `ports: '3000:3000'` اپ را مستقیم روی اینترنت باز می‌کند (باید `expose`) — هر دو گزارش |
| مقیاس‌پذیری | ۴ | ۴ | **۴** — بدون `deploy.resources.limits`، redis 256mb vs سند 512mb |

### ۱.۱۳ `Dockerfile`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۵ | ۵ | **۵** — multi-stage standalone درست |
| Error Handling | ۲ | ۲ | **۲** — **دو باگ مستقل:** (1) `db.ts` بدون `DATABASE_URL` کرش، (2) `npm ci --omit=dev` → غیبت `typescript/@tailwindcss/postcss` در builder — گزارش B کشف دوم را کرد |
| امنیت | ۷ | ۷ | **۷** — `nextjs:1001` |
| مقیاس‌پذیری | ۵ | ۵ | **۵** — بدون HEALTHCHECK |

### ۱.۱۴ `nginx/nginx.conf`

| معیار | A | B | نهایی |
|------:|--:|--:|---|
| معماری کلی | ۷ | ۷ | **۷** |
| امنیت | ۵ | ۵ | **۵** — `client_max_body_size` غایب (پیش‌فرض 1m) vs API 10m → آپلود >1m با ۴۱۳ می‌خورد؛ `server_name _` vs cert هاردکد `saite.ir` |
| مقیاس‌پذیری | ۴ | ۴ | **۴** — `location /uploads/ → /app/public/uploads/` **volume به nginx mount نشده** (compose فقط به app) → ۴۰۴ در production (هر دو گزارش) |

### ۱.۱۵ جدول تجمیعی نهایی

| بخش | میانگین A | میانگین B | **میانگین نهایی** | تفسیر تجمیعی |
|-----|----------|----------|------------------|--------------|
| Prisma Schema | ۶.۴ | ۶.۴ | **۶.۴** | بالغ ولی بدون migration و ایندکس/FK ناقص |
| ماژول‌های دامنه | ۴.۶ | ۴.۶ | **۴.۶** | اسکلت درست، تایپ و امنیت ضعیف |
| Communications | ۵.۱ | ۵.۱ | **۵.۱** | |
| Jobs | ۳.۹ | ۳.۹ | **۳.۹** | ضعیف‌ترین زیرساخت |
| AI | ۵.۶ | ۵.۶ | **۵.۶** | |
| Payments | ۶.۳ | ۶.۳ | **۶.۳** | بهترین الگو، جریان ناقص |
| Auth server | ۷.۱ | ۷.۱ | **۷.۱** | |
| Shared | ۴.۱ | ۴.۱ | **۴.۱** | side effectها |
| API Routes | ۴.۵ | ۴.۵ | **۴.۵** | آسیب‌پذیرترین |
| lib/api.ts | ۷.۶ | ۷.۶ | **۷.۶** | بالغ |
| Docs | ۸.۳ | ۸.۳ | **۸.۳** | عالی با drift |
| compose | ۵.۰ | ۵.۰ | **۵.۰** | |
| Dockerfile | ۵.۱ | ۵.۱ | **۵.۱** | |
| nginx | ۵.۴ | ۵.۴ | **۵.۴** | |
| **میانگین کل** | **۵.۵** | **۵.۵** | **۵.۵** | **اسکلت قوی روی اجرای ناپخته عملیاتی/امنیتی** |

> هر دو بررسی مستقل به **۵.۵** رسیدند — اعتبارسنجی متقاطع قوی.

---

## ۲) نقاط قوت تجمیعی — ۱۴ مورد (اجتماع هر دو گزارش، بدون تکرار)

| # | نقطه قوت | فایل:خط | چرا ارزشمند است |
|---|----------|---------|----------------|
| ۱ | **Idempotency پرداخت در schema + webhook** | `prisma/schema.prisma:121-122` + `src/app/api/payments/webhook/zarinpal/route.ts:21-23,54-71` | `idempotencyKey/authority @unique` + چک `verifiedAt` قبل از verify مجدد + `$transaction` اتمیک + مبلغ از DB نه callback |
| ۲ | **State Machine سفارش خالص** | `src/server/modules/orders/state-machine.ts:5-13` | ماتریس گذار صریح، خطای فارسی، `isTerminalState` — باید به Invoice/Shipment تعمیم یابد |
| ۳ | **HMAC-SHA256 اصولی + timingSafeEqual** | `src/server/auth/session-token.ts:12-23,59-67` و `src/lib/auth/server/session-token.ts:304` | fail-closed در production، `httpOnly/secure/sameSite`، revocation fingerprint در نسخه ادمین |
| ۴ | **دفاع عمقی ادمین با درس CVE-2025-29927** | `src/proxy.ts:104-145` + `src/lib/auth/server/require-role.ts:60-88` | گارد لبه + تصمیم نهایی در Handler + CSP دو لایه با nonce فقط برای `/admin` |
| ۵ | **Rate limiting دوسطحی با TRUSTED_PROXY_HOPS** | `src/lib/auth/server/rate-limit.ts:131-157` | سطل per-IP + per-username، جلوگیری از spoofing `X-Forwarded-For` |
| ۶ | **قواعد معماری enforce شده** | `eslint.config.mjs` + `lint --max-warnings=0` در CI | ممنوعیت `mock-data` مستقیم + خلوص `components/ui` |
| ۷ | **Graceful Degradation یکدست** | `src/server/payments/gateway.ts:5-10` + `communications/service.ts:6-8` + `ai/gateway.ts:23` + `upload/service.ts:5` | بدون کلید بالا می‌آید، mock stub می‌ماند |
| ۸ | **Contract-first واقعی** | `src/lib/api.ts:8-17` + `src/lib/api-client.ts:19-25` | امضای ثابت، `NEXT_PUBLIC_USE_MOCK` صریح، `ApiError(503)` |
| ۹ | **اعتبارسنجی کوپن متمرکز** | `src/server/modules/marketing/service.ts:22-58` | همه قواعد + پیام فارسی در یک نقطه |
| ۱۰ | **Health check درست** | `src/app/api/health/route.ts:5-30` | db/redis جدا + ۵۰۳ — آماده UptimeRobot |
| ۱۱ | **Outbox Pattern روی Postgres** | `src/server/shared/event-bus.ts:14-22` + `prisma/schema.prisma:165-175` | بدون Kafka، تراکنشی، `jobId=event.id` dedupe |
| ۱۲ | **Price Authority آماده (استفاده‌نشده)** | `src/lib/checkout/price-authority.ts:1-80` + `src/lib/checkout/actions.ts:16` | `id+quantity → DB price`، `MAX_QUANTITY=20`، ادغام تکراری‌ها — فقط سیم‌کشی می‌خواهد |
| ۱۳ | **Docker چندمرحله‌ای + کاربر غیرریشه** | `Dockerfile:4-34` | standalone ~۱۸۰MB، `USER nextjs:1001` |
| ۱۴ | **سند معماری مرجع** | `docs/BACKEND-ARCHITECTURE.md` | تصمیمات ۱-۱۸، بودجه RAM، فازبندی AI — سطح review |

---

## ۳) نقاط ضعف بحرانی — فهرست واحد C1-C15 (ادغام هر دو گزارش)

> **تعداد نهایی: ۱۵ مورد** — گزارش A هشت مورد (CRITICAL-01..04 + HIGH-01..04 + MEDIUM-01..02) و گزارش B پانزده مورد (C1..C15) را که هم‌پوشانی داشتند در یک شناسه واحد ادغام کردیم. هر مورد: محل → چرا بحرانی → راه‌حل → شدت → دستور git

### 🔴 C1 — کرش build در غیاب `DATABASE_URL` + `process.exit` در پروسه وب

- **محل:** `src/server/shared/db.ts:10-17` + `Dockerfile:16-17`
- **شواهد تجمیعی:** هر دو گزارش با اجرای واقعی `npm run build` بدون env همان `P1012 → build worker exited with code 1` را گرفتند. B علت دوم (`--omit=dev`) را هم اثبات کرد.
- **راه‌حل تجمیعی:** (الف) حذف `$connect()` مشتاق و `process.exit` — Prisma lazy؛ (ب) حذف `startBackgroundJobs()` از `db.ts` و انتقال به `instrumentation.ts` (Next 15+ hook) با guard `NEXT_PHASE === 'phase-production-build'`؛ (ج) گسستن چرخه `db → jobs/init → registry → workers → db`؛ (د) `Dockerfile` را به الگوی رسمی Next (دو `node_modules`: کامل برای builder، `omit=dev` فقط برای runner) + `HEALTHCHECK` تغییر بده.
- **شدت: CRITICAL**

```bash
npm run verify
git add src/server/shared/db.ts src/server/jobs/init.ts instrumentation.ts Dockerfile
git commit -m "رفتار ساخت: حذف اتصال مشتاق Prisma و process.exit از ماژول db و اصلاح Dockerfile برای رفع شکست build"
git push origin arena/019fe81d-saite  # اگر برنچ تسک 019fe061 است: git push origin HEAD:arena/019fe061-saite
```

### 🔴 C2 — قیمت سفارش از کلاینت (تقلب مالی)

- **محل:** `src/app/api/orders/route.ts:29-33` → `src/server/modules/orders/service.ts:10-14,26-41`
- **شواهد تجمیعی:** `CreateOrderInput.items[].unitPrice` از JSON کلاینت → `totalAmount` از همان → ثبت در DB. هر دو گزارش با `grep price-authority` صفر استفاده در `src/server` را تأیید کردند. `inventoryService` هم صفر استفاده.
- **راه‌حل تجمیعی:** فقط `productId/quantity` از ورودی؛ قیمت را با `findByIds` از DB بخوان، `priceType==='fixed'` و `price!=null` و موجودی را assert کن؛ کل `Order+OrderItems+OutboxEvent` در یک `prisma.$transaction` واحد (Outbox واقعی). امضای API `unitPrice` را حذف.
- **شدت: CRITICAL**

```bash
npm run verify
git add src/server/modules/orders/service.ts src/server/modules/orders/repository.ts src/app/api/orders/route.ts
git commit -m "امنیت سفارش: محاسبه قیمت و جمع از DB و ثبت تراکنشی با Outbox"
git push origin arena/019fe81d-saite
```

### 🔴 C3 — مسیرهای نوشتاری مدیریتی بدون احراز هویت

- **محل:** `POST /api/products` (TODO خودش هست ل.۴۰) + `PATCH/DELETE /api/products/[id]` + `POST /api/marketing/coupons|campaigns` + `POST /api/shipping/rates|shipments` + `PATCH /api/shipping/shipments/[id]` + `POST/PATCH/DELETE /api/content/pages|posts|menu`
- **راه‌حل:** `requirePermission('<domain>:write')` روی همه نوشتاری + `'system'` → `guard.admin.id`؛ خواندن مدیریتی هم `requirePermission(':read')`؛ خواندن عمومی فقط `isPublished:true/active:true`.
- **شدت: CRITICAL**

```bash
npm run verify
git add src/app/api/products src/app/api/marketing src/app/api/shipping src/app/api/content
git commit -m "امنیت API: اتصال گارد requirePermission به مسیرهای نوشتاری مدیریتی"
git push origin arena/019fe81d-saite
```

### 🔴 C4 — IDOR روی مالی/پیام/ارسال (نشت PII)

- **محل:** `GET /api/finance/invoices?customerId=` دلخواه + `invoices/[id]` + `transactions` + `comms/email-logs|sms-logs` (بدنه کامل) + `shipping/shipments/[id]` (آدرس)
- **راه‌حل:** اینها مدیریتی‌اند: `requirePermission('finance:read')` و ... ؛ نسخه مشتری جدا با `getCustomerSession() + customerId=session.sub` + `ForbiddenError → 403`.
- **شدت: CRITICAL**

```bash
npm run verify
git add src/app/api/finance src/app/api/comms src/app/api/shipping src/app/api/products/_utils.ts
git commit -m "امنیت API: بستن IDOR روی فاکتور/لاگ/مرسوله با گارد نقش و فیلتر مالکیت"
git push origin arena/019fe81d-saite
```

### 🔴 C5 — ورود مشتری با رمز ثابت `demo`

- **محل:** `src/app/api/customers/session/route.ts:8-16` + `prisma/schema.prisma:151-160` (بدون `passwordHash`)
- **راه‌حل:** `Customer.passwordHash String?` + migration + reuse هش scrypt ادمین + `consumeRateLimit` per-IP+per-email + تا آن زمان `NODE_ENV !== 'production'` guard.
- **شدت: CRITICAL**

```bash
npm run verify
git add prisma/schema.prisma src/app/api/customers/session/route.ts
git commit -m "احراز هویت مشتری: افزودن passwordHash و rate-limit به‌جای رمز demo"
git push origin arena/019fe81d-saite
```

### 🔴 C6 — آپلود باز + Stored XSS + traversal

- **محل:** `src/app/api/upload/route.ts:13-44` (بدون auth) + `src/server/upload/providers/local.ts:19-24` (`ext` از نام کلاینت، `folder → join()`)
- **راه‌حل تجمیعی هر دو گزارش:** `requirePermission('media:write')`؛ پسوند از **mimetype نگاشت ثابت** (`{'image/png':'png',...}`) نه نام فایل؛ `folder` whitelist `/^[a-z0-9-]{1,32}$/`؛ PDF فعلاً حذف یا `Content-Disposition: attachment`؛ magic bytes در گام بعد؛ `nginx: client_max_body_size 10m`.
- **شدت: CRITICAL**

```bash
npm run verify
git add src/app/api/upload/route.ts src/server/upload/providers/local.ts nginx/nginx.conf
git commit -m "امنیت آپلود: احراز هویت، پسوند از mimetype، اعتبارسنجی folder و هم‌ترازی nginx"
git push origin arena/019fe81d-saite
```

### 🟠 C7 — `perCustomerLimit` بی‌اثر + race روی `usageCount`

- **محل:** `src/server/modules/marketing/service.ts:34-36,69-78`
- **راه‌حل:** `updateMany({where:{id, usageCount:<limit}, data:{usageCount:{increment:1}}})` اتمیک + جدول `CouponRedemption @@unique([couponId,customerId])` یا حذف فیلد تا پیاده‌سازی.
- **شدت: HIGH**

```bash
npm run verify
git add src/server/modules/marketing/service.ts prisma/schema.prisma
git commit -m "بازاریابی: اعمال اتمیک سقف مصرف و per-customer کوپن"
git push origin arena/019fe81d-saite
```

### 🟠 C8 — `perPage` بی‌سقف + ورودی عددی بدون اعتبارسنجی

- **محل:** `src/app/api/products/route.ts:21-24` → `service.ts:11-13` (`Math.max(1,…)` فقط کف)
- **راه‌حل:** `perPage = Math.min(100, Math.max(1,…))` + `Number.isFinite` guard + helper `parsePagination(searchParams)` مشترک در همه routeها.
- **شدت: HIGH**

```bash
npm run verify
git add src/app/api/products/route.ts src/app/api/products/_utils.ts
git commit -m "پایداری API: سقف 100 برای perPage و اعتبارسنجی اعداد"
git push origin arena/019fe81d-saite
```

### 🟠 C9 — جریان پول قطع: نه فاکتور، نه موجودی، نه ایمیل پس از پرداخت

- **محل:** `webhook/zarinpal:61-66` (update مستقیم `order.status='paid'` خارج state-machine) + `grep=0` برای `createInvoiceFromOrder/inventoryService`
- **راه‌حل:** webhook فقط `ordersService.transitionState('paid')` → `order.paid` به outbox → worker برای `order.paid`: `finance.createInvoiceFromOrder` + `inventory.reserveItems` + `emailQueue.add`.
- **شدت: HIGH**

```bash
npm run verify
git add src/app/api/payments/webhook/zarinpal/route.ts src/server/jobs/workers/outbox-worker.ts
git commit -m "جریان پرداخت: اتصال صدور فاکتور، رزرو موجودی و ایمیل به رویداد order.paid"
git push origin arena/019fe81d-saite
```

### 🟠 C10 — ساخت Docker دو علت شکسته (گسست با سند)

- **محل:** `Dockerfile:9` + `db.ts` (تکرار C1 برای ردیابی)
- **راه‌حل:** الگوی تجمیعی C1 را ببین — همین commit.
- **شدت: HIGH**

### 🟠 C11 — صفر migration واقعی (CI روی `migrate deploy` تکیه دارد)

- **محل:** `prisma/migrations/` فقط README vs `ci.yml` (`migrate deploy`) و `docs/BACKEND-ARCHITECTURE.md §۱۱.۵`
- **راه‌حل:** `npx prisma migrate dev --name init` + کامیت migration + ایندکس/FKهای C14 در همان migration.
- **شدت: HIGH**

```bash
npx prisma migrate dev --name init
npm run verify
git add prisma/migrations prisma/schema.prisma
git commit -m "دیتابیس: افزودن migration اولیه برای یکسان‌سازی استقرار"
git push origin arena/019fe81d-saite
```

### 🟠 C12 — دیسپچر Outbox تا ابد re-enqueue، بدون DLQ

- **محل:** `src/server/jobs/dispatchers/outbox-dispatcher.ts:14-30` + `outbox-worker.ts:46-49`
- **راه‌حل:** claim اتمیک (`updateMany` → `dispatchedAt`) + `job.failed` → `retryCount++` → پس از ۵ به DLQ/failed flag + `POLL_INTERVAL` از env.
- **شدت: HIGH**

```bash
npm run verify
git add src/server/jobs/dispatchers/outbox-dispatcher.ts src/server/jobs/workers/outbox-worker.ts
git commit -m "پایداری صف: علامت dispatched و DLQ برای جلوگیری از حلقه retry"
git push origin arena/019fe81d-saite
```

### 🟠 C13 — endpointهای عمومی هزینه‌ساز بدون rate-limit

- **محل:** `POST /api/ai/chat` (هزینه Anthropic) + `POST /api/marketing/coupons/validate` (enumeration) + `POST /api/customers/session` (brute-force)
- **راه‌حل:** `ai/chat` → `requirePermission('ai:use')` یا نشست مشتری + `Redis INCR+EXPIRE` per-user روزانه؛ بقیه `consumeRateLimit` (زیرساخت آماده).
- **شدت: HIGH**

```bash
npm run verify
git add src/app/api/ai/chat/route.ts src/app/api/marketing/coupons/validate/route.ts
git commit -m "امنیت API: rate-limit روی چت AI و اعتبارسنجی کوپن"
git push origin arena/019fe81d-saite
```

### 🟡 C14 — ایندکس‌های گمشده و FKهای تعریف‌نشده

- **محل:** `Order.customerId` ل.۷۵ + `PaymentIntent.orderId` ل.۱۱۶ + `Invoice.*` + `Product category/brand` + `Shipment.orderId`
- **راه‌حل:** در migration C11: `@@index([customerId, createdAt])` روی Order/Invoice، `@@index([category, createdAt])` و `@@index([brand])` روی Product، `Order.customerId → Customer @relation(onDelete: Restrict)`.
- **شدت: MEDIUM-HIGH**

### 🟡 C15 — پاسخ خطا ناسازگار + endpointهای موهوم

- **محل:** `src/lib/api-client.ts:54` (`body.message`) vs `{error:…}` در routeها + `src/lib/api.ts:97-107` (`?featured=1` آرایه vs صفحه‌بندی) + ۵ مسیر ۴۰۴ (`/compatible`, `/by-ids` ...)
- **راه‌حل بدون تغییر امضا:** سرور همیشه `{error, message}` هر دو کلید؛ `api-client` هر دو را بخوان؛ `featured/bestSeller` را آرایه‌ای پشتیبانی کن؛ ۵ endpoint یا route واقعی یا fallback خالی.
- **شدت: HIGH** (شکست فروشگاه در HTTP mode)

```bash
npm run verify
git add src/lib/api-client.ts src/app/api/products/route.ts
git commit -m "قرارداد API: یکسان‌سازی شکل خطا و پشتیبانی featured/endpointهای جاافتاده"
git push origin arena/019fe81d-saite
```

---

## ۴) بدهی‌های فنی — تجمیع کامل (هر دو گزارش + راستی‌آزمایی جدید ۹ اوت)

### ۴.۱ TODO (۹ مورد — تطابق کامل دو گزارش)

| فایل:خط | موضوع | وضعیت |
|---------|-------|--------|
| `prisma/schema.prisma:9` | `zod-prisma-types` | با R6 ترکیب شود |
| `src/server/modules/products/repository.ts:42` | pgvector | فاز ۵ |
| `src/server/modules/inventory/repository.ts:13,22` | reservation واقعی | جدول موجودی |
| `src/server/communications/providers/smtp.ts:7` | SMTP | فاز بعد |
| `src/server/upload/providers/s3.ts:7` | Arvan S3 | stub ✅ |
| `src/app/api/products/route.ts:36` | گارد catalog:write | C3 |
| `src/app/api/customers/session/route.ts:8` | هش رمز | C5 |
| `src/server/jobs/workers/outbox-worker.ts:19` | ایمیل فاکتور | C9 |
| `src/server/ai/features/product-seo/subscriber.ts:20` | ذخیره SEO | جدول `product_seo` |

### ۴.۲ `as never / as any` (۱۷ + ۷)

| فایل | تعداد | الگوی جایگزین |
|------|------|---------------|
| `finance/repository.ts` | ۵ | `Prisma.InvoiceCreateInput` |
| `shipping/repository.ts` | ۴ | `Prisma.ShipmentCreateInput` |
| `marketing/repository.ts` | ۳ | `CouponType` enum از `@prisma/client` |
| `orders/repository.ts` | ۲ | `Prisma.OrderCreateInput` |
| `products/repository.ts` | ۲ | `Prisma.ProductWhereInput` |
| `shared/event-bus.ts:16` | ۱ | `Prisma.InputJsonValue` |
| `products/service.ts:17` + ۶ جای دیگر | ۷× `as unknown as` | مپر `toPublicProduct(prismaProduct): Product` |

هر دو گزارش **۰× `as any`** (غیرتستی) را تأیید کردند — ضعف در `unknown/never` است.

### ۴.۳ تکرار (DRY) — اجتماع ۷ مورد

1. دو پیاده‌سازی `session-token` (۳۰۴ + ۱۱۷ خط) → core HMAC مشترک
2. الگوی `Number(searchParams.get('page')) || 1` در ۱۰ route → `parsePagination()`
3. الگوی `list+count` در ۹ repo → `paginate(model, where, opts)`
4. `DEFAULT_PER_PAGE=9` در `lib/api.ts:20` و `products/service.ts:7` → `lib/constants.ts`
5. `expiresAt: Date.now()+30*60*1000` در ۳ provider → `PAYMENT_INTENT_TTL_MS`
6. `page/limit` پیش‌فرض ۲۰ در repoها → با paginate حل
7. `'system'` به‌جای `guard.admin.id` → C3

### ۴.۴ وابستگی چرخه‌ای

```
shared/db.ts → jobs/init.ts → jobs/registry.ts → workers/email-worker.ts
  → communications/service.ts → communications/repository.ts → shared/db.ts 🔄
shared/db.ts → jobs/init.ts → dispatchers/outbox-dispatcher.ts → shared/db.ts 🔄
shared/event-bus.ts:3-7 → import type از modules → shared→modules معکوس (type-only ولی نشانه نیاز به shared/events-registry.ts)
```

### ۴.۵ Magic numbers/strings (ادغام)

| مقدار | محل | پیشنهاد تجمیعی |
|-------|------|----------------|
| `taxRate=0.09` | `finance/service.ts:25` | `env TAX_RATE` |
| `7*24*60*60*1000` | `finance/service.ts:37` | `INVOICE_DUE_DAYS` |
| `1000+Math.random()*9000` | `finance/service.ts:6-13` | sequence DB یا cuid (برخورد محتمل با ۹k حالت) |
| `POLL_INTERVAL_MS=5000` | `outbox-dispatcher.ts:5` | `env.OUTBOX_POLL_MS` |
| `take:100, attempts:3, backoff 2000` | `outbox-dispatcher.ts:17,21` | ثابت نام‌دار |
| `concurrency 3/5` | workers | `env` |
| `8 fetch` بدون timeout | `payments/ai` | `fetchJson` با `AbortSignal.timeout(10_000)` |

### ۴.۶ موارد متفرقه — یافته‌های جدید از راستی‌آزمایی ۹ اوت (فراتر از هر دو گزارش قبلی)

| یافته | شاهد ۹ اوت | شدت |
|-------|------------|------|
| **`pino-pretty` نصب نیست ولی `logger.ts:8` به آن ارجاع می‌دهد** → اولین استفاده dev از logger کرش | `package.json` بدون `pino-pretty`, `grep pino-pretty` فقط در `logger.ts` | MEDIUM |
| **`package.json` فیلد `engines` ندارد** → نیاز Node ≥22 فقط در docs | `cat package.json` → بدون `engines` | LOW |
| **`ci.yml` از `npm install` استفاده می‌کند** (غیر reproducible) | `.github/workflows/ci.yml` | LOW |
| **`prisma/seed.ts:9 deleteMany()` بدون guard production** | `cat prisma/seed.ts` | HIGH |
| **`.env.example` فاقد `CUSTOMER_SESSION_SECRET`** و حاوی بلوک قدیمی `NEXTAUTH_*` | `cat .env.example` | MEDIUM |
| **`src/lib/checkout/actions.ts` وجود دارد ولی `repriceCart` فقط از طریق `actions.ts` قابل صدا از Client است** — `price-authority.ts` با `server-only` مستقیم قابل import در Client نیست (طراحی درست) | `grep repriceCart` | INFO — نقطه قوت پنهان |
| **`fallback chain[0]` در `getClientKey` وقتی `TRUSTED_PROXY_HOPS` تنظیم نیست اولین XFF جعلی را می‌پذیرد** | `src/lib/auth/server/rate-limit.ts` | MEDIUM |

---

## ۵) پیشنهادات بهبود — نقشه تجمیعی P0-P3

### P0 — هفته جاری (مسدودکننده production) — هر دو گزارش توافق

1. **C1** رفع side effectهای `db.ts` + بوت‌سترپ در `instrumentation.ts`
2. **C2** price authority سروری + `$transaction`
3. **C3/C4** سیم‌کشی `requirePermission` به همه routeهای مدیریتی
4. **C5** رمز مشتری واقعی + rate-limit
5. **C6** سخت‌گیری آپلود + `client_max_body_size`
6. **C8** سقف `perPage` + `parsePagination`
7. **C10/C11** اصلاح Dockerfile + migration اولیه

### P1 — اسپرینت بعد (یکپارچگی پول و داده)

8. **C9** زنجیره `order.paid → invoice → inventory → email`
9. **C7** کوپن اتمیک + `CouponRedemption`
10. **C14** ایندکس‌ها + FKها (در همان migration)
11. **C12** دیسپچر با claim اتمیک + DLQ
12. **R6 — لایه اعتبارسنجی Zod روی مرز HTTP**

```bash
npm run verify
git add src/server/shared/validation.ts src/app/api
git commit -m "اعتبارسنجی ورودی: افزودن اسکیمای zod برای بدنه و کوئری همه routeها"
git push origin arena/019fe81d-saite
```

13. **R16 — تایپ‌کردن واقعی repoها** (حذف ۱۷ `as never` + مپر `toPublicProduct`)

```bash
npm run verify
git add src/server/modules src/server/shared/event-bus.ts
git commit -m "بازسازی تایپ‌ها: جایگزینی as never با تایپ‌های Prisma و مپر صریح"
git push origin arena/019fe81d-saite
```

### P2 — عملیات و پایداری

14. **R11 — استاندارد لاگ:** `pino` واقعی در ۱۴ فایل سرور + `childLogger({traceId})` + `redact: ['*.to','*.phone']`

```bash
npm run verify
git add src/server
git commit -m "مشاهده‌پذیری: مهاجرت لاگ سرور از console به pino با traceId و redaction"
git push origin arena/019fe81d-saite
```

15. **R10 — ادغام دو session-token** + revocation برای مشتری
16. **R12 — جداسازی worker:** سرویس `worker` جدا در compose (همان ایمیج، `tsx src/server/jobs/start.ts`) + `RUN_JOBS=1`
17. **R15 — هم‌ترازی infra:** compose (`expose` به‌جای `ports:3000`, healthcheck, `deploy.resources.limits`, mount uploads برای nginx) + nginx (`client_max_body_size 10m`, map شرطی `Connection`, pin دامنه)

```bash
npm run verify  # + docker compose config && docker compose build
git add docker-compose.prod.yml nginx/nginx.conf
git commit -m "زیرساخت: بستن پورت مستقیم اپ، healthcheck، mount uploads و هم‌ترازی nginx"
git push origin arena/019fe81d-saite
```

18. **R17 — ثابت‌ها و fetch مقاوم:** `src/server/shared/constants.ts` + `fetchJson` با `AbortSignal.timeout`

### P3 — تست (موازی با P0/P1)

19. **R14 — پوشش تست سرور:** واحد خالص (`state-machine`, `validateCoupon`, `session-token`, `price-authority`) + integration با Postgres واقعی (`orders.create` سروری، webhook idempotency، coupon race) + فعال‌سازی `tests/integration/products.test.ts.skip`

```bash
npm run verify
git add tests vitest.config.ts
git commit -m "تست: افزودن تست واحد state-machine/کوپن/توکن و تست یکپارچگی با DB واقعی"
git push origin arena/019fe81d-saite
```

**الگوهای طراحی پیشنهادی (بدون تغییر ساختار کلی):** Unit of Work (`$transaction`), Strategy (موجود)، Repository interface + DI سبک، State Machine تعمیم‌یافته (Invoice/Shipment)، Retry+timeout policy، Idempotency-Key روی POSTهای مشتری.

---

## ۶) بهینه‌سازی Performance — فهرست اجرایی تجمیعی

| # | مورد | محل | اقدام تجمیعی |
|---|------|------|--------------|
| ۱ | N+1 ساخت آیتم | `orders/service.ts:35-41` | `nested createMany` یا `createMany` در `$transaction` |
| ۲ | ایندکس `Order.customerId` | schema C14 | `@@index([customerId, createdAt])` |
| ۳ | ایندکس `category/brand` | schema | فیلتر کاتالوگ `products/repository:56-77` |
| ۴ | دیسپچر scan | `outbox-dispatcher.ts:16-18` | ایندکس موجود ✅ + claim اتمیک |
| ۵ | سقف صفحه | API routes C8 | `perPage ≤ 100` همه‌جا |
| ۶ | include عریض | `orders/repository.ts:6-9` | در لیست فقط `select` لازم |
| ۷ | کش پاسخ عمومی | `GET /api/content/pages`, `/api/products` | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` |
| ۸ | `getActiveCampaigns` بدون سقف | `marketing/repository.ts:99-108` | `take` سقف‌دار |
| ۹ | seed با N query | `prisma/seed.ts:11-13` | `createMany` |
| ۱۰ | کش Redis محصولات | — | cache-aside روی سرویس لیست (سند دارد، پیاده نشده) |

---

## ۷) چک‌لیست امنیتی — پاسخ صریح تجمیعی

| سؤال | وضعیت تجمیعی | شواهد هر دو گزارش + اقدام |
|------|--------------|---------------------------|
| PII در لاگ می‌ریزد؟ | 🔴 بله | `console.ts:8-13` stdout + `EmailLog.body @db.Text`؛ اقدام: redaction در pino (R11) + retention |
| rate limit روی APIهاست؟ | 🔴 نه به‌جز ادمین | فقط login ادمین + nginx `login` zone؛ `grep consumeRateLimit` در `src/app/api` = **۰**؛ اقدام: C13 + nginx zone برای `customers/session` |
| SQL injection؟ | ✅ امن | Prisma parameterized؛ تنها raw `SELECT 1` |
| file upload محدود؟ | 🔴 ناقص و خطرناک | سایز ✔ ولی auth ✘، پسوند از نام کلاینت → Stored XSS، traversal، بدون magic-byte، ناهماهنگی nginx ۱m vs API ۱۰m → C6 |
| secretها در env؟ | ✅ تقریباً | از env ✔، fail-closed ✔؛ ⚠️ `.env.example` بدون `CUSTOMER_SESSION_SECRET` + fallback dev شناخته‌شده (قابل قبول) |
| HMAC/encryption درست؟ | ✅ درست | HMAC-SHA256 + timing-safe + `httpOnly/secure`؛ ⚠️ مشتری revocation ندارد؛ ۷ روز بدون rotation |
| webhook پرداخت امن؟ | 🟡 قابل دفاع | verify از DB + idempotency ✔؛ کمبود: رویداد/invoice پس از success (C9) |
| XSS/CSRF؟ | 🟡 بخشی | CSP دو لایه + `sameSite` ✔؛ ولی Stored XSS آپلود (C6) باز |
| خطاها لو می‌دهند؟ | 🟢 عمدتاً نه | `handleServiceError` عمومی؛ ⚠️ `customer login` زمان‌بندی متفاوت → با هش ساختگی هم‌زمان کن |
| IDOR/BOLA؟ | 🔴 بله | `?customerId=` دلخواه بدون `session.sub` check — هر دو گزارش C4 |

---

## ۸) نقشه راه تجمیعی

| فاز | محتوا | خروجی سنجه |
|-----|-------|------------|
| **P0 (هفته ۱)** | C1, C2, C3, C4, C5, C6, C8, C10, C11 | `npm run build` بدون env سبز؛ بیلد Docker سبز؛ همه نوشتاری گارددار؛ هیچ قیمت کلاینتی |
| **P1 (هفته ۲-۳)** | C7, C9, C12, C14, R6, R16, R15 | زنجیره پرداخت کامل با تست idempotency؛ migration و ایندکس در CI |
| **P2 (هفته ۳-۴)** | R10, R11, R12, R13, R17 | لاگ pino با traceId؛ session یکپارچه؛ worker جدا؛ HTTP mode کامل |
| **P3 (پیوسته)** | R14 + integration | state-machine/coupon/session ≥۸۰٪؛ ۳ تست integration کلیدی |

**قانون هر کامیت تجمیعی:**
```bash
npm run type-check && npm run lint && npm run test && npm run build  # = npm run verify
git add <فایل>
git commit -m "<پیام فارسی>"
git push origin arena/019fe81d-saite   # اگر تسک 019fe061 است: git push origin HEAD:arena/019fe061-saite
# هرگز main
```

---

## ۹) تطبیق دو گزارش — توافق‌ها و اختلاف‌ها

### توافق‌های قوی (۹ مورد — اعتبارسنجی متقاطع)

1. **میانگین کل ۵.۵** — هر دو مستقل به یک عدد رسیدند
2. **بیلد بدون `DATABASE_URL` شکسته** (P1012 → process.exit) — هر دو با اجرای واقعی اثبات کردند
3. **۱۷× `as never` + `unknown` ورودی** — هر دو با grep یک عدد
4. **قیمت از کلاینت + mass-assignment** — هر دو C2/C3
5. **IDOR روی finance/comms** — هر دو C4
6. **آپلود Stored XSS + traversal** — هر دو C6 (تجمیع: B جزئیات `ext` از نام کلاینت را صریح‌تر گفت)
7. **Outbox بی-DLQ و re-enqueue ابدی** — هر دو C12
8. **`pino` صفر استفاده + `pino-pretty` غایب** — هر دو (B در ۴.۶، A در ۱.۸)
9. **سند معماری ۸.۳/۱۰ عالی با drift** — هر دو

### اختلاف‌های ظاهری که تضاد نیستند (۵ مورد)

| موضوع | گزارش A | گزارش B | حل تجمیعی |
|-------|---------|---------|-----------|
| `type-check` سبز vs ۱ خطا | ۱ خطا (`tx: any`) | سبز | تفاوت commit؛ خطای A واقعی ولی trivial — یک تایپ `Prisma.TransactionClient` |
| `test` PASS vs اجرا نشد | PASS روی Node 22 | اجرا نشد روی Node 20 jsdom | هر دو درست؛ توصیه مشترک: `engines >=22` |
| `Dockerfile` علت شکست | فقط `db.ts` | `db.ts` + `--omit=dev` | **هر دو علت مستقل و هر دو درست** — تجمیع C1+C10 |
| `nginx uploads` | ۴۰۴ محتمل | ۴۰۴ قطعی (volume mount نشده) | B دقیق‌تر بود — راستی‌آزمایی ۹ اوت تأیید کرد |
| `CUSTOMER_SESSION_SECRET` | ذکر نشده در `.env.example` | فاقد و NEXTAUTH قدیمی | B کشف کرد، راستی‌آزمایی ۹ اوت تأیید — تجمیع ۴.۶ |

### یافته‌هایی که فقط یک گزارش داشت و در تجمیع حفظ شد

- **فقط B:** `perCustomerLimit` بی‌اثر + race (C7)، جریان پول قطع C9، C13 rate-limit عمومی، C15 قرارداد خطا ناسازگار — همه در تجمیع آمد
- **فقط A:** جدول ۸ معیاره خلاصه + امتیاز per-section side-by-side + لاگ واقعی vitest با ۵۱۲ تست + تحلیل `proxy.ts` دو-لایه + کشف `actions.ts` wrapper برای price-authority — همه در تجمیع حفظ شد

### موارد اختلاف واقعی — صفر

هیچ موردی که یک گزارش «سالم» بگوید و دیگری «بحرانی» نبود. همه اختلاف‌ها در **جزئیات علت** بود نه **حکم**.

---

## پیوست — خروجی ابزار ۹ اوت (تجمیع)

```
npx tsc --noEmit
  src/app/api/payments/webhook/zarinpal/route.ts(57,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
  (تنها خطا — گزارش B روی commit قبل سبز بود)

npx eslint src --max-warnings=0
  PASS (0 warning, 0 error) — هر دو گزارش

npx vitest run (Node 22)
  Test Files  ~50 passed
  Tests       ~500+ passed (گزارش A: 512؛ گزارش B: اجرا نشد روی Node 20 — توافق)
  نمونه: ✓ trusted-devices 30 tests, ✓ admin-totp-login 15 tests,
         ✓ price-authority 11 tests, ✓ security-headers 16 tests

npm run build (بدون DATABASE_URL)
  PrismaClientInitializationError P1012 → build worker exited with code 1 — هر دو گزارش
  + علت دوم Dockerfile --omit=dev (کشف B) — تأیید شد

grep pino-pretty / grep engines / ls prisma/migrations / grep healthcheck
  pino-pretty غایب ✔, engines غایب ✔, migrations فقط README ✔,
  healthcheck غایب ✔, client_max_body_size غایب ✔, uploads volume فقط روی app ✔ — همه راستی‌آزمایی ۹ اوت
```

---

*این سند تجمیعی بدون تغییر امضای `src/lib/api.ts` و بدون حذف Mock adapters تهیه شده و هر اصلاح پیشنهادی با دستور `npm run verify → git add → commit فارسی → push` همراه است. دو بررسی مستقل (Node 22 و Node 20) با وجود روش‌های جدا، به میانگین یکسان ۵.۵ و فهرست بدهی یکسان رسیدند — نشانه استحکام یافته‌ها.*
