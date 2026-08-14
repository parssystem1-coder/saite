# گزارش کامل اصلاحات — Saite (۶ فاز)

> **تاریخ:** ۱۴ اوت ۲۰۲۶
> **برنچ:** `arena/019fffe3-saite` → PR به `main`
> **سند مرجع:** `docs/REMEDIATION-PLAN-2026-08-14.md`
> **وضعیت جدول ردیابی ۲۲ آیتمی:** ✅ همهٔ آیتمها کامل شدند

این سند خلاصهٔ اجرایی کل ۶ فاز اصلاحات بکاند است که طبق
`docs/REMEDIATION-PLAN-2026-08-14.md` انجام شد. جزئیات فنی هر فاز در خودِ
سند مرجع و در پیامهای commit موجود است.

---

## نمای کلی

| فاز | عنوان | آیتمها | وضعیت |
|---|---|---|---|
| ۱ | Type Safety — حذف `as any` و سختسازی مرز repository | ۱–۴ | ✅ |
| ۲ | Performance دیتابیس — ایندکسها و pg_trgm | ۵–۷ | ✅ |
| ۳ | امنیت تکمیلی — PII، rate-limit، retention | ۸–۱۱ | ✅ |
| ۴ | Jobs — انقضای PaymentIntent، idempotent، retryCount | ۱۲–۱۵ | ✅ |
| ۵ | الگوهای طراحی — Registry، Unit of Work، helpers | ۱۶–۱۹ | ✅ |
| ۶ | تستهای integration واقعی روی Postgres | ۲۰–۲۲ | ✅ |

---

## فاز ۱ — Type Safety

- **حذف هر ۲۳ مورد `as any`** در ۸ فایل با تایپهای تولیدی Prisma
  (`products`, `finance`, `orders`, `shipping`, `marketing`, `event-bus`).
- `products/service.ts`: `create(input: unknown)` → `create(input: CreateProductData)`.
- **نگاشت خطای Prisma** در `handleServiceError`: `P2002` → ۴۰۹ `CONFLICT`، `P2025` → ۴۰۴ `NOT_FOUND`.
- **قاعدهٔ eslint** `no-restricted-syntax` برای جلوگیری از ورود `as any` جدید به `src/server`.

**تأیید:** `grep "as any" src/server` → ۰ مورد واقعی. تست جدید نگاشت خطا (۳ تست).

## فاز ۲ — Performance دیتابیس

- **Migration `20260814000000_add_pg_trgm_search_indexes`**: `CREATE EXTENSION pg_trgm` + ۴ ایندکس GIN روی `name/model/sku/brand`.
- **Migration `20260814000001_add_composite_indexes`**: ۷ ایندکس ترکیبی (coupon, campaign, post, page, payment_intent, email_log, sms_log).
- **Endpoint سبک sitemap** (`fields=slug`): فقط `slug/updatedAt` کشیده میشود؛ `sitemap.ts` از این حالت استفاده میکند.

> **نکته:** سند مرجع ملک datasource را `postgresqlExtensions = [...]` نوشته بود که نام اشتباه بود؛ نام صحیح Prisma `extensions = [...]` است و بهدرستی validate شد.

## فاز ۳ — امنیت تکمیلی

- **pino redaction**: فیلدهای PII (`to`, `email`, `phone`, `password`, `authorization`, `headers.*`) → `[REDACTED]`.
- **Rate-limit روی ۹ مسیر جامانده** + **جدول سیاست متمرکز** `rate-limit-policy.ts` (`RATE_LIMITS`).
- **job retention** (`log-retention-dispatcher`): پاکسازی دورهای EmailLog/SmsLog/OutboxEvent/AiUsageLog.

**تأیید:** تست grepای جدید — هیچ mutation بدون سقف نرخ نیست.

## فاز ۴ — Jobs

- **انقضای PaymentIntent**: `expirePaymentIntents()` در inventory-expiry-dispatcher؛ `initialize` intent منقضی را رد و درگاه جدید میسازد.
- **مصرف idempotent outbox**: claim شرطی `updateMany({ processedAt: null })` در worker.
- **جداسازی claimedAt از retryCount**: migration `20260814000002_add_outbox_claimed_at`؛ claim با `claimedAt` و شرط ۲ دقیقهای؛ increment فقط در `on('failed')`.
- **BullMQ repeatable scheduler** (اختیاری) با fallback setInterval.

## فاز ۵ — الگوهای طراحی

- **Registry پرداخت** در `gateway.ts` (`PROVIDERS`) با حفظ fail-closed.
- **Unit of Work**: پارامتر `tx` اختیاری در repositoryهای finance/orders؛ `markInvoicePaid` اتمیک شد.
- **`paginatedList` مشترک** در `repo-utils.ts` — حذف ۶+ کپی الگوی صفحهبندی.
- **`getSiteUrl()` متمرکز** با fail-fast در production.
- **TTLها به constants** با env-override.

## فاز ۶ — تستهای integration واقعی

- **پروفایل `vitest.config.integration.ts`** + اسکریپت `npm run test:db` (فقط با `DATABASE_URL_TEST`).
- **شش سناریوی race** در `tests/db-integration/`:
  - رزرو موازی (۲ سفارش، ۱ موجودی → یکی موفق)
  - پرداخت دیرهنگام (رزرو→expire→confirm→کسر شرطی)
  - گذار موازی وضعیت (یک برنده، یکی InvalidStateTransition)
  - کوپن موازی (۵ apply، usageLimit=3 → دقیقاً ۳ redemption)
  - webhook دوباره + جبران outbox (idempotent)
  - outbox dispatcher موازی (SKIP LOCKED → یک claim)
- **e2e پرداخت mock** (`e2e/payment-flow.spec.ts`).
- **CI job `test-db`** در `docs/ci/ci.yml.npm`.

**تأیید روی لپتاپ توسعهدهنده (Postgres 17 + pgvector):**
```
Test Files  5 passed (5)
Tests       7 passed (7)
```

---

## تأییدهای سبز در CI / ماشین توسعه

| مرحله | نتیجه |
|---|---|
| `npm run type-check` | ✅ |
| `npm run lint` | ✅ |
| `npm run test` (۹۵۹ تست واحد/mock) | ✅ |
| `npm run build` | ✅ |
| `npm run test:db` (۷ تست integration واقعی) | ✅ |

---

## نکات خارج از scope (به تأیید کاربر نیاز داشت)

- صفحهٔ عمومی `/orders/[id]`
- الگوهای فارسی prompt-injection در `ai/safety.ts`
- Docker secrets بهجای env
- پیادهسازی واقعی SMTP/S3/pgvector (TODOهای roadmap)

---

## نکتهٔ CI — دسترسی workflows

در این برنچ، job `test-db` در `docs/ci/ci.yml.npm` (سند مرجع) ثبت شده است، نه در
`.github/workflows/ci.yml` زنده. دلیل: GitHub App این جلسه دسترسی `workflows` برای
ویرایش workflowهای زنده نداشت. برای فعالکردن job روی خودِ GitHub، باید آن را به
`.github/workflows/ci.yml` اضافه کرد یا دسترسی `workflows` به App داد.
