# نقشهٔ راه فازبندی‌شده — Saite Backend Hardening

> **تاریخ ایجاد:** ۲۰۲۶-۰۸-۰۹  
> **مبتنی بر:** `AUDIT-2026-08-09-FULL.md`  
> **sha:** `716e0608`  
> **شاخهٔ فعال:** `arena/019fe8c8-saite`

---

## نمای کلی فازها

| فاز | عنوان | مشکلات | تخمین | وضعیت |
|:---:|-------|--------|:------:|:------:|
| ۰ | تثبیت استقرار + جریان پول | C9, C11 | ۱-۲ روز | ⬜ |
| ۱ | قفل مالی | C2, C7 | ۲-۳ روز | ⬜ |
| ۲ | قفل امنیتی API | C3, C5, C6 | ۳-۴ روز | ⬜ |
| ۳ | یکپارچگی داده و صف | C12, C14 | ۲-۳ روز | ⬜ |
| ۴ | سخت‌سازی API | C8, C13, C15 | ۲ روز | ⬜ |
| ۵ | کیفیت کد | T1, T2, T3 | ۲-۳ روز | ⬜ |
| ۶ | زیرساخت | P1, P2 | ۲ روز | ⬜ |
| ۷ | تست Integration | Q1 | موازی | ⬜ |

---

## فاز ۰ — تثبیت استقرار + جریان پول

**هدف:** تضمین deploy صحیح + کامل کردن زنجیرهٔ مالی  
**تخمین:** ۱-۲ روز  
**مشکلات:** C9 (جریان پول قطع), C11 (صفر migration)

### چک‌لیست

- [ ] **C11-1:** `npx prisma migrate dev --name init` — تولید migration اولیه
- [ ] **C11-2:** بررسی migration تولیدشده (جدول‌ها، ایندکس‌ها، FKها)
- [ ] **C11-3:** اضافه کردن `prisma migrate deploy` به Dockerfile CMD یا entrypoint
- [ ] **C9-1:** اصلاح `outbox-worker.ts` — بعد از `createInvoiceFromOrder`، `markInvoicePaid` را هم صدا بزند (با idempotency)
- [ ] **C9-2:** ثبت `Transaction` با `type: 'payment'` + `status: 'completed'` + `referenceId`
- [ ] **C9-3:** تست دستی: webhook شبیه‌سازی → Invoice.paid + Transaction.created

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `prisma/migrations/<timestamp>_init/migration.sql` | جدید — خروجی prisma migrate |
| `src/server/jobs/workers/outbox-worker.ts:55-80` | اضافه کردن markInvoicePaid + createTransaction بعد از createInvoiceFromOrder |

### معیار پذیرش (Verification)

```bash
npm run type-check && npm run lint && npm run test && npm run build
# همه سبز
```

- migration فایل موجود باشد و `prisma migrate deploy` بدون خطا اجرا شود
- `outbox-worker` بعد از `order.status_changed → paid`:
  1. Invoice ساخته شود (idempotent)
  2. Invoice به `paid` تغییر وضعیت دهد
  3. Transaction با `type=payment` + `status=completed` ثبت شود

### Git

```bash
git add prisma/migrations/ src/server/jobs/workers/outbox-worker.ts
git commit -m "فاز ۰: migration اولیه + اصلاح جریان مالی (C9, C11)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۱ — قفل مالی

**هدف:** حذف ورودی مالی از کلاینت + رفع race condition کوپن  
**تخمین:** ۲-۳ روز  
**مشکلات:** C2 (unitPrice در interface), C7 (perCustomerLimit race)

### چک‌لیست

- [ ] **C2-1:** حذف `unitPrice?: number` از `CreateOrderInput` interface (`orders/service.ts:14`)
- [ ] **C2-2:** بررسی تمام callers — هیچ‌جا unitPrice ارسال نمی‌کند
- [ ] **C7-1:** تغییر `marketingService.applyCoupon` — استفاده از `SELECT ... FOR UPDATE` روی Coupon
- [ ] **C7-2:** یا استفاده از `SERIALIZABLE` isolation در تراکنش
- [ ] **C7-3:** تست race: دو درخواست هم‌زمان با perCustomerLimit=3

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `src/server/modules/orders/service.ts:12-14` | حذف `unitPrice` از interface |
| `src/server/modules/marketing/service.ts:85-140` | اتمیک‌سازی پرCustomerLimit با advisory lock یا serializable |

### معیار پذیرش

- `CreateOrderInput` بدون `unitPrice` — `tsc` سبز
- Race condition test: ۱۰ درخواست هم‌زمان → دقیقاً `perCustomerLimit` ردیمپشن ثبت شود
- `npm run type-check && npm run lint && npm run test && npm run build` ✅

### Git

```bash
git add src/server/modules/orders/service.ts src/server/modules/marketing/service.ts
git commit -m "فاز ۱: حذف unitPrice از interface + رفع race کوپن (C2, C7)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۲ — قفل امنیتی API

**هدف:** بستن حفره‌های auth + upload hardening + demo password  
**تخمین:** ۳-۴ روز  
**مشکلات:** C3 (AI بدون auth), C5 (demo password), C6 (upload بدون magic bytes + CSP)

### چک‌لیست

- [ ] **C3-1:** اضافه کردن `getCustomerSession` یا `requirePermission` به `ai/chat/route.ts`
- [ ] **C5-1:** guard قوی‌تر: `ALLOW_DEMO_LOGIN` env flag + `NODE_ENV !== 'production'`
- [ ] **C6-1:** magic bytes validation برای upload (JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP, GIF, PDF)
- [ ] **C6-2:** `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` در nginx `/uploads/`
- [ ] **C6-3:** CSP header در nginx — حداقل `default-src 'self'; script-src 'self'`

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `src/app/api/ai/chat/route.ts` | اضافه کردن customer session check |
| `src/app/api/customers/session/route.ts:70-76` | guard قوی‌تر demo password |
| `src/app/api/upload/route.ts` | magic bytes validation |
| `src/server/upload/providers/local.ts` | magic bytes check در لایه provider |
| `nginx/nginx.conf:79-83` | Content-Disposition + X-Content-Type-Options + CSP |

### معیار پذیرش

- `curl POST /api/ai/chat` بدون cookie → 401
- `curl POST /api/customers/session` با demo password در production → 401 (حتی بدون passwordHash)
- Upload فایل `.js` با MIME `image/jpeg` → 400 (magic bytes mismatch)
- `curl -I /uploads/file.jpg` → `Content-Disposition: attachment`
- `curl -I https://site/` → `Content-Security-Policy` header موجود

### Git

```bash
git add src/app/api/ai/chat/route.ts src/app/api/customers/session/route.ts src/app/api/upload/route.ts src/server/upload/providers/local.ts nginx/nginx.conf
git commit -m "فاز ۲: قفل امنیتی API — AI auth, demo guard, upload hardening, CSP (C3, C5, C6)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۳ — یکپارچگی داده و صف

**هدف:** رفع outbox re-enqueue + افزودن ایندکس‌های مفقود  
**تخمین:** ۲-۳ روز  
**مشکلات:** C12 (outbox re-enqueue), C14 (ایندکس/FK مفقود)

### چک‌لیست

- [ ] **C12-1:** اضافه کردن advisory lock به outbox-dispatcher — جلوگیری از double-processing در multi-instance
- [ ] **C12-2:** یا استفاده از `UPDATE ... RETURNING` اتمیک — claim batch قبل از enqueue
- [ ] **C14-1:** اضافه کردن `@@index([orderId])` روی `Transaction`
- [ ] **C14-2:** اضافه کردن `@@index([orderId])` روی `OrderItem`
- [ ] **C14-3:** اضافه کردن `@@index([productId])` روی `OrderItem`
- [ ] **C14-4:** `prisma migrate dev` برای تولید migration جدید

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `src/server/jobs/dispatchers/outbox-dispatcher.ts` | atomic claim batch |
| `prisma/schema.prisma` | افزودن ۳ ایندکس |
| `prisma/migrations/<ts>_add_indexes/migration.sql` | migration جدید |

### معیار پذیرش

- outbox-dispatcher: دو instance هم‌زمان → هر event فقط یک بار enqueue شود
- `EXPLAIN ANALYZE` روی `SELECT * FROM transactions WHERE orderId = ?` → Index Scan (نه Seq Scan)
- `npm run type-check && npm run lint && npm run test && npm run build` ✅

### Git

```bash
git add prisma/schema.prisma prisma/migrations/ src/server/jobs/dispatchers/outbox-dispatcher.ts
git commit -m "فاز ۳: atomic outbox dispatch + ایندکس‌های مفقود (C12, C14)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۴ — سخت‌سازی API

**هدف:** سقف perPage + rate-limit mutations + قرارداد خطا  
**تخمین:** ۲ روز  
**مشکلات:** C8 (۶ endpoint بدون سقف), C13 (rate-limit mutations), C15 (فرمت خطا)

### چک‌لیست

- [ ] **C8-1:** استخراج `parsePagination` از `products/_utils.ts` به `server/shared/validation.ts` یا `server/shared/http-utils.ts`
- [ ] **C8-2:** استفاده از `parsePagination` در ۶ endpoint (finance invoices, finance transactions, comms email-logs, comms sms-logs, shipping shipments, marketing coupons/campaigns)
- [ ] **C8-3:** حذف import نسبی `../../products/_utils` — جایگزینی با shared import
- [ ] **C13-1:** اضافه کردن rate-limit middleware برای mutation endpoints (POST/PUT/DELETE)
- [ ] **C15-1:** استانداردسازی فرمت خطا: `{ error: string, code?: string, details?: unknown }`
- [ ] **C15-2:** یکپارچه‌سازی با `require-role.ts` فرمت (`{ ok: false, reason, message }` → `{ error: message, code: reason }`)

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `src/server/shared/http-utils.ts` | جدید — handleServiceError + parsePagination + parseLimit |
| `src/app/api/products/_utils.ts` | حذف یا re-export از shared |
| ۶ فایل route (finance, comms, shipping, marketing) | import از shared + parsePagination |
| `src/lib/auth/server/rate-limit.ts` | اضافه کردن `consumeMutationRateLimit` |
| ۶ فایل route mutation | اضافه کردن rate-limit |
| `src/app/api/products/_utils.ts:4-17` | استانداردسازی فرمت خطا |

### معیار پذیرش

- `GET /api/finance/transactions?limit=999999` → `limit=100` (clamped)
- ۲۰ POST هم‌زمان → 429 با `Retry-After`
- همه خطاها فرمت `{ error, code?, details? }` دارند

### Git

```bash
git add src/server/shared/http-utils.ts src/app/api/products/_utils.ts src/app/api/ src/lib/auth/server/rate-limit.ts
git commit -m "فاز ۴: سقف perPage + rate-limit mutations + قرارداد خطا (C8, C13, C15)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۵ — کیفیت کد

**هدف:** cleanup type-safety + logger统一 + error hierarchy  
**تخمین:** ۲-۳ روز  
**مشکلات:** T1 (22x as unknown as any), T2 (console.* → logger), T3 (error hierarchy)

### چک‌لیست

- [ ] **T1-1:** ایجاد `src/server/shared/prisma-helpers.ts` — helper type `PrismaInput<T>` برای cast امن
- [ ] **T1-2:** جایگزینی `as unknown as any` در ۷ فایل repository
- [ ] **T2-1:** جایگزینی `console.error` → `logger.error` در ۴ فایل API
- [ ] **T2-2:** جایگزینی `console.log` → `logger.info` در webhook
- [ ] **T3-1:** `CouponValidationError extends ValidationError` (`errors.ts`)
- [ ] **T3-2:** `InvalidStateTransitionError extends DomainError` — ساختن `DomainError` base class
- [ ] **T3-3:** ساده‌سازی `handleServiceError` — حذف name-based dispatch

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `src/server/shared/prisma-helpers.ts` | جدید — helper types |
| ۷ فایل repository | حذف `as unknown as any` |
| ۴ فایل API (webhook, ai/chat, _utils, error.tsx) | `console.*` → `logger.*` |
| `src/server/shared/errors.ts` | DomainError base + CouponValidationError + InvalidStateTransitionError |
| `src/server/modules/marketing/service.ts` | throw new ValidationError به‌جای CouponValidationError |
| `src/server/modules/orders/state-machine.ts` | throw new DomainError |
| `src/app/api/products/_utils.ts` | حذف name-based dispatch |

### معیار پذیرش

- `grep -rn "as unknown as any" src/` → ۰ نتیجه
- `grep -rn "console\." src/server/ src/app/api/` → ۰ نتیجه (فقط error.tsx client مجاز)
- `handleServiceError` فقط `instanceof` chain — بدون name-based
- `npm run type-check && npm run lint && npm run test && npm run build` ✅

### Git

```bash
git add src/
git commit -m "فاز ۵: کیفیت کد — type-safety + logger + error hierarchy (T1, T2, T3)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۶ — زیرساخت

**هدف:** رفع N+1 inventory + cache-aside pattern  
**تخمین:** ۲ روز  
**مشکلات:** P1 (inventory N+1), P2 (cache-aside)

### چک‌لیست

- [ ] **P1-1:** `inventoryService.reserveItems` — یک `findMany` به‌جای N تا `findUnique`
- [ ] **P1-2:** بررسی اتمیک بودن — `$transaction` با `FOR UPDATE`
- [ ] **P2-1:** ایجاد `src/server/shared/cache.ts` — Redis cache-aside helper
- [ ] **P2-2:** cache products list (TTL 60s) — invalidation روی product.created/updated/deleted
- [ ] **P2-3:** cache shipping rates (TTL 5 min) — invalidation روی rate create

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `src/server/modules/inventory/service.ts` | batch query + transaction |
| `src/server/modules/inventory/repository.ts` | findMany + FOR UPDATE |
| `src/server/shared/cache.ts` | جدید — cacheAside<T>(key, ttl, fetcher) |
| `src/server/modules/products/service.ts` | استفاده از cache-aside |
| `src/server/modules/shipping/service.ts` | استفاده از cache-aside |

### معیار پذیرش

- `reserveItems(10 items)` — ۱ query به‌جای ۱۰
- `GET /api/products` تکراری → Redis hit (نه DB query) — قابل مشاهده در `MONITOR` Redis
- Invalidation: product create → cache miss بعدی
- `npm run type-check && npm run lint && npm run test && npm run build` ✅

### Git

```bash
git add src/server/modules/inventory/ src/server/shared/cache.ts src/server/modules/products/service.ts src/server/modules/shipping/service.ts
git commit -m "فاز ۶: رفع N+1 inventory + cache-aside pattern (P1, P2)"
git push origin arena/019fe8c8-saite
```

---

## فاز ۷ — تست Integration

**هدف:** coverage برای endpointهای بحرانی  
**تخمین:** موازی با فازهای دیگر  
**مشکلات:** Q1 (بدون تست integration)

### چک‌لیست

- [ ] **Q1-1:** تست endpoint `POST /api/orders` — happy path + validation errors
- [ ] **Q1-2:** تست endpoint `GET /api/orders/[id]` — IDOR check (مشتری A نتواند سفارش مشتری B ببیند)
- [ ] **Q1-3:** تست `POST /api/marketing/coupons/validate` — expiration, usage limit, per-customer
- [ ] **Q1-4:** تست `POST /api/payments/webhook/zarinpal` — idempotency
- [ ] **Q1-5:** تست `POST /api/upload` — MIME validation + size limit
- [ ] **Q1-6:** تست `POST /api/customers/session` — rate limit + anti-enumeration

### فایل‌های درگیر

| فایل | تغییر |
|------|-------|
| `tests/integration/orders.test.ts` | جدید |
| `tests/integration/orders-idor.test.ts` | جدید |
| `tests/integration/coupon-validate.test.ts` | جدید |
| `tests/integration/payment-webhook.test.ts` | جدید |
| `tests/integration/upload.test.ts` | جدید |
| `tests/integration/customer-auth.test.ts` | جدید |

### معیار پذیرش

- حداقل ۶ فایل تست integration
- coverage: تمام endpointهای بحرانی (auth, مالی, سفارش)
- `npm run test` ✅ — همه unit + integration سبز

### Git

```bash
git add tests/integration/
git commit -m "فاز ۷: تست‌های integration — 6 endpoint بحرانی (Q1)"
git push origin arena/019fe8c8-saite
```

---

## وابستگی بین فازها

```
فاز ۰ (migration + جریان پول) ← هیچ وابستگی
    ↓
فاز ۱ (قفل مالی) ← نیاز به migration فاز ۰
    ↓
فاز ۲ (امنیت) ← مستقل از فاز ۱
    ↓
فاز ۳ (داده + صف) ← نیاز به migration فاز ۰
    ↓
فاز ۴ (سخت‌سازی) ← مستقل
    ↓
فاز ۵ (کیفیت) ← بعد از فاز ۲-۴ (refactor بعد از تثبیت)
    ↓
فاز ۶ (زیرساخت) ← بعد از فاز ۵ (type-safety قبل از cache)
    ↓
فاز ۷ (تست) ← موازی — بعد از هر فاز تست‌های مربوطه
```

---

## دستورالعمل‌های عمومی

### قبل از هر commit

```bash
npm run type-check && npm run lint && npm run test && npm run build
```

### Pull برای لپ‌تاپ محلی (D:\saite)

**Git Bash:**
```bash
cd /d/saite
git restore package-lock.json 2>/dev/null  # اگر دست‌خورده
git fetch origin
git pull origin arena/019fe8c8-saite
npx prisma generate  # اگر schema.prisma عوض شده
npm run type-check && npm run build
```

**PowerShell:**
```powershell
cd D:\saite
git restore package-lock.json 2>$null
git fetch origin
git pull origin arena/019fe8c8-saite
npx prisma generate
npm run type-check; npm run build
```

### قوانین

- هر فاز یک commit مجزا
- پیام commit فارسی
- `npm run verify` قبل از هر push
- هرگز `main` را push نکنید
- Mock adapterها حذف نشوند — فقط stub
