# 🛍 Saite — فروشگاه ماشین‌های اداری

<p align="center">
  <img src="https://img.shields.io/badge/status-in_development-orange" alt="Status">
  <img src="https://img.shields.io/badge/Next.js-16.2-black" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-blue" alt="React">
  <img src="https://img.shields.io/badge/tests-491_passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/node-%3E%3D22-green" alt="Node">
</p>

فروشگاه آنلاین تجهیزات اداری — پرینتر، اسکنر، دستگاه کپی، مواد
مصرفی و قطعات یدکی. رابط کاربری کاملاً راست‌به‌چپ با پنل مدیریت
مستقل.

> ⚠️ **در حال توسعه.** بک‌اند، دیتابیس و درگاه پرداخت هنوز متصل
> نشده‌اند؛ داده‌ها از لایهٔ mock می‌آیند. پیش از انتشار عمومی
> بخش [آماده‌سازی برای انتشار](#-آماده‌سازی-برای-انتشار) را
> بخوانید.

---

## 🏗 استک تکنولوژی

| لایه | تکنولوژی | نسخه |
|------|-----------|------|
| **فریم‌ورک** | Next.js (App Router + Turbopack) | `16.2.12` |
| **کتابخانهٔ UI** | React | `19.2.4` |
| **زبان** | TypeScript (strict) | `^5` |
| **استایل** | Tailwind CSS (توکن‌محور، بدون فایل config) | `^4` |
| **وضعیت کلاینت** | Zustand | `^5.0.14` |
| **وضعیت سرور** | TanStack Query | `^5.101.4` |
| **فرم و اعتبارسنجی** | React Hook Form + Zod | `7.83.0` / `^4.4.3` |
| **انیمیشن** | Framer Motion | `^12.43` |
| **تست** | Vitest + Testing Library | `^4.1.10` |
| **پکیج منیجر** | npm (فقط npm — pnpm/yarn استفاده نشود) | `≥10` |

---

## 🚀 شروع سریع

### پیش‌نیازها

- **Node.js ≥ 22** (نسخهٔ ۶۴ بیتی، LTS زوج)
- **npm ≥ 10** — همراه Node نصب می‌شود

### نصب و اجرا

```bash
git clone https://github.com/parssystem1-coder/saite.git
cd saite

npm install
npm run dev
```

سایت روی `http://localhost:3000` بالا می‌آید.

> 💡 **روی Git Bash در ویندوز:** `npm run dev` را جداگانه اجرا
> کنید. اگر چند دستور را یک‌جا paste کنید، با پایان ورودی shell
> بسته می‌شود و سرور هم با آن خاتمه می‌یابد.

### ورود به پنل مدیریت

```
آدرس:        http://localhost:3000/admin/login
نام کاربری:  admin
رمز عبور:    saite-demo-1404
```

این اعتبارنامه فقط در محیط توسعه روی صفحه نمایش داده می‌شود و در
بیلد production حذف می‌گردد. برای تغییرش
[بخش امنیت](#-امنیت-پنل-مدیریت) را ببینید.

---

## 📜 دستورات

### توسعه

| دستور | توضیح |
|-------|--------|
| `npm run dev` | سرور توسعه با hot reload |
| `npm run build` | بیلد production |
| `npm start` | اجرای نسخهٔ ساخته‌شده |
| `npm run format` | قالب‌بندی با Prettier |

### بررسی کیفیت

| دستور | توضیح |
|-------|--------|
| `npm run type-check` | بررسی تایپ‌ها (`tsc --noEmit`) |
| `npm run lint` | ESLint با `--max-warnings=0` |
| `npm test` | تست‌های واحد (Vitest) |
| `npm run verify` | **هر چهار مورد بالا، پشت سر هم** |

### امنیت حساب مدیر

| دستور | توضیح |
|-------|--------|
| `npm run admin:check` | بررسی پیکربندی — کد خروج غیرصفر اگر مورد بحرانی باشد |
| `npm run admin:hash-password` | ساخت هش رمز برای `.env.local` |
| `npm run admin:totp` | فعال‌سازی ورود دومرحله‌ای |
| `npm run admin:secret` | ساخت کلید امضای نشست |

---

## 🔐 امنیت پنل مدیریت

احراز هویت مدیر **کاملاً سمت سرور** انجام می‌شود. رمز هرگز وارد
باندل جاوااسکریپت نمی‌شود — با این دستور قابل اثبات است:

```bash
npm run build && grep -rl "saite-demo-1404" .next/static
# خروجی باید خالی باشد
```

### سه لایهٔ مستقل

```
درخواست → proxy.ts → layout سرور → Route Handler
           لایهٔ ۱      لایهٔ ۲         لایهٔ ۳
```

هیچ لایه‌ای جای دیگری را نمی‌گیرد. دلیلش **CVE-2025-29927** است:
لایهٔ شبکه به‌تنهایی مرز امنیتی نیست.

> ℹ️ فایل گارد `src/proxy.ts` نام دارد، نه `middleware.ts`. در
> Next.js 16 قرارداد قدیمی منسوخ شده و با نام اشتباه، گارد
> **بی‌صدا اجرا نمی‌شود**.

### قابلیت‌ها

| قابلیت | وضعیت | فعال‌سازی |
|---|---|---|
| نشست کوکی `httpOnly` + امضای HMAC | همیشه فعال | — |
| `sameSite=strict` و `Path=/admin` | همیشه فعال | — |
| محدودیت نرخ پایدار (۱۰ تلاش / ۱۵ دقیقه) | همیشه فعال | — |
| لاگ ورود و تلاش‌های ناموفق | همیشه فعال | — |
| هش رمز با scrypt | اختیاری | `npm run admin:hash-password` |
| ورود دومرحله‌ای (TOTP) | اختیاری | `npm run admin:totp` |

جزئیات کامل: [`docs/ADMIN_AUTH_SERVER_SIDE.md`](./docs/ADMIN_AUTH_SERVER_SIDE.md)

---

## 📂 ساختار پروژه

```
saite/
├── .github/
│   ├── workflows/ci.yml         # type-check · lint · test · build
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                        # مستندات فنی
│   ├── ADMIN_AUTH_SERVER_SIDE.md    # معماری امنیت پنل
│   ├── API_CONTRACT.md              # قرارداد بک‌اند آینده
│   ├── TROUBLESHOOTING.md           # عیب‌یابی
│   └── FRONTEND_ARCHITECTURE_AUDIT_2026-08.md
├── public/                      # فایل‌های استاتیک
├── scripts/
│   └── admin-setup.mjs          # ابزار امنیت حساب مدیر
├── src/
│   ├── app/                     # مسیرها (App Router)
│   │   ├── admin/
│   │   │   ├── (panel)/         # صفحات محافظت‌شده
│   │   │   ├── api/session/     # ورود/خروج مدیر
│   │   │   ├── login/
│   │   │   └── recover/
│   │   └── …                    # صفحات فروشگاه
│   ├── assets/
│   ├── components/
│   │   ├── admin/               # کامپوننت‌های پنل
│   │   ├── layout/              # هدر، فوتر، پوسته
│   │   ├── products/
│   │   └── ui/                  # پایه — بدون وابستگی به store
│   ├── hooks/
│   ├── lib/
│   │   ├── auth/
│   │   │   └── server/          # فقط سرور (import 'server-only')
│   │   ├── seo/
│   │   └── …
│   ├── store/                   # Zustand
│   ├── types/
│   └── proxy.ts                 # گارد ناحیهٔ /admin
├── tests/                       # ۴۸ فایل، ۴۹۱ تست
├── .env.example
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

**۲۳۹ فایل TypeScript · حدود ۱۹٬۰۰۰ خط · ۴۹۱ تست**

### قواعد معماری

- کامپوننت‌ها `mock-data` را مستقیم import نمی‌کنند — فقط از
  `src/lib/api.ts`
- `components/ui/` باید pure بماند: بدون store، بدون فراخوانی API
- هر چیزی در `lib/auth/server/` با `import 'server-only'` شروع
  می‌شود؛ ایمپورت از کلاینت **بیلد را می‌شکند**

---

## 🔄 یکپارچه‌سازی پیوسته

`.github/workflows/ci.yml` روی هر push و pull request اجرا می‌شود:

```
npm ci  →  type-check  →  lint  →  test  →  build
```

هر پنج مرحله باید سبز باشند. اگر CI قرمز شد ولی محلی سبز است،
مشکل از تفاوت محیط است نه کد.

> استقرار خودکار هنوز پیکربندی نشده. تا وقتی بک‌اند متصل نشده،
> انتشار عمومی توصیه نمی‌شود.

---

## 🚢 آماده‌سازی برای انتشار

پیش از قرار دادن روی هاست:

```bash
npm run admin:secret     # الزامی — بدون آن برنامه در production بالا نمی‌آید
npm run admin:check      # بقیهٔ موارد را گزارش می‌دهد
```

`ADMIN_SESSION_SECRET` **الزامی** است. کلید پیش‌فرض در سورس عمومی
قرار دارد، پس بدون مقدار اختصاصی هر کسی می‌تواند کوکی مدیر جعل
کند. برنامه در production عمداً با خطا متوقف می‌شود تا این حالت
بی‌صدا رخ ندهد.

### آنچه هنوز متصل نیست

- بک‌اند و دیتابیس — داده‌ها mock هستند
- درگاه پرداخت
- ارسال ایمیل و پیامک
- آپلود واقعی تصویر

---

## 🧭 وضعیت توسعه

| بخش | وضعیت |
|------|--------|
| زیرساخت، CI و ابزار توسعه | ✅ |
| سیستم طراحی و کامپوننت‌های پایه | ✅ |
| کاتالوگ، فیلتر، جستجو و مقایسه | ✅ |
| سبد خرید و جریان تسویه (بدون پرداخت واقعی) | ✅ |
| پنل مدیریت — ۲۸ صفحه + endpoint نشست | ✅ |
| احراز هویت مدیر سمت سرور | ✅ |
| احراز هویت مشتری | ⚠️ mock |
| بک‌اند، دیتابیس و پرداخت | ⏳ |

---

## 🩺 عیب‌یابی

رایج‌ترین مشکلات و راه‌حلشان در
[`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md):

- خطای `Cannot find module '.../page.js'` پس از `git pull`
- «رمز نادرست» با اینکه رمز درست است — تلهٔ `$` در فایل `.env`
- قفل شدن پس از تلاش‌های ناموفق
- از دست دادن کد دومرحله‌ای

سریع‌ترین راه‌حل برای بیشتر مشکلات پس از `pull`:

```bash
rm -rf .next && npm run verify
```

خروجی مورد انتظار:

```
✓ type-check   بدون خطا
✓ lint         بدون خطا
✓ Tests        491 passed (48 فایل)
✓ Build        موفق
```

---

## 📄 لایسنس

MIT © [parssystem1-coder](https://github.com/parssystem1-coder)
