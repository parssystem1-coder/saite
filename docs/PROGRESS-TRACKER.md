# پیشرفت فازبندی — Saite Backend Hardening

> **آخرین به‌روزرسانی:** ۲۰۲۶-۰۸-۰۹  
> **شاخه:** `arena/019fe8c8-saite`

---

## وضعیت کلی

```
فاز ۰ [░░░░░░░░░░] 0%   — تثبیت استقرار + جریان پول (C9, C11)
فاز ۱ [░░░░░░░░░░] 0%   — قفل مالی (C2, C7)
فاز ۲ [░░░░░░░░░░] 0%   — قفل امنیتی API (C3, C5, C6)
فاز ۳ [░░░░░░░░░░] 0%   — یکپارچگی داده و صف (C12, C14)
فاز ۴ [░░░░░░░░░░] 0%   — سخت‌سازی API (C8, C13, C15)
فاز ۵ [░░░░░░░░░░] 0%   — کیفیت کد (T1, T2, T3)
فاز ۶ [░░░░░░░░░░] 0%   — زیرساخت (P1, P2)
فاز ۷ [░░░░░░░░░░] 0%   — تست Integration (Q1)
```

---

## فاز ۰ — تثبیت استقرار + جریان پول

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C11-1 | `prisma migrate dev --name init` | ⬜ | — |
| C11-2 | بررسی migration تولیدشده | ⬜ | — |
| C11-3 | `prisma migrate deploy` در Dockerfile | ⬜ | — |
| C9-1 | `outbox-worker`: `markInvoicePaid` بعد از `createInvoiceFromOrder` | ⬜ | — |
| C9-2 | ثبت `Transaction` با `type=payment` + `status=completed` | ⬜ | — |
| C9-3 | تست دستی webhook | ⬜ | — |

**Verify:** `npm run type-check && npm run lint && npm run test && npm run build`

---

## فاز ۱ — قفل مالی

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C2-1 | حذف `unitPrice?` از `CreateOrderInput` | ⬜ | — |
| C2-2 | بررسی callers | ⬜ | — |
| C7-1 | اتمیک‌سازی perCustomerLimit (SELECT FOR UPDATE) | ⬜ | — |
| C7-2 | تست race condition | ⬜ | — |

---

## فاز ۲ — قفل امنیتی API

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C3-1 | AI chat — customer session check | ⬜ | — |
| C5-1 | Demo password — ALLOW_DEMO_LOGIN guard | ⬜ | — |
| C6-1 | Upload — magic bytes validation | ⬜ | — |
| C6-2 | nginx — Content-Disposition + X-Content-Type-Options | ⬜ | — |
| C6-3 | nginx — CSP header | ⬜ | — |

---

## فاز ۳ — یکپارچگی داده و صف

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C12-1 | Outbox dispatcher — atomic claim batch | ⬜ | — |
| C14-1 | ایندکس `Transaction.orderId` | ⬜ | — |
| C14-2 | ایندکس `OrderItem.orderId` | ⬜ | — |
| C14-3 | ایندکس `OrderItem.productId` | ⬜ | — |
| C14-4 | Migration جدید | ⬜ | — |

---

## فاز ۴ — سخت‌سازی API

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| C8-1 | استخراج `parsePagination` به shared | ⬜ | — |
| C8-2 | استفاده در ۶ endpoint | ⬜ | — |
| C8-3 | حذف import نسبی `../../products/_utils` | ⬜ | — |
| C13-1 | Rate-limit middleware mutations | ⬜ | — |
| C15-1 | استانداردسازی فرمت خطا | ⬜ | — |

---

## فاز ۵ — کیفیت کد

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| T1-1 | ساخت `prisma-helpers.ts` | ⬜ | — |
| T1-2 | حذف 22x `as unknown as any` | ⬜ | — |
| T2-1 | `console.error` → `logger.error` (۴ فایل) | ⬜ | — |
| T2-2 | `console.log` → `logger.info` (webhook) | ⬜ | — |
| T3-1 | `CouponValidationError extends ValidationError` | ⬜ | — |
| T3-2 | `InvalidStateTransitionError extends DomainError` | ⬜ | — |
| T3-3 | ساده‌سازی `handleServiceError` | ⬜ | — |

---

## فاز ۶ — زیرساخت

| # | آیتم | وضعیت | Commit |
|---|------|:------:|--------|
| P1-1 | `inventoryService.reserveItems` — batch query | ⬜ | — |
| P1-2 | `$transaction` با FOR UPDATE | ⬜ | — |
| P2-1 | `cache.ts` — cache-aside helper | ⬜ | — |
| P2-2 | Cache products list | ⬜ | — |
| P2-3 | Cache shipping rates | ⬜ | — |

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
