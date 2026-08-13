# 🛍 Saite — فروشگاه ماشین‌های اداری

<p align="center">
  <img src="https://img.shields.io/badge/status-preprod_ready-success" alt="Status">
  <img src="https://img.shields.io/badge/Next.js-16.3-black" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19.2-blue" alt="React">
  <img src="https://img.shields.io/badge/tests-825_passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/e2e-4_suites-brightgreen" alt="E2E">
  <img src="https://img.shields.io/badge/node-%3E%3D22-green" alt="Node">
  <img src="https://img.shields.io/badge/RBAC-3_roles-purple" alt="RBAC">
  <img src="https://img.shields.io/badge/CSP-nonce_%2B_strict--dynamic-purple" alt="CSP">
  <img src="https://img.shields.io/badge/AI-sales_advisor_chatbot-orange" alt="AI">
</p>

فروشگاه آنلاین تجهیزات اداری — پرینتر، اسکنر، دستگاه کپی، مواد
مصرفی و قطعات یدکی. رابط کاربری کاملاً راست‌به‌چپ با پنل مدیریت
مستقل، بک‌اند واقعی (PostgreSQL + Redis)، درگاه پرداخت ایرانی، و
**چتبات مشاور فروش هوش مصنوعی** با معماری امنیت‌محور.

---

## 🏗 استک تکنولوژی

| لایه | تکنولوژی | نسخه |
|------|-----------|------|
| **فریم‌ورک** | Next.js (App Router + Turbopack) | `16.3.0` |
| **کتابخانهٔ UI** | React | `19.2.4` |
| **زبان** | TypeScript (strict) | `^5` |
| **استایل** | Tailwind CSS (توکن‌محور) | `^4` |
| **دیتابیس** | PostgreSQL + Prisma ORM (+ pgvector برای جستجوی معنایی) | `17` / `^6.19` |
| **کش و صف** | Redis (ioredis) + BullMQ (الگوی Outbox) | `^6` / `^6` |
| **وضعیت کلاینت** | Zustand | `^5` |
| **وضعیت سرور** | TanStack Query | `^5.101` |
| **فرم و اعتبارسنجی** | React Hook Form + Zod | `7.83` / `^4` |
| **پرداخت** | زرین‌پال / IDPay (+ Mock برای توسعه) | adapter-based |
| **هوش مصنوعی** | Anthropic Claude (چت) + OpenAI (embeddings) | gateway واحد |
| **انیمیشن** | Framer Motion | `^12.43` |
| **ویرایشگر محتوا** | TipTap (lazy-loaded) | `^3.29` |
| **لاگ** | Pino | `^10` |
| **تست واحد** | Vitest + Testing Library | `^4.1` |
| **E2E** | Playwright | `^1.62` |
| **استقرار** | Docker multi-stage + docker-compose + nginx | — |
| **پکیج منیجر** | npm (فقط npm — pnpm/yarn استفاده نشود) | `≥10` |

---

## 🚀 شروع سریع

### پیش‌نیازها

- **Node.js ≥ 22** (نسخهٔ ۶۴ بیتی، LTS زوج)
- **npm ≥ 10** — همراه Node نصب می‌شود
- **Docker** (اختیاری، برای صعود سریع Postgres/Redis)

### مسیر A — فقط رابط کاربری (بدون زیرساخت، ۲ دقیقه)

```bash
git clone https://github.com/parssystem1-coder/saite.git
cd saite

cp .env.example .env.local   # NEXT_PUBLIC_USE_MOCK=true پیش‌فرض است
npm ci
npm run dev
```

سایت روی `http://localhost:3000` بالا می‌آید. داده‌ها از لایهٔ
mock داخلی (`src/lib/mock-data`) می‌آیند — مناسب برای دمو و توسعهٔ UI.
چتبات در این حالت با پاسخ آزمایشی فارسی کار می‌کند.

> 💡 **روی Git Bash در ویندوز:** `npm run dev` را جداگانه اجرا
> کنید. اگر چند دستور را یک‌جا paste کنید، با پایان ورودی shell
> بسته می‌شود و سرور هم با آن خاتمه می‌یابد.

### مسیر B — استک کامل (دیتابیس + Redis + AI)

```bash
# ۱) زیرساخت (Postgres 17 + Redis)
docker-compose -f docker-compose.dev.yml up -d

# ۲) متغیرهای محیطی
cp .env.example .env.local
# DATABASE_URL و REDIS_URL همین پیش‌فرض‌های .env.example با
# docker-compose.dev یکی هستند. برای پاسخ واقعی چتبات این را اضافه کنید:
#   ANTHROPIC_API_KEY=sk-ant-...

# ۳) آماده‌سازی دیتابیس
npx prisma migrate deploy
npx prisma db seed          # دادهٔ اولیه (اختیاری ولی توصیه می‌شود)

# ۴) اجرا
npm ci
npm run dev
```

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

## 🤖 چتبات مشاور فروش (AI Sales Advisor)

دکمهٔ گفتگو گوشهٔ راستِ پایین همهٔ صفحات فروشگاه. مشاور به هوش
مصنوعی Claude وصل است، محصولات واقعی فروشگاه را پیشنهاد می‌دهد و
پاسخ را **به‌صورت استریم (SSE)** نمایش می‌دهد.

**قراردادهای امنیتی (غیرقابل تخطی):**

| قانون | سازوکار |
|---|---|
| AI هرگز روی سبد/سفارش/پرداخت/قیمت نمی‌نویسد | هیچ tool/function-call تعریف نشده — فقط متن |
| ارجاع به محصول فقط با مقدار معتبر DB | بلاک ساخت‌یافتهٔ پیشنهادها → Zod → کوئری دیتابیس → حذف شناسه‌های نامعتبر |
| ضد prompt injection و افشای PII | `detectInjection` + `redactPII` در روت و گیتوی |
| Rate-limit | دو سطل: ۶ پیام/دقیقه + ۴۰ پیام/ساعت به‌ازای کاربر/IP |
| حافظهٔ گفتگو | سشن سرور رمزشده (AES-256-GCM)، مالکیت‌بند (ضد IDOR)، TTL شش ساعته |
| UI داخلی و امن | بدون iframe؛ متن AI فقط plain-text رندر می‌شود |

مستندات کامل: [`docs/AI-ADVISOR-CHAT.md`](./docs/AI-ADVISOR-CHAT.md)

---

## 📜 دستورات

### توسعه

| دستور | توضیح |
|-------|--------|
| `npm run dev` | سرور توسعه با hot reload |
| `npm run build` | بیلد production |
| `npm start` | اجرای نسخهٔ ساخته‌شده |
| `npm run format` | قالب‌بندی با Prettier |

### بررسی کیفیت — قبل از هر commit اجباری است

| دستور | توضیح |
|-------|--------|
| `npm run type-check` | بررسی تایپ‌ها (`tsc --noEmit`) |
| `npm run lint` | ESLint با `--max-warnings=0` |
| `npm test` | تست‌های واحد (Vitest) — **۸۲۵ تست / ۹۹ فایل** |
| `npm run verify` | **هر چهار مورد + build، پشت سر هم** |

### تست‌های E2E (Playwright) — ۴ سناریو

| دستور | توضیح |
|-------|--------|
| `npm run e2e` | اجرای E2E (سرور خودکار بالا می‌آید) |
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
| `npm run admin:hash-password` | ساخت هش scrypt رمز برای `.env.local` |
| `npm run admin:totp` | فعال‌سازی ورود دومرحله‌ای |
| `npm run admin:secret` | ساخت کلید امضای نشست |

---

## 🔐 امنیت

### احراز هویت مدیر — کاملاً سمت سرور

رمز هرگز وارد باندل جاوااسکریپت نمی‌شود — با این دستور قابل اثبات است:

```bash
npm run build && grep -rl "saite-demo-1404" .next/static
# خروجی باید خالی باشد
```

**دفاع در عمق — چهار لایهٔ مستقل:**

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

تغییر نقش با `ADMIN_ROLE` و **ابطال خودکار** نشست‌های قدیمی انجام
می‌شود (نقش بخشی از fingerprint نشست است). منبع مجوزها:
[`src/lib/auth/rbac.ts`](./src/lib/auth/rbac.ts).

### قابلیت‌های امنیتی

| قابلیت | وضعیت | فعال‌سازی |
|---|---|---|
| نشست کوکی `httpOnly` + امضای HMAC | همیشه فعال | — |
| `sameSite=strict` و `Path=/admin` | همیشه فعال | — |
| ابطال گروهی نشست (`ver` claim) | همیشه فعال | افزایش `ADMIN_SESSION_VERSION` |
| محدودیت نرخ per-IP + per-username | همیشه فعال | ۱۰ IP / ۱۵ min، ۳۰ user / ۱ h |
| Rate-limit سمت سرور (فایل/Redis) + nginx | همیشه فعال | `RATE_LIMIT_STORE_PATH` |
| لاگ ورود و تلاش‌های ناموفق (JSONL) | همیشه فعال | `.data/audit.log` |
| RBAC سه‌سطحی + گارد چندلایه | همیشه فعال | `ADMIN_ROLE` |
| CSP nonce + strict-dynamic روی /admin | همیشه فعال | خودکار در `proxy.ts` |
| هش رمز با scrypt | توصیه‌شده | `npm run admin:hash-password` |
| ورود دومرحله‌ای (TOTP) | اختیاری | `npm run admin:totp` |

جزئیات کامل: [`docs/ADMIN_AUTH_SERVER_SIDE.md`](./docs/ADMIN_AUTH_SERVER_SIDE.md)

### CSP معماری دو-لایه

| مسیر | CSP | script-src |
|---|---|---|
| صفحات public (`/`, `/products`, ...) | از `next.config.headers()` | `'self' 'unsafe-inline'` (تا static بمانند) |
| مسیرهای `/admin/*` | از `src/proxy.ts` | `'self' 'nonce-{random}' 'strict-dynamic'` |

---

## 📂 ساختار پروژه

```
saite/
├── .github/workflows/          # ci.yml + e2e.yml
├── docs/                       # مستندات فنی
│   ├── AI-ADVISOR-CHAT.md      # 🤖 معماری و امنیت چتبات مشاور
│   ├── BACKEND-ARCHITECTURE.md # معماری سرور
│   ├── ADMIN_AUTH_SERVER_SIDE.md
│   ├── SETUP-GUIDE.md          # راه‌اندازی کامل محیط
│   ├── DEPLOY.md               # استقرار production
│   ├── TROUBLESHOOTING.md      # عیب‌یابی
│   ├── ci/                     # اسناد E2E و CI
│   └── archive/                # مستندات منقضی
├── e2e/                        # ۴ فایل تست Playwright
├── prisma/
│   ├── schema.prisma           # ۲۳ مدل دامنه (محصول تا لاگ مصرف AI)
│   ├── migrations/             # ۶ مایگریشن
│   └── seed.ts                 # دادهٔ اولیه
├── nginx/                      # کانفیگ پراکسی معکوس production
├── public/
├── scripts/admin-setup.mjs     # ابزار امنیت حساب مدیر
├── src/
│   ├── app/                    # App Router
│   │   ├── admin/              # پنل مدیریت — ۳۲ صفحه
│   │   ├── api/                # Route Handlerها: products, orders, payments,
│   │   │                       #  customers, ai, marketing, shipping, upload, …
│   │   └── …                   # صفحات فروشگاه (B2B/B2C)
│   ├── components/
│   │   ├── chat/               # 🤖 ویجت چت مشاور (بدون iframe)
│   │   ├── admin/              # کامپوننت‌های پنل
│   │   ├── ui/                 # پایه — pure، بدون store
│   │   └── …
│   ├── lib/                    # لایهٔ دادهٔ کلاینت + قراردادها + RBAC
│   ├── server/                 # ── فقط سرور (server-only) ──
│   │   ├── ai/                 # گیتوی واحد AI + فیچرها (sales-advisor, product-seo)
│   │   ├── auth/               # نشست مشتری/مدیر
│   │   ├── modules/            # دامنه‌ها: products, orders, inventory,
│   │   │                       #  finance, marketing, shipping, content
│   │   ├── payments/           # زرین‌پال / IDPay / Mock
│   │   ├── communications/     # ایمیل و پیامک
│   │   └── shared/             # db, redis, cache, events, errors, logger
│   ├── store/                  # Zustand
│   ├── types/
│   └── proxy.ts                # گارد /admin + CSP nonce
├── Dockerfile                  # بیلد production (multi-stage)
├── docker-compose.dev.yml      # Postgres + Redis برای توسعه
├── docker-compose.prod.yml     # استک کامل production (+ nginx)
└── vitest.config.ts / playwright.config.ts
```

### قواعد معماری (توسط ESLint/type-check اجباری‌اند)

- کامپوننت‌ها `mock-data` را مستقیم import نمی‌کنند — فقط از
  `src/lib/api.ts` (امضای آن **contract است و تغییر نمی‌کند**)
- `components/ui/` باید pure بماند: بدون store، بدون فراخوانی API
- هر ماژول سروری با `import 'server-only'` شروع می‌شود؛ ایمپورت از
  کلاینت بیلد را می‌شکند
- فراخوانی مدل‌های AI فقط از طریق گیتوی واحد `src/server/ai/gateway.ts`
- **بدون `any` / `@ts-ignore` جدید** — بدهی فنی ممنوع است
- mock adapterها حذف نمی‌شوند؛ فقط stub می‌مانند

---

## 🧪 تست‌ها

| نوع | ابزار | حجم | اجرا |
|---|---|---|---|
| واحد و یکپارچه | Vitest + Testing Library | **۸۲۵ تست / ۹۹ فایل** | `npm test` |
| E2E | Playwright | ۴ فایل spec | `npm run e2e` |

پوشش تست شامل: قراردادهای امنیتی چتبات (اعتبارسنجی ارجاع محصول، injection،
PII، مالکیت سشن)، احراز هویت و IDOR، سفارش و موجودی، پرداخت و webhook،
آپلود، rate-limit و کامپوننت‌ها.

---

## 🔄 یکپارچه‌سازی پیوسته

دو workflow آماده در `.github/workflows/`:

| Workflow | مراحل |
|---|---|
| `ci.yml` | `npm ci → type-check → lint → test → build` |
| `e2e.yml` | Playwright با تصویر رسمی — بدون دانلود مرورگر در هر اجرا |

---

## 🚢 استقرار (Production)

```bash
# مستقیم با Docker:
docker build -t saite .
# یا استک کامل (اپ + Postgres + Redis + nginx):
docker-compose -f docker-compose.prod.yml up -d
```

**متغیرهای الزامی production:**

| متغیر | کاربرد |
|---|---|
| `DATABASE_URL` | PostgreSQL — بدون آن برنامه بالا نمی‌آید |
| `ADMIN_SESSION_SECRET` | امضای کوکی مدیر — با `npm run admin:secret` بسازید |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | بدون آن ورود مدیر در production بسته است (۵۰۳) |
| `CUSTOMER_SESSION_SECRET` | امضای نشست مشتری + کلید رمزنگاری حافظهٔ چت (≥۱۶ کاراکتر) |
| `ANTHROPIC_API_KEY` | پاسخ واقعی AI — بدون آن سرویس AI در production با ۵۰۳ جواب می‌دهد |
| `TRUSTED_PROXY_HOPS` | تعداد لایه‌های پراکسی (بدون آن rate-limit قابل دورزدن است) |

متغیرهای اختیاری: `ADVISOR_CHAT_SECRET` (کلید جداگانهٔ رمزنگاری چت)،
`OPENAI_API_KEY` (جستجوی معنایی)، کلیدهای زرین‌پال/IDPay، SMTP، Kavenegar،
ArvanCloud S3. فهرست کامل و شرح هر متغیر در [`.env.example`](./.env.example).

راهنمای گام‌به‌گام: [`docs/DEPLOY.md`](./docs/DEPLOY.md) و
[`docs/SETUP-GUIDE.md`](./docs/SETUP-GUIDE.md).

---

## 🩺 عیب‌یابی

رایج‌ترین مشکلات و راه‌حلشان در
[`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md).

سریع‌ترین راه‌حل برای بیشتر مشکلات پس از `pull`:

```bash
rm -rf .next && npm run verify
```

خروجی مورد انتظار:

```
✓ type-check   بدون خطا
✓ lint         بدون خطا
✓ Tests        825 passed (99 فایل)
✓ Build        موفق
```

---

## 📂 مستندات

| سند | موضوع |
|---|---|
| [`docs/SETUP-GUIDE.md`](./docs/SETUP-GUIDE.md) | راه‌اندازی کامل محیط توسعه |
| [`docs/DEPLOY.md`](./docs/DEPLOY.md) | استقرار production |
| [`docs/BACKEND-ARCHITECTURE.md`](./docs/BACKEND-ARCHITECTURE.md) | معماری سرور و دامنه‌ها |
| [`docs/AI-ADVISOR-CHAT.md`](./docs/AI-ADVISOR-CHAT.md) | چتبات مشاور فروش |
| [`docs/ADMIN_AUTH_SERVER_SIDE.md`](./docs/ADMIN_AUTH_SERVER_SIDE.md) | امنیت پنل مدیریت |
| [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) | قرارداد API |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | عیب‌یابی |

---

## 📄 لایسنس

MIT © ۲۰۲۶ [parssystem1-coder](https://github.com/parssystem1-coder) — متن کامل در فایل [`LICENSE`](./LICENSE).
