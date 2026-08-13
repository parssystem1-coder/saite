# 🤝 راهنمای مشارکت — Saite

ممنون از علاقهٔ شما به مشارکت در پروژهٔ Saite! این راهنما را تا
انتها بخوانید؛ قواعد «الزامی» مشخص‌شده‌اند و CI آن‌ها را اجباری
می‌کند.

---

## 📋 قبل از شروع

1. **Issue های موجود** را بررسی کنید — شاید مشکل یا درخواست شما قبلاً ثبت شده باشد.
2. اگر می‌خواهید روی Issue جدیدی کار کنید، ابتدا **یک Issue بسازید** یا در Issue موجود اعلام آمادگی کنید.
3. برای تغییرات بزرگ (معماری، امنیت، قرارداد API)، قبل از کدنویسی در Issue **گفتگو** کنید.

---

## 🛠 راه‌اندازی محیط توسعه

```bash
# ۱. کلون و نصب — همیشه npm ci (نه install) تا lockfile حاکم باشد
git clone https://github.com/parssystem1-coder/saite.git
cd saite
cp .env.example .env.local
npm ci

# ۲. (اختیاری) استک کامل: Postgres + Redis
docker-compose -f docker-compose.dev.yml up -d
npx prisma migrate deploy && npx prisma db seed

# ۳. اجرا
npm run dev
```

بدون Docker هم می‌توانید کار کنید — با `NEXT_PUBLIC_USE_MOCK=true`
(پیش‌فرض `.env.example`) داده‌ها از mock داخلی می‌آیند و چتبات با
پاسخ آزمایشی کار می‌کند.

---

## ✅ قانون طلایی: قبل از هر commit

```bash
npm run verify
```

این دستور هر چهار گیت را پشت سر هم اجرا می‌کند و **همه باید سبز باشند**:

| گیت | دستور | معیار قبولی |
|---|---|---|
| تایپ‌ها | `npm run type-check` | صفر خطا |
| لینت | `npm run lint` | `--max-warnings=0` — حتی warning هم مجاز نیست |
| تست | `npm test` | همهٔ ۸۲۵ تست + تست‌های جدید شما سبز |
| بیلد | `npm run build` | موفق — 64+ route |

CI (`ci.yml`) دقیقاً همین را روی هر push و PR اجرا می‌کند؛ پس اگر
محلی سبز باشد، CI هم سبز می‌شود.

---

## 📐 استانداردهای کد

### TypeScript

- `strict` mode فعال است و باید بماند.
- **هیچ `any` جدید و هیچ `@ts-ignore` جدیدی ممنوع است.** اگر جایی
  به تایپ پیچیده نیاز دارید، تایپ دقیق بنویسید یا `unknown` +
  narrowing بگذارید.
- برای object shapes از `interface` استفاده کنید (ترجیحی).

### معماری — قواعدی که ESLint/build اجبارشان می‌کند

- کامپوننت‌ها **فقط** از `@/lib/api` داده می‌گیرند؛ import مستقیم
  `@/lib/mock-data` بیرون از `src/lib/` ممنوع است.
- امضای `src/lib/api.ts` **قرارداد است و تغییر نمی‌کند** — تغییر داده
  می‌شود، نه شکل توابع.
- `components/ui/` باید pure بماند: بدون store، بدون API.
- ماژول‌های سروری با `import 'server-only'` آغاز می‌شوند.
- mock adapterها حذف نمی‌شوند؛ فقط stub می‌مانند (برای تست/توسعه
  لازم‌اند).

### هوش مصنوعی — قواعد امنیتی

هر فیچر AI باید از گیتوی واحد `src/server/ai/gateway.ts` عبور کند
(injection-guard + PII redaction + cost-tracking خودکار). در فیچرهای
چت:

- به مدل **هیچ tool/function برای نوشتن** روی سبد/سفارش/پرداخت/قیمت ندهید.
- هر خروجی AI که «اثر واقعی» دارد (مثل شناسهٔ محصول) باید با دیتابیس
  اعتبارسنجی شود (الگو: `features/sales-advisor/output.ts`).

### کامپوننت‌ها و UI

- فارسی و کاملاً RTL؛ متن‌های کاربرمحور فارسی.
- یک کامپوننت = یک فایل (kebab-case برای فایل، PascalCase برای کامپوننت).
- در Client Componentها از `'use client'` صریح استفاده کنید.
- از توکن‌های طراحی (مثل `bg-surface-1`، `text-primary`) استفاده
  کنید، نه رنگ‌های hard-code.

---

## 🧪 تست برای هر تغییر

| نوع تغییر | تست مورد انتظار |
|---|---|
| منطق سرور/servise | تست واحد در `tests/server/` |
| Route Handler | تست مرزی در `tests/integration/` (کانون‌های امنیتی: auth، rate-limit، validation) |
| لایهٔ مشترک (`lib/`) | تست در `tests/lib/` |
| کامپوننت | تست رندر در `tests/components/` با `renderWithProviders` |
| جریان کاربری مهم | سناریوی Playwright در `e2e/` |

فایل‌های سروری را با `vi.mock('@/server/shared/db')` و
`vi.mock('@/lib/auth/server/rate-limit')` ایزوله کنید — الگو در تست‌های
موجود آمده است. در محیط تست، ذخیره‌گاه‌ها (rate-limit، chat memory،
cache) خودسر به حافظهٔ درون‌process می‌افتند.

---

## 🗂 Commit و Branch

### Conventional Commits (الزامی)

```
feat(chat): چتبات مشاور فروش با استریم SSE
fix(cart): رفع به‌هم‌ریختن قیمت پس از sync
docs: به‌روزرسانی README
test(advisor): تست اعتبارسنجی ارجاع محصول
refactor(orders): استخراج state machine
chore: به‌روزرسانی وابستگی‌ها
```

### شاخه‌ها

| Branch | کاربرد |
|--------|--------|
| `main` | کد پایدار و آمادهٔ استقرار |
| `arena/*` | شاخه‌های سشن‌های عامل Arena (پوش به همین‌ها انجام می‌شود) |
| `feat/*` | قابلیت‌های جدید |
| `fix/*` | رفع باگ |

---

## 📬 Pull Request

1. شاخهٔ خود را از آخرین `main` به‌روز نگه دارید.
2. `npm run verify` محلی سبز باشد.
3. Template PR را پر کنید — خلاصهٔ تغییر و *چرا* آن.
4. CI سبز باشد (type-check + lint + test + build و در صورت تغییر UI، e2e).
5. حداقل یک review بگیرید.

---

## 🔐 گزارش آسیب‌پذیری امنیتی

آسیب‌پذیری امنیتی را **Issue عمومی نکنید**. اول از طریق تماس خصوصی
با نگهدارنده‌ها در میان بگذارید و پس از رفع، اطلاع‌رسانی هماهنگ انجام
می‌شود.

---

## 🐛 گزارش باگ / 💡 درخواست قابلیت

از قالب‌های آمادهٔ Issues (Bug Report / Feature Request) استفاده کنید.

---

ممنون از مشارکت شما! 🙏
