# 🛍 Saite — سایت فروشگاهی

<p align="center">
  <img src="https://img.shields.io/badge/status-in_development-orange" alt="Status">
  <img src="https://img.shields.io/badge/node-%3E%3D22-green" alt="Node">
  <img src="https://img.shields.io/badge/npm-10-red" alt="npm">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="License">
</p>

یک سایت فروشگاهی مدرن، سریع و ریسپانسیو با تمرکز بر تجربهٔ کاربری عالی.

---

## 🏗 استک تکنولوژی

| لایه | تکنولوژی |
|------|-----------|
| **فریم‌ورک** | Next.js 16 (App Router) + React 19 |
| **زبان** | TypeScript (strict + noUnusedLocals) |
| **استایل** | Tailwind CSS v4 (توکن‌محور) |
| **وضعیت** | Zustand (کلاینت) + TanStack Query (سرور) |
| **فرم** | React Hook Form + Zod |
| **پکیج منیجر** | npm |
| **تست** | Vitest + Testing Library |
| **لینتر** | ESLint + Prettier |
| **CI/CD** | GitHub Actions |

---

## 🚀 شروع سریع

### پیش‌نیازها

- Node.js ≥ 22 (نسخهٔ ۶۴ بیتی)
- npm ≥ 10 — همراه Node نصب می‌شود

### نصب و اجرا

```bash
# کلون مخزن
git clone https://github.com/parssystem1-coder/saite.git
cd saite

# نصب وابستگی‌ها
npm install

# اجرای سرور توسعه
npm run dev
```

> 💡 روی Git Bash در ویندوز، `npm run dev` را **جداگانه** اجرا کنید.
> اگر چند دستور را یک‌جا paste کنید، با پایان ورودی، shell بسته
> می‌شود و سرور هم با آن خاتمه می‌یابد.

سایت روی `http://localhost:3000` در دسترس خواهد بود.

### دستورات اصلی

| دستور | توضیح |
|-------|--------|
| `npm run dev` | سرور توسعه (hot reload) |
| `npm run build` | بیلد production |
| `npm start` | اجرای نسخهٔ production |
| `npm run lint` | اجرای لینتر |
| `npm test` | اجرای تست‌های واحد |
| `npm run type-check` | بررسی تایپ‌ها |
| `npm run verify` | اجرای همهٔ بررسی‌ها (type + lint + test + build) |

---

## 📂 ساختار پروژه

```
saite/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # CI: type-check, lint, test, build
│   │   └── deploy.yml      # Deploy: GitHub Pages
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml       # قالب گزارش باگ
│   │   └── feature_request.yml  # قالب درخواست قابلیت
│   └── PULL_REQUEST_TEMPLATE.md # قالب pull request
├── public/                 # فایل‌های استاتیک
├── src/
│   ├── app/                # صفحات Next.js (App Router)
│   ├── components/         # کامپوننت‌های React
│   ├── hooks/              # هوک‌های سفارشی
│   ├── lib/                # ابزارها و utility ها
│   ├── store/              # مدیریت state
│   ├── styles/             # استایل‌های سراسری
│   └── types/              # تایپ‌های TypeScript
├── tests/                  # تست‌ها
├── .env.example            # نمونهٔ متغیرهای محیطی
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🔄 CI/CD

### Continuous Integration (`ci.yml`)
روی هر push و pull request اجرا می‌شود:
- ✅ تایپ‌چک TypeScript
- ✅ ESLint
- ✅ تست‌های Vitest
- ✅ بیلد production

### Deployment (`deploy.yml`)
روی تگ‌های `v*` یا اجرا دستی:
- بیلد + export استاتیک
- استقرار خودکار روی GitHub Pages

---

## 📋 فازهای توسعه

| فاز | عنوان | وضعیت |
|------|--------|--------|
| ۱ | زیرساخت و CI/CD | ✅ تکمیل شده |
| ۲ | سیستم طراحی و کامپوننت‌های پایه | ✅ تکمیل شده |
| ۳ | مدیریت داده و کاتالوگ محصولات | ✅ تکمیل شده |
| ۴ | احراز هویت و مدیریت کاربران | ✅ تکمیل شده |
| ۵ | سبد خرید و پرداخت | ✅ تکمیل شده |
| ۶ | مدیریت محتوا و بک‌اند | ✅ تکمیل شده |
| ۷ | بهینه‌سازی و استقرار | ✅ تکمیل شده |
| ۴ | احراز هویت و مدیریت کاربران | ⏳ در انتظار |
| ۵ | سبد خرید و پرداخت | ⏳ در انتظار |
| ۶ | مدیریت محتوا و بک‌اند | ⏳ در انتظار |
| ۷ | بهینه‌سازی و استقرار | ⏳ در انتظار |

---

## 📄 لایسنس

MIT © [parssystem1-coder](https://github.com/parssystem1-coder)
