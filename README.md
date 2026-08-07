# 🛍 Saite — فروشگاه ماشین‌های اداری

<p align="center">
  <img src="https://img.shields.io/badge/status-preprod_ready-success" alt="Status">
  <img src="https://img.shields.io/badge/Next.js-16.2-black" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-blue" alt="React">
  <img src="https://img.shields.io/badge/tests-649_passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/e2e-13_passing-brightgreen" alt="E2E">
  <img src="https://img.shields.io/badge/node-%3E%3D22-green" alt="Node">
  <img src="https://img.shields.io/badge/RBAC-3_roles-purple" alt="RBAC">
  <img src="https://img.shields.io/badge/CSP-nonce_%2B_strict--dynamic-purple" alt="CSP">
</p>

فروشگاه آنلاین تجهیزات اداری — پرینتر، اسکنر، دستگاه کپی، مواد
مصرفی و قطعات یدکی. رابط کاربری کاملاً راست‌به‌چپ با پنل مدیریت
مستقل، RBAC سه‌سطحی و CSP سختگیرانه.

> ⚠️ **در حال توسعه — فرانت‌اند کامل، بک‌اند هنوز متصل نیست.**
> داده‌ها از لایهٔ mock می‌آیند. پیش از انتشار عمومی
> بخش [آماده‌سازی برای انتشار](#-آماده‌سازی-برای-انتشار) را بخوانید.

> 📌 **سند مرجع اصلاحات:** نقشهٔ راه کامل، ۲۰ مشکل تلفیقی، تاریخچهٔ دو سشن (فازهای ۰–۶ + A/B/D/E) و چک‌لیست امنیتی در [`docs/MASTER-REFERENCE-IMPLEMENTATION.md`](./docs/MASTER-REFERENCE-IMPLEMENTATION.md) نگهداری می‌شود (بخش ۱۴ = گزارش آخرین سشن). مستندات منقضی در [`docs/archive/`](./docs/archive/) بایگانی شده‌اند.

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
| **ویرایشگر محتوا** | TipTap (lazy-loaded) | `^3.29` |
| **تست واحد** | Vitest + Testing Library | `^4.1.10` |
| **E2E** | Playwright | `^1.62.1` |
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
نقش پیش‌فرض: admin (قابل تغییر با ADMIN_ROLE در .env.local)
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
| `npm test` | تست‌های واحد (Vitest) — **۶۴۹ تست** |
| `npm run verify` | **هر چهار مورد بالا، پشت سر هم** |

### تست‌های E2E (Playwright)

| دستور | توضیح |
|-------|--------|
| `npm run e2e` | اجرای ۱۳ سناریوی E2E (سرور خودکار بالا می‌آید) |
| `npm run e2e:ui` | UI تعاملی برای دیباگ |
| `npm run e2e:report` | HTML گزارش آخرین اجرا |
| `npm run e2e:list` | فهرست تست‌ها بدون اجرا |

**یک بار نصب مرورگر (فقط توسعه‌دهنده محلی):**

```bash
npx playwright install chromium
```

**⚠️ کاربران ایران:** CDN Playwright از ایران بلاک است. راه‌حل — از مرورگر سیستمی:

```bash
PW_CHANNEL=msedge npm run e2e    # Edge روی هر ویندوز از قبل نصب است
PW_CHANNEL=chrome npm run e2e    # یا Chrome اگر دارید
```

هیچ دانلودی رخ نمی‌دهد. جزئیات: [`docs/ci/E2E-SETUP.md`](./docs/ci/E2E-SETUP.md).

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

### دفاع در عمق — چهار لایهٔ مستقل

```
درخواست → proxy.ts → layout سرور → layout گروه → Route Handler
           لایهٔ ۱      لایهٔ ۲         لایهٔ ۳         لایهٔ ۴
```

هیچ لایه‌ای جای دیگری را نمی‌گیرد. دلیلش **CVE-2025-29927** است:
لایهٔ شبکه به‌تنهایی مرز امنیتی نیست.

> ℹ️ فایل گارد `src/proxy.ts` نام دارد، نه `middleware.ts`. در
> Next.js 16 قرارداد قدیمی منسوخ شده و با نام اشتباه، گارد
> **بی‌صدا اجرا نمی‌شود**.

### RBAC — سه نقش سرور

| نقش | مجوزها | مورد استفاده |
|:---:|---|---|
| **viewer** | فقط خواندن همه‌جا (به‌جز `users`) | حسابرس، ناظر |
| **operator** | viewer + عملیات (orders, customers, catalog, marketing, comms, content) | کارشناس پشتیبانی/فروش |
| **admin** | همه‌کاره + `finance:write`, `settings:write`, `users:manage` | مدیر کل |

تغییر نقش با env و **ابطال خودکار** نشست‌های قدیمی:

```bash
# در .env.local:
ADMIN_ROLE=viewer   # یا operator یا admin (پیش‌فرض)
```

هر تغییر در `ADMIN_ROLE` بخشی از fingerprint نشست است، پس همهٔ کوکی‌های قبلی خودکار ابطال می‌شوند.

منبع مجوزها: [`src/lib/auth/rbac.ts`](./src/lib/auth/rbac.ts) — یک جدول ساده که نقش را به مجموعه‌ای از `resource:action` نگاشت می‌کند.

### قابلیت‌های امنیتی

| قابلیت | وضعیت | فعال‌سازی |
|---|---|---|
| نشست کوکی `httpOnly` + امضای HMAC | همیشه فعال | — |
| `sameSite=strict` و `Path=/admin` | همیشه فعال | — |
| ابطال گروهی نشست (`ver` claim) | همیشه فعال | افزایش `ADMIN_SESSION_VERSION` |
| محدودیت نرخ per-IP + per-username | همیشه فعال | ۱۰ IP / ۱۵ min، ۳۰ user / ۱ h |
| لاگ ورود و تلاش‌های ناموفق (JSONL) | همیشه فعال | `.data/audit.log` |
| **RBAC سه‌سطحی + گارد چندلایه** | همیشه فعال | `ADMIN_ROLE` |
| **CSP nonce + strict-dynamic روی /admin** | همیشه فعال | خودکار در `proxy.ts` |
| هش رمز با scrypt | اختیاری | `npm run admin:hash-password` |
| ورود دومرحله‌ای (TOTP) | اختیاری | `npm run admin:totp` |

جزئیات کامل: [`docs/ADMIN_AUTH_SERVER_SIDE.md`](./docs/ADMIN_AUTH_SERVER_SIDE.md)

### CSP معماری دو-لایه

| مسیر | CSP | script-src |
|---|---|---|
| صفحات public (`/`, `/products`, ...) | از `next.config.headers()` | `'self' 'unsafe-inline'` (تا static بمانند) |
| مسیرهای `/admin/*` | از `src/proxy.ts` | `'self' 'nonce-{random}' 'strict-dynamic' 'unsafe-inline'` (fallback Safari <15.4) |

مرورگر مدرن با دیدن `strict-dynamic`، `'unsafe-inline'` را نادیده می‌گیرد.

اثبات زنده:
```bash
curl -sI /admin/login | grep -oE "nonce-[A-Za-z0-9_-]+"
# nonce-XBtQ4Ly-3gRLDDLk7BGgXQ    ← یکتای هر request
```

---

## 📂 ساختار پروژه

```
saite/
├── .github/
│   ├── workflows/ci.yml         # type-check · lint · test · build
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                        # مستندات فنی
│   ├── MASTER-REFERENCE-IMPLEMENTATION.md  # سند مرجع — تاریخچه، ۲۰ مشکل، چک‌لیست امنیتی
│   ├── ADMIN_AUTH_SERVER_SIDE.md    # معماری امنیت پنل
│   ├── API_CONTRACT.md              # قرارداد بک‌اند آینده
│   ├── TROUBLESHOOTING.md           # عیب‌یابی
│   ├── ci/
│   │   ├── E2E-SETUP.md             # 🆕 راه‌اندازی workflow E2E
│   │   └── e2e.yml.example          # 🆕 workflow آماده کپی
│   ├── archive/                     # مستندات منقضی
│   └── hardening-patches/           # ۱۰ پچ سخت‌سازی
├── e2e/                         # 🆕 ۴ فایل / ۱۳ تست Playwright
│   ├── admin-login.spec.ts
│   ├── cart-checkout.spec.ts
│   ├── product-editor.spec.ts
│   └── product-filters.spec.ts
├── public/                      # فایل‌های استاتیک
├── scripts/
│   └── admin-setup.mjs          # ابزار امنیت حساب مدیر
├── src/
│   ├── app/                     # مسیرها (App Router)
│   │   ├── admin/
│   │   │   ├── (panel)/         # صفحات محافظت‌شده — ۳۱ صفحه، همه واقعی
│   │   │   │   ├── finance/     # 🆕 layout با گارد finance:read
│   │   │   │   ├── settings/    # 🆕 layout با گارد settings:write
│   │   │   │   └── forbidden/   # 🆕 صفحه 403 داخلی
│   │   │   ├── api/session/     # ورود/خروج مدیر
│   │   │   ├── login/
│   │   │   └── recover/
│   │   └── …                    # صفحات فروشگاه
│   ├── assets/
│   ├── components/
│   │   ├── admin/               # کامپوننت‌های پنل
│   │   │   ├── finance/         # 🆕 ۵ صفحه با mock-adapter
│   │   │   ├── reports/         # 🆕 ۴ صفحه + MiniBarChart SVG
│   │   │   ├── marketing/       # 🆕 coupons + sms-campaigns
│   │   │   ├── communications/  # 🆕 sms + inquiries
│   │   │   └── content/         # 🆕 articles + pages
│   │   ├── layout/              # هدر، فوتر، پوسته
│   │   ├── products/
│   │   ├── seo/
│   │   └── ui/                  # پایه — بدون وابستگی به store
│   ├── hooks/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── rbac.ts          # 🆕 منبع واحد مجوزها
│   │   │   └── server/          # فقط سرور (import 'server-only')
│   │   │       ├── require-role.ts   # 🆕 گارد Route Handler
│   │   │       └── page-guard.ts     # 🆕 گارد Server Component
│   │   ├── finance/             # 🆕 mock-adapter
│   │   ├── reports/             # 🆕 mock-adapter
│   │   ├── marketing/           # 🆕 mock-adapter
│   │   ├── communications/      # 🆕 mock-adapter
│   │   ├── content/             # 🆕 mock-adapter
│   │   ├── format-fa.ts         # 🆕 formatters pure (server-compat)
│   │   ├── seo/
│   │   ├── security-headers.ts  # buildCSP + generateNonce
│   │   └── …
│   ├── store/                   # Zustand
│   ├── types/
│   │   ├── user.ts              # AdminRole = viewer|operator|admin
│   │   ├── finance.ts           # 🆕
│   │   ├── marketing.ts         # 🆕
│   │   ├── communications.ts    # 🆕
│   │   ├── content.ts           # 🆕
│   │   └── …
│   └── proxy.ts                 # گارد /admin + CSP nonce
├── tests/                       # ۷۴ فایل / ۶۴۹ تست
├── .env.example
├── next.config.ts
├── playwright.config.ts         # پشتیبانی PW_CHANNEL
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

**~۳۰۰ فایل TypeScript · ۶۴۹ تست vitest · ۱۳ تست e2e**

### قواعد معماری

- کامپوننت‌ها `mock-data` را مستقیم import نمی‌کنند — فقط از
  `src/lib/api.ts` (ESLint چک می‌کند)
- `components/ui/` باید pure بماند: بدون store، بدون فراخوانی API
  (ESLint چک می‌کند)
- هر چیزی در `lib/auth/server/` با `import 'server-only'` شروع
  می‌شود؛ ایمپورت از کلاینت **بیلد را می‌شکند**
- هر layout زیر `admin/(panel)/{finance,settings}/` گارد نقش‌محور
  دارد (`requirePagePermission`)
- هر Route Handler حساس با `requirePermission('...')` گارد می‌شود

---

## 🔄 یکپارچه‌سازی پیوسته

### CI اصلی — `.github/workflows/ci.yml`

روی هر push و pull request اجرا می‌شود:

```
npm ci  →  type-check  →  lint  →  test  →  build
```

### 🆕 E2E CI — قابل فعال‌سازی

فایل آماده در `docs/ci/e2e.yml.example`. برای فعال‌سازی، یک بار محلی کپی کنید:

```bash
mkdir -p .github/workflows
cp docs/ci/e2e.yml.example .github/workflows/e2e.yml
git add .github/workflows/e2e.yml
git commit -m "ci: افزودن workflow E2E با Playwright"
git push
```

از تصویر رسمی `mcr.microsoft.com/playwright:v1.62.1-noble` استفاده می‌کند — بدون دانلود مرورگر در هر اجرا. جزئیات: [`docs/ci/E2E-SETUP.md`](./docs/ci/E2E-SETUP.md).

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

- بک‌اند و دیتابیس — داده‌ها mock هستند (Prisma+Postgres پیشنهاد شده)
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
| **مرجع قیمت سرور (`repriceCart`)** | ✅ |
| **پنل مدیریت — ۳۱ صفحه، همه واقعی** (صفر placeholder) | ✅ |
| **RBAC سه‌سطحی (viewer/operator/admin)** | ✅ |
| **CSP nonce + strict-dynamic روی `/admin`** | ✅ |
| **۱۳ تست E2E Playwright** — اثبات‌شده روی msedge | ✅ |
| احراز هویت مدیر سمت سرور + ابطال نشست | ✅ |
| احراز هویت مشتری | ⚠️ mock |
| بک‌اند، دیتابیس و پرداخت | ⏳ |

**نمرهٔ کیفیت پروژه: ۸٫۷/۱۰** (رشد از ۸٫۱ در سشن قبل — [جزئیات نمره‌دهی](./docs/MASTER-REFERENCE-IMPLEMENTATION.md#%DB%B1%DB%B4%DB%B1%DB%B0-%D9%86%D9%85%D8%B1%D9%87%D9%94-%D9%86%D9%87%D8%A7%DB%8C%DB%8C-%D9%BE%D8%B1%D9%88%DA%98%D9%87-%D9%BE%D8%B3-%D8%A7%D8%B2-%D8%B3%D8%B4%D9%86-019fdd7f)).

---

## 🩺 عیب‌یابی

رایج‌ترین مشکلات و راه‌حلشان در
[`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md):

- خطای `Cannot find module '.../page.js'` پس از `git pull`
- «رمز نادرست» با اینکه رمز درست است — تلهٔ `$` در فایل `.env`
- قفل شدن پس از تلاش‌های ناموفق
- از دست دادن کد دومرحله‌ای
- **E2E: `Executable doesn't exist`** → از `PW_CHANNEL=msedge` استفاده کنید
- **E2E: `Unsupported webkit channel "msedge"`** → `PW_CHANNEL` را با `devices[...]` هم‌زمان استفاده نکنید

سریع‌ترین راه‌حل برای بیشتر مشکلات پس از `pull`:

```bash
rm -rf .next && npm run verify
```

خروجی مورد انتظار:

```
✓ type-check   بدون خطا
✓ lint         بدون خطا
✓ Tests        649 passed (74 فایل)
✓ Build        موفق — 64 route
```

---

## 📄 لایسنس

MIT © [parssystem1-coder](https://github.com/parssystem1-coder)
