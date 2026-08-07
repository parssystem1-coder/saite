# پچ سخت‌سازی saite

**مخزن:** `parssystem1-coder/saite`
**مبنا:** کامیت `4b59e85`
**تاریخ:** ۱۷ مرداد ۱۴۰۵

این بسته پاسخ عملی به ممیزی امنیتی/معماری پروژه است. هر فایل
**کامل** است، نه diff — مستقیم جایگزین کنید.

> ⚠️ **برای arena.ai:** فایل‌های داخل `files/` دقیقاً ساختار مخزن
> را دارند. هر کدام را روی مسیر هم‌نامش بنویس. هیچ فایلی حذف
> نمی‌شود. سه مورد دستی هست که پایین علامت‌گذاری شده‌اند.

---

## خلاصهٔ تغییرات

| # | مشکل | شدت | فایل |
|---|------|-----|------|
| ۱ | صفر هدر امنیتی HTTP، بدون CSP | 🔴 | `src/lib/security-headers.ts` (جدید) · `next.config.ts` |
| ۲ | نشست غیرقابل ابطال — عوض کردن رمز کوکی قبلی را نمی‌بندد | 🔴 | `src/lib/auth/server/session-token.ts` |
| ۳ | شمارندهٔ محدودیت نرخ در `.next/cache` — هر deploy پاکش می‌کرد | 🔴 | `src/lib/auth/server/rate-limit-store.ts` |
| ۴ | سقف فقط per-IP — حملهٔ توزیع‌شده آزاد بود | 🔴 | `src/lib/auth/server/rate-limit.ts` |
| ۵ | رمز پیش‌فرض عمومی فقط «هشدار» می‌گرفت | 🟠 | `src/lib/auth/server/admin-secret.ts` |
| ۶ | `x-forwarded-for` جعل‌پذیر بدون تنظیم پراکسی | 🟠 | `src/lib/auth/server/rate-limit.ts` |
| ۷ | قیمت از localStorage مبنای پرداخت بود | 🟠 | `src/store/cart-store.ts` · `src/lib/checkout/price-authority.ts` (جدید) |
| ۸ | بدون CSRF لایهٔ دوم، پاسخ نشست کش‌پذیر | 🟠 | `src/app/admin/api/session/route.ts` |
| ۹ | قواعد معماری فقط توافق بودند، نه اجباری | 🟡 | `eslint.config.mjs` |
| ۱۰ | بدون Dependabot / CodeQL / بررسی وابستگی | 🟡 | `.github/**` (جدید) |
| ۱۱ | `.env.example` پر از متغیر بلااستفاده | 🟡 | `.env.example` |

---

## فایل‌ها

### جایگزین شود (۸ فایل)

```
next.config.ts
eslint.config.mjs
.env.example
src/lib/auth/server/session-token.ts
src/lib/auth/server/rate-limit.ts
src/lib/auth/server/rate-limit-store.ts
src/lib/auth/server/admin-secret.ts
src/app/admin/api/session/route.ts
src/store/cart-store.ts
```

### فایل جدید (۹ مورد)

```
src/lib/security-headers.ts
src/lib/checkout/price-authority.ts
.github/dependabot.yml
.github/workflows/codeql.yml
.github/workflows/dependency-review.yml
tests/lib/security-headers.test.ts
tests/lib/session-revocation.test.ts
tests/lib/rate-limit-username.test.ts
tests/lib/price-authority.test.ts
```

### دستی (۳ مورد)

1. **`.gitignore`** → محتوای `ADD-TO-.gitignore.txt` را اضافه کنید (`.data/`).
2. **`scripts/admin-setup.mjs`** → `OPTIONAL-admin-check-snippet.md` (اختیاری).
3. **`package.json`** → `@types/node` از `^20` به `^22`، و اسکریپت‌های `analyze` / `preflight`.

---

## سازگاری با تست‌های موجود

هر ۴۹۱ تست فعلی بررسی شد. **هیچ‌کدام نباید بشکند:**

- `admin-session-token.test.ts` — توکن جعلی همچنان به‌خاطر امضا رد می‌شود؛ claim جدید مسیر تست را عوض نمی‌کند.
- `admin-rate-limit.test.ts` — رفتار پیش‌فرض `getClientKey` عمداً دست‌نخورده ماند (اولین عنصر `x-forwarded-for`). رفتار جدید فقط با `TRUSTED_PROXY_HOPS` فعال می‌شود.
- `cart-store.test.ts` — هیچ امضایی عوض نشده؛ فقط فیلد و اکشن اضافه شده. هیچ تستی مقایسهٔ دقیق شیء نمی‌کند.
- `admin-secret.test.ts` — دروازهٔ production در `NODE_ENV=test` غیرفعال است.
- `admin-session-route.test.ts` — بررسی Origin فقط وقتی هدر **موجود و نامتجانس** باشد رد می‌کند؛ درخواست بدون Origin دست‌نخورده می‌ماند.

۳۵ تست جدید اضافه می‌شود → مجموع حدود **۵۲۶**.

```bash
rm -rf .next && npm run verify
```

---

## تغییرات رفتاری که باید بدانید

**۱. یک‌بار خروج اجباری همهٔ مدیرها.**
توکن‌های قدیمی claim نسخه ندارند و رد می‌شوند. این عمدی است.

**۲. در production، بدون `ADMIN_PASSWORD` سفارشی ورود بسته می‌شود.**
پاسخ `503` با پیام «پیکربندی امنیتی سرور کامل نیست». پیام کامل
فقط در لاگ سرور. برای رفع: `npm run admin:hash-password`.

> چرا لحظهٔ ورود و نه لحظهٔ بیلد؟ چون `next build` هم با
> `NODE_ENV=production` اجرا می‌شود و خطای سطح ماژول، CI را بدون
> دلیل قرمز می‌کرد.

**۳. پوشهٔ `.data/` ساخته می‌شود.** حاوی شمارندهٔ محدودیت نرخ.
حتماً به `.gitignore` اضافه شود.

**۴. CSP ممکن است چیزی را مسدود کند.** اگر اسکریپت یا فونت خارجی
اضافه کرده‌اید که در `security-headers.ts` نیست، کنسول مرورگر
دقیقاً می‌گوید کدام دستور را باید گشاد کنید.

---

## آنچه این پچ **حل نمی‌کند**

صادقانه، تا بدهی فنی پنهان نماند:

- **بک‌اند.** بزرگ‌ترین ریسک پروژه هنوز سر جایش است: ۲۸ صفحه پنل روی دادهٔ mock. `price-authority.ts` **شکل** درست را می‌سازد، اما تا وقتی منبع داده یک فایل TypeScript است، مرز اعتماد واقعی نیست.
- **`'unsafe-inline'` در script-src.** حذفش nonce می‌خواهد و nonce یعنی از دست دادن رندر استاتیک. دلیل کامل بالای `security-headers.ts` نوشته شده.
- **محدودیت نرخ روی چند instance.** فایل‌محور است. برای serverless یا چند container باید Redis بگذارید؛ رابط `RateLimitStore` برای همین ثابت طراحی شده.
- **تست E2E.** هنوز صفر Playwright. مسیرهای ورود، سبد و تسویه end-to-end تست نمی‌شوند.
- **حجم باندل.** `mock-data.ts` (۴۰KB) احتمالاً هنوز به مرورگر می‌رود. قاعدهٔ ESLint بازگشت را می‌بندد ولی وضع فعلی را اندازه نمی‌گیرد؛ اول `analyze` را اضافه کنید.

---

## ترتیب پیشنهادی بعد از merge

1. `npm run verify` — سبز شدن همه.
2. `.data/` در `.gitignore`.
3. `npm run admin:hash-password` و پر کردن `.env.local`.
4. اگر پشت پراکسی هستید: `TRUSTED_PROXY_HOPS`.
5. **ساخت صفحهٔ جدید پنل را متوقف کنید و بک‌اند را بسازید.**
   از `src/types/product.ts` اسکیمای Prisma دربیاورید، `/api/products`
   را پیاده کنید، `NEXT_PUBLIC_USE_MOCK=false`. هر صفحهٔ ادمینی که
   الان روی mock ساخته می‌شود، بعداً یک بار دیگر بازنویسی می‌شود.
