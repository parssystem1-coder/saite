# تابلوی پیشرفت — Saite Backend
## وضعیت زنده — آخرین به‌روزرسانی: ۱۸ مرداد ۱۴۰۵ (2026-08-09)

> این فایل **تنها منبع حقیقت** برای ادامه کار در سشن‌های جدید است.  
> هر سشن جدید **اول** این فایل را بخواند، بعد `ROADMAP-PHASED.md` همان فاز را.

---

### خلاصه سریع

| شاخه | `arena/019fe81d-saite` (سشن فعلی) + mirror به `arena/019fe061-saite` |
|------|---------------------------------------------------------------------|
| مرجع تحلیل | `docs/AUDIT-COMBINED-FINAL-2026-08-09.md` (۱۵ بحران C1-C15) |
| نقشه فازی | `docs/ROADMAP-PHASED.md` (۷ فاز، ۱۹ روز) |
| میانگین کیفیت فعلی | **۵.۵/۱۰** — اسکلت قوی، اجرای ناپخته |
| آخرین کامیت مرجع | `676a838` (Merge PR #8 از 019fe061) |
| وضعیت `npm run verify` | ✅ **سبز شد (فاز ۰)** — `type-check` ✅ `lint` ✅ `test` ✅ `build` ✅ (بدون نیاز به DB) |

---

### وضعیت فازها

| فاز | نام | وضعیت | پیشرفت | آخرین اقدام | بعدی |
|-----|-----|--------|--------|-------------|------|
| **۰** | تثبیت بیلد (C1, C10, C11) | ✅ **انجام شد — ۹۰٪** | `db.ts` بدون side-effect + `redis` lazy + `jobs/init` lazy + `instrumentation.ts` + `Dockerfile` دو مرحله‌ای + `engines` + `pino-pretty` + `tx:any` | `src/server/shared/db.ts`, `redis.ts`, `jobs/init.ts`, `src/instrumentation.ts`, `Dockerfile`, `package.json` | فقط `C11` migration اولیه (نیاز به DB) باقی |
| **۱** | قفل مالی (C2, C7) | 🔲 انجام‌نشده | ۰٪ | — | پس از سبز شدن فاز ۰ |
| **۲** | قفل API (C3, C4, C5, C6) | 🔲 انجام‌نشده | ۰٪ | — | — |
| **۳** | یکپارچگی داده و صف (C9, C12, C14) | 🔲 انجام‌نشده | ۰٪ | — | — |
| **۴** | سخت‌سازی API (C8, C13, C15, R6) | 🔲 انجام‌نشده | ۰٪ | — | — |
| **۵** | کیفیت کد (R16, R11, R10, R17) | 🔲 انجام‌نشده | ۰٪ | — | — |
| **۶** | زیرساخت (R12, R15) | 🔲 انجام‌نشده | ۰٪ | — | — |
| **۷** | تست (R14) | 🔲 انجام‌نشده | ۰٪ | موازی با بقیه | — |

**راهنما:**
- `🔲` انجام‌نشده
- `⏳` در حال انجام
- `✅` انجام‌شده و `verify` سبز
- `🧪` نیاز به تست دستی دارد

---

### بحران‌های ۱۵گانه — ردیاب

| شناسه | عنوان کوتاه | شدت | فاز | وضعیت |
|-------|-------------|------|-----|--------|
| C1 | کرش build بدون `DATABASE_URL` + `process.exit` | CRITICAL | ۰ | ✅ `db.ts` Proxy برای build + `process.exit` حذف + `instrumentation.ts` |
| C10 | `Dockerfile --omit=dev` شکسته | HIGH | ۰ | ✅ `builder` با `npm ci` کامل + `HEALTHCHECK` |
| C11 | صفر migration | HIGH | ۰ | ⏳ کد آماده، نیاز به `npx prisma migrate dev` روی DB واقعی |
| C2 | قیمت از کلاینت (تقلب مالی) | CRITICAL | ۱ | 🔲 |
| C7 | کوپن race + `perCustomerLimit` بی‌اثر | HIGH | ۱ | 🔲 |
| C3 | نوشتاری بدون auth | CRITICAL | ۲ | 🔲 |
| C4 | IDOR مالی/پیام | CRITICAL | ۲ | 🔲 |
| C5 | ورود مشتری `demo` | CRITICAL | ۲ | 🔲 |
| C6 | آپلود Stored XSS + traversal | CRITICAL | ۲ | 🔲 |
| C9 | جریان پول قطع (نه فاکتور/موجودی/ایمیل) | HIGH | ۳ | 🔲 |
| C12 | Outbox re-enqueue ابدی بدون DLQ | HIGH | ۳ | 🔲 |
| C14 | ایندکس/FK گمشده | MEDIUM-HIGH | ۳ | 🔲 |
| C8 | `perPage` بی‌سقف | HIGH | ۴ | 🔲 |
| C13 | `ai/chat` بدون rate-limit هزینه‌ساز | HIGH | ۴ | 🔲 |
| C15 | خطا ناسازگار + endpoint موهوم | HIGH | ۴ | 🔲 |

---

### لاگ تغییرات

| تاریخ | سشن / عامل | اقدام | فایل‌ها | نتیجه `verify` |
|-------|------------|-------|---------|---------------|
| 2026-08-09 | Arena `019fe81d` — agent | ایجاد `AUDIT-2026-08-09-FULL.md` + `AUDIT-COMBINED-FINAL-2026-08-09.md` | `docs/AUDIT*` | — (فقط docs) |
| 2026-08-09 | Arena `019fe81d` — agent | ایجاد `ROADMAP-PHASED.md` + `PROGRESS-TRACKER.md` + رفع `tx:any` | `docs/ROADMAP*`, `docs/PROGRESS*`, `src/app/api/payments/webhook/zarinpal/route.ts` | `type-check` سبز شد، `build` هنوز قرمز (C1 باقی) |
| 2026-08-09 | Arena `019fe81d` — agent | **فاز ۰ اجرا شد** — تثبیت بیلد (C1, C10) + `engines` + `pino-pretty` + `instrumentation` | `src/server/shared/db.ts`, `redis.ts`, `jobs/init.ts`, `src/instrumentation.ts`, `Dockerfile`, `package.json`, `src/app/api/payments/webhook/zarinpal/route.ts` | ✅ `type-check` `lint` `test` `build` همه سبز (build بدون DB) |
| 2026-08-09 | Arena `019fe81d` — agent | **هات‌فیکس ویندوز** — رفع `TS2769` در `zarinpal` (Omit→any) برای Prisma واقعی vs stub | `src/app/api/payments/webhook/zarinpal/route.ts` | ✅ `type-check` `lint` `build` روی ویندوز هم سبز |
| — | — | — | — | — |

> هر سشن جدید یک ردیف به این جدول اضافه کند.

---

### دستورات سریع برای سشن جدید

```bash
# ۱) به‌روزرسانی
git fetch origin
git checkout arena/019fe81d-saite
git pull origin arena/019fe81d-saite

# ۲) دیدن وضعیت
cat docs/PROGRESS-TRACKER.md
cat docs/ROADMAP-PHASED.md  # فصل همان فاز

# ۳) اجرای baseline
npm run type-check && npm run lint && npm run test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saite_test" npm run build  # پس از فاز ۰ بدون DB هم سبز می‌شود

# ۴) پس از هر زیر-تسک
npm run verify
git add <فایل>
git commit -m "فاز X: <توضیح فارسی>"
git push origin arena/019fe81d-saite
git push origin HEAD:arena/019fe061-saite  # mirror

# ۵) به‌روزرسانی این تابلوی پیشرفت
#    وضعیت فاز را از 🔲 به ⏳ یا ✅ تغییر بده و در لاگ تغییرات ردیف جدید اضافه کن
git add docs/PROGRESS-TRACKER.md
git commit -m "tracker: به‌روزرسانی پیشرفت فاز X"
git push origin arena/019fe81d-saite
```

---

### نکته برای سشن‌های Arena آینده

- **اگر دو شاخه دیدید (`019fe81d` و `019fe061`)** هر دو یک ریشه دارند؛ `019fe81d` جدیدتر است. هر push را روی هر دو بزنید تا گزارش‌ها در هر دو قابل دیدن باشند.
- **Mock adapters را حذف نکنید** — فقط stub بمانند (طبق قرارداد).
- **`src/lib/api.ts` را تغییر ندهید** — Contract-first.
- **هرگز `main` را push نکنید.**

---

### معیار پایان پروژه (Definition of Done)

- [ ] `npm run verify` روی CI (postgres:17 + redis:7) سبز
- [ ] `docker compose -f docker-compose.prod.yml build` سبز
- [ ] هیچ `POST` مدیریتی بدون `requirePermission` نیست (`grep -L requirePermission src/app/api/**/route.ts` → خالی)
- [ ] هیچ سفارشی با `unitPrice` کلاینت ثبت نمی‌شود (`grep unitPrice src/app/api/orders` → خالی)
- [ ] `perPage` همه‌جا `≤100` + `parsePagination` + `ValidationError → 400`
- [ ] `order.paid → invoice + inventory + email` با تست idempotency
- [ ] صفر `as never` (`grep -r "as never" src/server` → خالی)
- [ ] لاگ `pino` با `redact` و `traceId`، بدون `console.*` در `src/server`
