# 🎭 راه‌اندازی E2E در CI — Playwright

## چرا این راهنما اینجاست و فایل مستقیم در `.github/workflows/` نیست؟

GitHub App که تغییرات را push می‌کند، دسترسی `workflows` ندارد
(محدودیت امنیتی درست — هر ربات نباید بتواند CI را عوض کند). پس
**شما** باید فایل زیر را یک بار محلی کپی کنید.

```bash
cd /d/saite
mkdir -p .github/workflows
cp docs/ci/e2e.yml.example .github/workflows/e2e.yml
git add .github/workflows/e2e.yml
git commit -m "ci: افزودن workflow E2E با Playwright"
git push origin arena/019fdd7f-saite
```

پس از پوش، هر PR جدید هم `verify` (از `ci.yml` موجود) و هم `e2e`
(از این فایل جدید) را اجرا می‌کند.

---

## چه کاری انجام می‌دهد؟

- روی هر `push` به `main` یا `arena/**` و هر PR
- در تصویر رسمی `mcr.microsoft.com/playwright:v1.62.1-noble` که
  Chromium و همه dependencies را از قبل دارد → **نصب مرورگر
  حذف می‌شود، فقط `npm ci` می‌ماند**
- `npm run e2e` (که خودش dev server را از `playwright.config.ts`
  بالا می‌آورد)
- بارگذاری `playwright-report` (همیشه) و `test-results` (فقط
  در شکست) به‌عنوان artifact با نگهداری ۱۴ روز

## چرا جدا از `ci.yml`؟

E2E ~۵ برابر از verify کندتر است (بارگذاری تصویر + Turbopack + Chrome).
اگر با ci.yml مخلوط شود، هر تغییر کوچک هم منتظر آن می‌ماند.
`concurrency` جداگانه دارد، پس همزمان با ci.yml اجرا می‌شود.

## اگر نسخهٔ Playwright را در `package.json` عوض کردید

خط `image: mcr.microsoft.com/playwright:v1.62.1-noble` را هم
هم‌نسخه کنید — وگرنه Playwright موقع اجرا هشدار می‌دهد که مرورگر
نصب‌شده با کتابخانه ناهماهنگ است.

## اجرای محلی

```bash
# یک بار: نصب مرورگر
npx playwright install chromium

# اجرا (dev server خودش بالا می‌آید)
npm run e2e

# با UI برای دیباگ
npm run e2e:ui

# دیدن گزارش HTML آخرین اجرا
npm run e2e:report
```

## متغیرهای محیطی مهم در CI

```yaml
env:
  NODE_ENV: test                                # حذف تأخیر ۶۰۰ms rate-limit
  ADMIN_SESSION_SECRET: 'test-only-secret-...' # حداقل ۱۶ کاراکتر
  ADMIN_ROLE: admin                             # نقش پیش‌فرض (فاز B)
```

`ADMIN_PASSWORD` را در تست از رمز پیش‌فرض (`saite-demo-1404`) استفاده می‌کنیم
که در development غیرقابل حذف است (dev-mode fallback). این عمداً امن است:
`assertSafeProductionCredentials` فقط در production خطا می‌دهد.
