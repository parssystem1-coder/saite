# 🔐 انتقال احراز هویت مدیر به سرور

> **تاریخ:** ۴ اوت ۲۰۲۶
> **مشکلی که حل شد:** رمز پنل مدیریت در باندل جاوااسکریپت مرورگر بود
> **وضعیت:** ✅ اجرا شد و با curl روی سرور واقعی آزمایش شد

---

## 📌 خلاصه در یک نگاه

| | قبل | بعد |
|---|---|---|
| محل تأیید رمز | مرورگر کاربر | سرور |
| رمز در `.next/static` | ✅ پیدا می‌شد | ❌ پیدا نمی‌شود |
| محل نشست | `localStorage` | کوکی `httpOnly` |
| جعل نشست | با یک خط در DevTools | نیازمند کلید HMAC |
| `GET /admin` بدون ورود | `200` + کل HTML پنل | `307` به صفحهٔ ورود |
| محدودیت تلاش | فقط در حافظهٔ صفحه | سرور، بر اساس IP |
| متغیر محیطی | `NEXT_PUBLIC_ADMIN_PASSWORD` | `ADMIN_PASSWORD` |

---

## 🔍 مشکل — با شواهد

سند ممیزی قبلی این را «حل‌نشدنی در فاز mock» اعلام کرده بود. آن
ارزیابی درست بود **تا وقتی که منطق در کلاینت می‌ماند**.

اثبات نشت روی کد قبلی:

```bash
npm run build
grep -rl "saite-demo-1404" .next/static
# .next/static/chunks/3e9hd4ipezm--.js
```

یعنی هر بازدیدکننده‌ای می‌توانست سورس صفحه را باز کند، `Ctrl+F`
بزند و رمز پنل مدیریت را پیدا کند.

دو مشکل دیگر که کنارش بود:

**۱. نشست قابل جعل بود.** گارد فقط `localStorage` را می‌خواند:

```js
// در کنسول مرورگر، بدون دانستن هیچ رمزی:
localStorage.setItem('admin-session',
  '{"state":{"isAdminAuthenticated":true}}')
location.reload()
// → پنل باز می‌شد
```

**۲. HTML پنل به همه می‌رسید.** `AdminGuard` کلاینتی بود، پس سرور
کل صفحه را می‌فرستاد و بعد مرورگر تصمیم می‌گرفت پنهانش کند. ساختار
۲۳ ماژول مدیریتی در `view-source` قابل دیدن بود.

---

## 🏗 معماری جدید — سه لایه

```
درخواست → proxy.ts → layout سرور → Route Handler
           (لایه ۱)    (لایه ۲)      (لایه ۳)
```

هیچ لایه‌ای جای دیگری را نمی‌گیرد. دلیلش **CVE-2025-29927** است:
در مارس ۲۰۲۵ معلوم شد با یک هدر ساختگی می‌شد اجرای middleware را
دور زد و هر گاردی که فقط به آن تکیه داشت از کار می‌افتاد.

### لایهٔ ۱ — `src/proxy.ts`

⚠️ **نام فایل `proxy.ts` است، نه `middleware.ts`.**

در Next.js 16 قرارداد `middleware` منسوخ شده. این فقط تغییر نام
نیست — اگر فایل با نام قدیمی بماند، در نسخه‌های بعدی **بی‌صدا
نادیده گرفته می‌شود**: بدون خطا، بدون هشدار، و پنل باز می‌ماند.

تأیید در همین مخزن:

```
node_modules/next/dist/build/index.js:651
→ 'The "middleware" file convention is deprecated.
   Please use "proxy" instead.'
```

کار این لایه: بررسی امضای کوکی و ریدایرکت زودهنگام. عمداً سبک است
— نه دیتابیس، نه منطق سنگین.

### لایهٔ ۲ — `src/app/admin/(panel)/layout.tsx`

یک Server Component که پیش از تولید HTML نشست را بررسی می‌کند:

```tsx
const admin = await getAdminSession()
if (!admin) redirect('/admin/login')
```

نتیجه: کاربر بدون نشست **هیچ بایتی** از محتوای پنل نمی‌گیرد.

### لایهٔ ۳ — `getAdminSession()` در هر Route Handler

آخرین خط دفاع. اگر روزی `matcher` عوض شود یا مسیری از قلم بیفتد،
این بررسی همچنان جلوی دسترسی را می‌گیرد.

---

## 🔑 توکن نشست

کوکی `httpOnly` جلوی خواندن با جاوااسکریپت را می‌گیرد، اما کاربر
همچنان می‌تواند با curl مقدار دلخواه بفرستد. پس محتوا با
**HMAC-SHA256** امضا می‌شود:

```
base64url(payload) + "." + base64url(hmac)
```

بدون دانستن `ADMIN_SESSION_SECRET`، ساختن توکن معتبر ممکن نیست.

### گزینه‌های کوکی و دلیل هرکدام

| گزینه | مقدار | چرا |
|---|---|---|
| `httpOnly` | `true` | جاوااسکریپت نمی‌تواند بخواند — XSS نشست را نمی‌دزدد |
| `sameSite` | `strict` | کلیک روی لینک از سایت دیگر کوکی را نمی‌فرستد (CSRF) |
| `secure` | فقط production | در dev روی `http://localhost` باید خاموش باشد |
| `path` | `/admin` | به درخواست‌های فروشگاه ارسال نمی‌شود |
| `maxAge` | ۸ ساعت | نشست مدیر نباید بی‌پایان باز بماند |

---

## ⚠️ یک تلهٔ واقعی که در مسیر پیدا شد

`Path=/admin` باعث شد مسیر اولیهٔ API از کار بیفتد. قانون مسیر
کوکی بر اساس **پیشوند رشته‌ای** است و `/api/admin/session` با
`/admin` شروع نمی‌شود:

```bash
POST /api/admin/session   → Set-Cookie ✅
GET  /api/admin/session   → {"authenticated":false} ❌
```

کوکی ذخیره می‌شد اما هرگز پس فرستاده نمی‌شد — یعنی خروج بی‌صدا
شکست می‌خورد. راه‌حل: انتقال به **`/admin/api/session`**.

این نکته در تست واحد پیدا نمی‌شد، چون تست‌ها مستقیم تابع را صدا
می‌زنند و قانون Path مرورگر را شبیه‌سازی نمی‌کنند. فقط با
`curl -c/-b` روی سرور واقعی معلوم شد.

---

## ✅ نتایج آزمایش روی سرور

```
بدون نشست:
  GET /admin                     → 307 → /admin/login?redirect=%2Fadmin
  GET /admin/orders              → 307
  GET /admin/settings            → 307
  GET /admin/finance/invoices    → 307

کوکی جعلی:
  saite_admin_session=true                            → 307
  {"state":{"isAdminAuthenticated":true}}             → 307
  admin-1.anything                                    → 307

جریان کامل:
  POST /admin/api/session (رمز غلط)   → 401
  POST /admin/api/session (رمز درست)  → 200 + Set-Cookie
  GET  /admin                         → 200
  DELETE /admin/api/session           → 200
  GET  /admin                         → 307  (نشست باطل شد)

محدودیت نرخ:
  تلاش ۱ تا ۱۰ → 401
  تلاش ۱۱      → 429 + Retry-After

نشت در باندل:
  grep -rl "saite-demo-1404" .next/static  → خالی ✅

محتوای پنل برای کاربر بدون نشست:
  لینک‌های /admin/* در HTML → ۱ (فقط /admin/recover روی فرم ورود)
```

---

## 📁 فایل‌های جدید

```
src/proxy.ts                              گارد لایهٔ شبکه
src/app/admin/api/session/route.ts        ورود/خروج/وضعیت
src/lib/auth/server/admin-secret.ts       رمز — با import 'server-only'
src/lib/auth/server/admin-session.ts      خواندن/نوشتن کوکی
src/lib/auth/server/session-token.ts      امضا و تأیید HMAC
src/lib/auth/server/rate-limit.ts         محدودیت نرخ بر اساس IP
src/lib/auth/admin-login-contract.ts      قرارداد مشترک (بدون راز)
src/lib/auth/admin-login-client.ts        فراخوانی fetch از فرم
src/components/admin/admin-session-provider.tsx
```

### فایل‌های حذف‌شده

```
src/lib/auth/admin-credentials.ts    منطق به لایهٔ سرور رفت
src/components/admin/admin-guard.tsx گارد کلاینتی — جایش layout سرور
tests/lib/admin-credentials.test.ts  جایش admin-secret.test.ts
```

---

## 🛡 نگهبان زمان-بیلد

`src/lib/auth/server/admin-secret.ts` با `import 'server-only'`
شروع می‌شود. اگر روزی کسی اشتباهاً آن را از یک Client Component
ایمپورت کند، **بیلد می‌شکند**:

```
Error: This module cannot be imported from a Client Component module.
```

یعنی نشت دوباره با بازبینی کد جلوگیری نمی‌شود — با کامپایلر
جلوگیری می‌شود.

---

## 🔧 پیکربندی

```bash
# .env.local
ADMIN_USERNAME=myname
ADMIN_PASSWORD=my-strong-passphrase

# در production الزامی:
ADMIN_SESSION_SECRET=$(openssl rand -base64 32)
```

اگر `ADMIN_SESSION_SECRET` در production تعریف نشده باشد، برنامه
عمداً خطا می‌دهد. بی‌صدا با کلید پیش‌فرض کار نمی‌کند — چون آن کلید
در سورس عمومی است و هر کسی می‌توانست کوکی مدیر بسازد.

---

## 📋 آنچه هنوز باقی است

این کار **نشت رمز به مرورگر** را بست، اما هنوز فاز پوسته است:

- رمز متن ساده در `.env.local` است، نه هش در دیتابیس
- محدودیت نرخ در حافظهٔ process است — با ری‌استارت صفر می‌شود و
  روی چند instance مشترک نیست
- احراز هویت دومرحله‌ای (TOTP) وجود ندارد
- لاگ ورود ثبت نمی‌شود
- فقط یک حساب مدیر تعریف‌شدنی است

هیچ‌کدام مانع استفادهٔ محلی نیست، اما پیش از انتشار عمومی باید
رسیدگی شوند.
