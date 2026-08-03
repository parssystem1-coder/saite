# 🔧 به‌روزرسانی CI به npm — یک دستور، توسط شما

## چرا این فایل اینجاست و نه در `.github/workflows/`؟

GitHub App که این تغییرات را پوش می‌کند، دسترسی `workflows` ندارد.
هر تلاش برای تغییر `.github/workflows/**` با این پیام رد می‌شود:

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/ci.yml` without `workflows` permission
```

این یک محدودیت امنیتی درست است: اگر رباتی بتواند workflow را عوض
کند، می‌تواند هر کدی را در CI اجرا کند. پس **شما** باید این یک
فایل را اعمال کنید.

---

## چه چیزی عوض می‌شود؟

CI فعلی با **pnpm** نصب می‌کند، در حالی که پروژه از فاز E فقط با
**npm** کار می‌کند و `pnpm-lock.yaml` حذف شده است. یعنی CI در
وضعیت فعلی، درخت وابستگی متفاوتی از محیط شما می‌سازد — یا اصلاً
شکست می‌خورد چون lockfile مورد نیازش وجود ندارد.

| مورد | فعلی (نادرست) | جدید |
|---|---|---|
| نصب | `pnpm install --frozen-lockfile` | `npm ci --no-audit --no-fund` |
| کش | `cache: 'pnpm'` | `cache: 'npm'` |
| نیازمند | `pnpm-lock.yaml` (حذف شده) | `package-lock.json` ✅ |
| مرحلهٔ اضافه | `pnpm/action-setup` | حذف شد (npm همراه Node است) |

---

## اعمال — در Git Bash روی `D:\saite`

```bash
cd /d/saite
git pull origin arena/019fc7c0-saite

cp docs/ci/ci.yml.npm .github/workflows/ci.yml

git add .github/workflows/ci.yml
git commit -m "ci: switch from pnpm to npm ci"
git push origin arena/019fc7c0-saite
```

بعد از این، CI برای اولین بار با همان ابزاری اجرا می‌شود که
شما استفاده می‌کنید.

> 📌 چون این commit از حساب شخصی شما پوش می‌شود (نه از App)،
> محدودیت `workflows` اعمال نمی‌شود.

---

## تأیید

پس از push، در تب **Actions** مخزن، اجرای جدید باید این مراحل را
سبز نشان دهد:

```
Install dependencies  →  npm ci
Type check            →  npm run type-check
Lint                  →  npm run lint
Test                  →  npm test        (231 تست)
Build                 →  npm run build   (65 صفحه)
```

هر پنج مرحله روی همین کد به‌صورت محلی سبز هستند، پس اگر CI قرمز
شد، مشکل از تفاوت محیط است نه از کد.
