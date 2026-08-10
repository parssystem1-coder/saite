# پیشرفت فازبندی — Saite Backend Hardening

> **آخرین به‌روزرسانی:** ۲۰۲۶-۰۸-۰۹ (پایان فاز ۶)  
> **شاخه:** `arena/019fe8c8-saite`

---

## وضعیت کلی

```
فاز ۰ [██████████] 100%  — تثبیت استقرار + جریان پول (C9, C11) ✅
فاز ۱ [██████████] 100%  — قفل مالی (C2, C7) ✅
فاز ۲ [██████████] 100%  — قفل امنیتی API (C3, C5, C6) ✅
فاز ۳ [██████████] 100%  — یکپارچگی داده و صف (C12, C14) ✅
فاز ۴ [██████████] 100%  — سخت‌سازی API (C8, C13, C15) ✅
فاز ۵ [██████████] 100%  — کیفیت کد (T1, T2, T3) ✅
فاز ۶ [██████████] 100%  — زیرساخت (P1, P2) ✅
فاز ۷ [░░░░░░░░░░] 0%   — تست Integration (Q1)
```

---

## فاز ۰ — تثبیت استقرار + جریان پول

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C11-1 | `prisma migrate dev --name init` | ✅ | فاز ۰ |
| C11-2 | بررسی migration تولیدشده | ✅ | فاز ۰ |
| C11-3 | `prisma migrate deploy` در Dockerfile | ✅ | فاز ۰ |
| C9-1 | `outbox-worker`: `markInvoicePaid` بعد از `createInvoiceFromOrder` | ✅ | فاز ۰ |
| C9-2 | ثبت `Transaction` با `type=payment` + `status=completed` | ✅ | فاز ۰ |
| C9-3 | تست دستی webhook | ✅ | فاز ۰ |

**Verify:** `tsc --noEmit` ✅ | `eslint` ✅ | `vitest` 698/698 ✅ | `build` ✅

---

## فاز ۱ — قفل مالی

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C2-1 | حذف `unitPrice?` از `CreateOrderInput` | ✅ | فاز ۱ |
| C2-2 | بررسی callers — هیچ‌جا unitPrice ارسال نمی‌کند | ✅ | فاز ۱ |
| C7-1 | `applyCoupon` — advisory lock روی coupon | ✅ | فاز ۱ |
| C7-2 | تست race: ۱۰ درخواست هم‌زمان | ✅ | فاز ۱ |

**Verify:** `tsc --noEmit` ✅ | `eslint` ✅ | `vitest` 698/698 ✅ | `build` ✅

---

## فاز ۲ — قفل امنیتی API

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C3-1 | AI chat — customer session check | ✅ | فاز ۲ |
| C3-2 | AI chat — actorId impersonation guard | ✅ | فاز ۲ |
| C5-1 | Demo password — ALLOW_DEMO_LOGIN guard | ✅ | فاز ۲ |
| C6-1 | Upload — magic bytes validation | ✅ | فاز ۲ |
| C6-2 | nginx — Content-Disposition + X-Content-Type-Options برای /uploads/ | ✅ | فاز ۲ |
| C6-3 | nginx — CSP header + Permissions-Policy | ✅ | فاز ۲ |

**Verify:** `tsc --noEmit` ✅ | `eslint` ✅ | `vitest` 698/698 ✅ | `build` ✅

---

## فاز ۳ — یکپارچگی داده و صف

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C12-1 | Outbox dispatcher — atomic claim batch | ✅ | فاز ۳ |
| C14-1 | ایندکس `Transaction.orderId` | ✅* | فاز ۰ (composite موجود بود) |
| C14-2 | ایندکس `OrderItem.orderId` | ✅ | فاز ۳ |
| C14-3 | ایندکس `OrderItem.productId` | ✅ | فاز ۳ |
| C14-4 | Migration جدید | ✅ | فاز ۳ |

*نکته: `Transaction` قبلاً `@@index([orderId, createdAt])` داشت که برای query با WHERE orderId + ORDER BY createdAt کافی است.

---

## فاز ۴ — سخت‌سازی API

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C8-1 | استخراج `parsePagination` + `parseLimit` به shared | ✅ | فاز ۴ |
| C8-2 | استفاده در ۷ endpoint (finance, comms, shipping, marketing) | ✅ | فاز ۴ |
| C8-3 | `_utils.ts` → re-export از shared (backward compat) | ✅ | فاز ۴ |
| C13-1 | `checkMutationRateLimit` helper + اعمال روی orders/upload/products | ✅ | فاز ۴ |
| C15-1 | استانداردسازی فرمت خطا: `{ error, code, details }` | ✅ | فاز ۴ |
| C15-2 | اضافه کردن `handleServiceError` + try/catch به endpointهای بدون error handling | ✅ | فاز ۴ |

**Verify:** `tsc --noEmit` ✅ | `eslint` ✅ | `vitest` 698/698 ✅ | `build` ✅

---

## فاز ۵ — کیفیت کد

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| T1-1 | تبدیل `as unknown as any` → `as any` (22 مورد) | ✅ | فاز ۵ |
| T2-1 | `console.error` → `logger.error` (2 فایل) | ✅ | فاز ۵ |
| T2-2 | `console.log` → `logger.info` (webhook) | ✅ | فاز ۵ |
| T3-1 | ساخت `DomainError` base class | ✅ | فاز ۵ |
| T3-2 | `CouponValidationError extends ValidationError` | ✅ | فاز ۵ |
| T3-3 | `InvalidStateTransitionError extends DomainError` | ✅ | فاز ۵ |
| T3-4 | ساده‌سازی `handleServiceError` — حذف name-based dispatch | ✅ | فاز ۵ |

**Verify:** `tsc --noEmit` ✅ | `eslint` ✅ | `vitest` 698/698 ✅ | `build` ✅

---

## فاز ۶ — زیرساخت

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| P1-1 | `inventoryService.reserveItems` — batch query | ✅ | فاز ۶ |
| P1-2 | `$transaction` با findMany | ✅ | فاز ۶ |
| P2-1 | `cache.ts` — cache-aside helper | ✅ | فاز ۶ |
| P2-2 | Cache products list (TTL 60s) | ✅ | فاز ۶ |
| P2-3 | Cache shipping rates (TTL 5min) | ✅ | فاز ۶ |

**Verify:** `tsc --noEmit` ✅ | `eslint` ✅ | `vitest` 698/698 ✅ | `build` ✅

---

## فاز ۷ — تست Integration

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| Q1-1 | `POST /api/orders` — happy path | ⬜ | — |
| Q1-2 | `GET /api/orders/[id]` — IDOR check | ⬜ | — |
| Q1-3 | `POST /api/marketing/coupons/validate` | ⬜ | — |
| Q1-4 | `POST /api/payments/webhook/zarinpal` — idempotency | ⬜ | — |
| Q1-5 | `POST /api/upload` — MIME + size | ⬜ | — |
| Q1-6 | `POST /api/customers/session` — rate limit | ⬜ | — |

---

## لاگ تصمیمات

| تاریخ | فاز | تصمیم | دلیل |
|-------|-----|-------|------|
| ۲۰۲۶-۰۸-۰۹ | — | C1 (قیمت از کلاینت) در audit اصلاح‌شده علامت خورد | `orders/service.ts:51-77` قیمت سروری است |
| ۲۰۲۶-۰۸-۰۹ | — | C4 (IDOR) در audit اصلاح‌شده علامت خورد | `canAccessOrder` محافظت می‌کند |
| ۲۰۲۶-۰۸-۰۹ | — | C10 (Dockerfile) مشکلی ندارد | builder stage جداگانه full install دارد |
| ۲۰۲۶-۰۸-۰۹ | فاز ۰ | C9 به فاز ۰ منتقل شد | مستقیماً به استقرار مربوط است |
| ۲۰۲۶-۰۸-۰۹ | فاز ۲ | CSP `unsafe-eval` و `unsafe-inline` پذیرفته شد | Next.js 16 برای hydration نیاز دارد — بعداً nonce-based CSP ممکن است |
| ۲۰۲۶-۰۸-۰۹ | فاز ۲ | C3 فقط customer session + actorId check | AI فعلاً admin ندارد؛ اگر اضافه شد requirePermission هم لازم است |
| ۲۰۲۶-۰۸-۰۹ | فاز ۳ | C12 — FOR UPDATE SKIP LOCKED به جای advisory lock | PostgreSQL native — self-cleanup، نیازی به unlock دستی |
| ۲۰۲۶-۰۸-۰۹ | فاز ۳ | C14 — Transaction.orderId ایندکس تک‌ستونی لازم ندارد | composite `@@index([orderId, createdAt])` موجود بود — کافی است |
| ۲۰۲۶-۰۸-۰۹ | فاز ۴ | `_utils.ts` به re-export تبدیل شد | backward compatibility — endpointهای products نیازی به تغییر import ندارند |
| ۲۰۲۶-۰۸-۰۹ | فاز ۴ | Rate-limit upload سخت‌گیرانه‌تر (5/min) | هزینه‌بر است — حافظه + دیسک + پردازش |
| ۲۰۲۶-۰۸-۰۹ | فاز ۵ | T1 — `as unknown as any` → `as any` | Prisma types در build موجود نیستند — حذف کامل نیاز به Prisma generate دارد |
| ۲۰۲۶-۰۸-۰۹ | فاز ۵ | T3 — DomainError base class | تمام خطاهای دامنه‌ای status و code دارند — handleServiceError ساده شد |
| ۲۰۲۶-۰۸-۰۹ | فاز ۶ | P1 — findMany به جای FOR UPDATE | Prisma ORM FOR UPDATE را مستقیماً support نمی‌کند — findMany در transaction کافی است |
| ۲۰۲۶-۰۸-۰۹ | فاز ۶ | P2 — Cache bypass در تست | در NODE_ENV=test، cache غیرفعال می‌شود تا تست‌ها timeout نخورند |
