# 🔑 چطور اجازه بدهید ربات فایل CI را هم پوش کند

سه راه وجود دارد. **راه ۱ سریع‌ترین است (۳۰ ثانیه) و به هیچ تنظیمی نیاز ندارد.**

---

## ⚡ راه ۱ — خودتان یک بار اعمال کنید (توصیهٔ من)

سه دستور، در پوشهٔ پروژه روی سیستم خودتان:

```bash
git pull origin arena/019fbe01-saite

cp docs/patches/ci.yml.proposed .github/workflows/ci.yml

git commit -am "ci: fix invalid workflow YAML and add test step" && git push
```

همین. بعد از این، CI برای اولین بار سبز می‌شود.

> **چرا این راه بهتر است؟** فقط همین یک فایل مشکل دارد. بقیهٔ کارها را ربات
> بدون هیچ محدودیتی پوش می‌کند. نیازی نیست برای یک فایل، دسترسی دائمی بدهید.

### 🖱 اگر ترجیح می‌دهید با موس انجام دهید

۱. این لینک را باز کنید:
   <https://github.com/parssystem1-coder/saite/edit/arena/019fbe01-saite/.github/workflows/ci.yml>
۲. **کل محتوا** را پاک کنید.
۳. محتوای فایل `docs/patches/ci.yml.proposed` را کپی و جای‌گذاری کنید
   (یا از بخش «متن کامل» در پایین همین صفحه بردارید).
۴. دکمهٔ **Commit changes** را بزنید.

---

## 🔧 راه ۲ — دسترسی `workflows` را به اپ بدهید (راه‌حل دائمی)

اگر می‌خواهید ربات از این به بعد فایل‌های `.github/workflows/**` را هم
مدیریت کند:

۱. به این آدرس بروید:
   <https://github.com/settings/installations>
۲. روی **Arena** (یا `arena-ai-coding-agent`) کلیک کنید.
۳. اگر پیام سبز **"Review request"** یا **"Update permissions"** دیدید،
   روی آن کلیک کنید و تأیید کنید.
۴. اگر چنین پیامی نبود، یعنی توسعه‌دهندهٔ اپ باید ابتدا دسترسی
   **Workflows: Read and write** را به تعریف اپ اضافه کند — این کار از سمت
   شما قابل انجام نیست.

> ⚠️ **نکتهٔ مهم:** این دسترسی به ربات اجازه می‌دهد فایل‌هایی را تغییر دهد که
> در CI شما **اجرا** می‌شوند. از نظر امنیتی، دسترسی حساسی است. برای پروژهٔ
> فعلی که فقط یک فایل نیاز به اصلاح دارد، راه ۱ منطقی‌تر است.

---

## 🔑 راه ۳ — استفاده از توکن شخصی (فقط اگر راه‌های بالا ممکن نبود)

اگر مخزن سازمانی است و به تنظیمات اپ دسترسی ندارید، می‌توانید یک
Fine-grained PAT با دسترسی `Workflows: Read and write` بسازید و به‌صورت
موقت استفاده کنید.

> 🚫 **این توکن را در چت برای من نفرستید.** هرگز توکن، رمز عبور یا کد دومرحله‌ای
> را با من در میان نگذارید. اگر این راه را انتخاب کردید، خودتان محلی از آن
> استفاده کنید.

---

## ❓ چرا اصلاً این مشکل پیش آمد؟

هنگام push این خطا برگشت:

```
! [remote rejected] arena/019fbe01-saite -> arena/019fbe01-saite
  (refusing to allow a GitHub App to create or update workflow
   `.github/workflows/ci.yml` without `workflows` permission)
```

این یک **قانون امنیتی خود GitHub** است، نه باگ. GitHub اجازه نمی‌دهد یک
GitHub App بدون دسترسی صریح `workflows`، فایل‌های داخل
`.github/workflows/` را تغییر دهد — چون آن فایل‌ها روی سرورهای CI اجرا
می‌شوند و می‌توانند به اسرار مخزن دسترسی پیدا کنند.

**بقیهٔ فایل‌ها مشکلی ندارند.** کل فاز ۱ (۶۰ فایل) با موفقیت پوش شد؛ فقط
همین یک فایل باقی ماند.

---

## 🚨 چرا این اصلاح مهم است؟

فایل فعلی روی مخزن، **از نظر نحوی نامعتبر است**. خط اول آن کلمهٔ اضافی
`yaml` است که احتمالاً هنگام کپی از یک بلوک کد جا مانده:

```yaml
yaml        ← ❌ این خط، کل فایل را خراب می‌کند
name: CI
```

نتیجه‌اش را می‌توان در تاریخچهٔ اجراها دید — **هر ۵ اجرا در ۰ ثانیه
شکست خورده‌اند**:

```
failure  feat(phase-1): design system…   0s
failure  docs: add UI shell audit…       0s
failure  docs: add architecture review…  0s
failure  Merge pull request #2…          0s
failure  Add CI workflow…                0s
```

یعنی CI شما تا امروز **حتی یک بار هم واقعاً اجرا نشده**. تا وقتی این خط
حذف نشود، هیچ‌کدام از تست‌ها و بررسی‌ها روی GitHub اجرا نمی‌شوند.

### چهار اصلاح این پچ

| # | تغییر | چرا |
|:-:|-------|-----|
| ۱ | حذف خط اول `yaml` | 🔴 بدون این، کل workflow نامعتبر است |
| ۲ | افزودن مرحلهٔ `pnpm test` | تست‌ها اصلاً در CI اجرا نمی‌شدند |
| ۳ | `pnpm install --frozen-lockfile` | جلوگیری از تغییر ناخواستهٔ lockfile |
| ۴ | `branches: [main, 'arena/**']` | پوشش همهٔ برنچ‌های کاری، نه یک نام ثابت |

---

## 📄 متن کامل فایل صحیح

اگر می‌خواهید دستی کپی کنید:

```yaml
name: CI

on:
  push:
    branches: [main, 'arena/**']
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

---

## ✅ بعد از اعمال، چطور مطمئن شوم کار کرد؟

```bash
gh run list --limit 1
```

باید ببینید مدت اجرا از `0s` به چیزی حدود **۱ تا ۲ دقیقه** تغییر کرده و
وضعیت `success` است. اگر هنوز `0s` بود، یعنی فایل هنوز اصلاح نشده.

از طریق مرورگر هم می‌توانید ببینید:
<https://github.com/parssystem1-coder/saite/actions>

> 💡 چون `pnpm verify` را محلی اجرا کرده‌ام و کاملاً سبز است (۱۸ تست، بیلد
> موفق)، انتظار می‌رود CI هم در اولین اجرای واقعی سبز شود.
