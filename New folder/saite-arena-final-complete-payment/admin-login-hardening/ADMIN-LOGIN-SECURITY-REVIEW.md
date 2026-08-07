# بازبینی امنیتی صفحه ورود مدیر Saite

## دامنه بازبینی

فایل‌های بررسی‌شده:

- `src/app/admin/login/page.tsx`
- `src/components/admin/admin-login-form.tsx`
- `src/lib/auth/admin-login-client.ts`
- `src/lib/auth/safe-redirect.ts`
- `src/lib/auth/server/admin-session.ts`
- `src/lib/auth/server/session-token.ts`
- `src/lib/auth/server/admin-secret.ts`
- `src/app/admin/(panel)/layout.tsx`
- `src/proxy.ts`
- `src/lib/auth/server/audit-log.ts`

## نتیجه اجرایی

نسخه جدید `page.tsx` عمداً هیچ‌کدام از `ADMIN_USERNAME`، `ADMIN_PASSWORD`،
`IS_DEMO_MODE` یا secretهای احراز هویت را import نمی‌کند. بنابراین صفحه ورود:

1. اعتبارنامه را داخل HTML رندر نمی‌کند.
2. اعتبارنامه را به Client Component نمی‌فرستد.
3. اعتبارنامه را در JavaScript مرورگر یا React props قرار نمی‌دهد.
4. فقط وضعیت نشست را سمت سرور می‌خواند و فرم را نمایش می‌دهد.

این تغییر یک ضعف واقعی را می‌بندد: نسخه قبلی در development نام کاربری و رمز کامل
را در HTML صفحه نمایش می‌داد. اگر dev server روی شبکه، tunnel یا preview عمومی در
دسترس باشد، هر بازدیدکننده‌ای رمز را می‌بیند. `NODE_ENV=development` مرز امنیتی
قابل اتکایی برای محیطی که از بیرون قابل دسترسی است نیست.

## چیزهایی که درست هستند

### نشست

- `httpOnly`: جاوااسکریپت مرورگر نمی‌تواند مقدار کوکی را بخواند.
- `SameSite=Strict`: ارسال cross-site کوکی را محدود می‌کند.
- `Path=/admin`: کوکی به مسیرهای فروشگاه ارسال نمی‌شود.
- `secure` در production: کوکی فقط روی HTTPS ارسال می‌شود.
- توکن با HMAC امضا و از نظر انقضا بررسی می‌شود.
- layout سرور دوباره `getAdminSession()` را بررسی می‌کند؛ proxy تنها مرز امنیتی نیست.

### redirect

مقدار فعلی شما:

```text
redirect=%2Fadmin
```

به `/admin` decode می‌شود و امن است. `safe-redirect.ts` موارد زیر را رد می‌کند:

- `https://evil.example`
- `//evil.example`
- `javascript:...`
- backslash و کاراکترهای کنترلی
- مسیرهایی که با `/admin` شروع کاذب دارند، مثل `/administration`

فرم فقط مسیرهای admin را قبول می‌کند و در غیر این صورت به `/admin` برمی‌گردد.

### اعتبارنامه

`admin-login-form.tsx` رمز را بررسی نمی‌کند و فقط به endpoint سرور درخواست می‌فرستد.
این تصمیم درست است: رمز نباید وارد bundle کلاینت شود.

### endpoint

Route Handler سمت سرور rate limit، اعتبارسنجی Zod، تأخیر شکست، TOTP و کوکی نشست
را مدیریت می‌کند. پاسخ‌های ورود باید همیشه `no-store` باشند.

## تغییرات اعمال‌شده در فایل جدید

### حذف کامل نشت development

از صفحه حذف شد:

```ts
import { ADMIN_PASSWORD, ADMIN_USERNAME } from '@/lib/auth/server/admin-secret'
import { IS_DEMO_MODE } from '@/lib/auth/demo-mode'
```

و کل بلوک نمایش credential نیز حذف شد. هیچ fallback نمایشی نباید در صفحه ورود باقی بماند.

### سخت‌گیری بیشتر روی metadata

`noarchive` و `nosnippet` اضافه شد. این جایگزین هدر HTTP نیست، اما به موتورهای جستجو
اعلام می‌کند صفحه ورود قابل آرشیو یا نمایش snippet نیست.

### جلوگیری از کش شدن صفحه

`dynamic = 'force-dynamic'` و `revalidate = 0` حفظ و صریح‌تر شد. توجه: برای تضمین
`Cache-Control: no-store` باید در `next.config.ts` یا لایه proxy نیز هدر HTTP تنظیم شود؛
metadata به‌تنهایی جلوی cache پراکسی را نمی‌گیرد.

### HTML معنایی و دسترسی‌پذیری

- `main` برای محتوای اصلی
- `section[aria-labelledby]` برای فرم
- `aside[aria-label]` برای پیام امنیتی
- `nav[aria-label]` برای پیوندها
- یک عنوان اصلی قابل فهم

## مواردی که این فایل به‌تنهایی حل نمی‌کند

### 1. رمز پیش‌فرض در سورس عمومی

حذف نمایش رمز از UI کافی نیست. اگر `ADMIN_PASSWORD` مقدار واقعی production نداشته باشد،
رمز پیش‌فرضی که در سورس/README آمده قابل استفاده است. در production باید:

```bash
npm run admin:hash-password
npm run admin:secret
npm run admin:check
```

و `ADMIN_PASSWORD` و `ADMIN_SESSION_SECRET` را در secret manager قرار دهید.
بهتر است برنامه در production با credential پیش‌فرض اصلاً اجازه ورود ندهد.

### 2. Origin/CSRF

`SameSite=Strict` دفاع خوبی است، اما endpointهای POST و DELETE باید علاوه بر آن
Origin را بررسی کنند. فقط `Origin`های برابر origin واقعی سایت را قبول کنید و در
صورت mismatch پاسخ `403` بدهید. درخواست‌های بدون Origin را بر اساس سیاست استقرار
خود تصمیم‌گیری کنید، نه کورکورانه قبول یا رد.

### 3. لاگ audit

فایل audit فعلی زیر `.next/cache` است. `.next` محل artifact بیلد است و با deploy ممکن
است پاک شود. مسیر لاگ را به volume پایدار خارج از `.next` منتقل کنید، مثلاً:

```env
AUDIT_LOG_PATH=/var/lib/saite/admin-audit.jsonl
```

دسترسی فایل را `0600` کنید و log rotation بگذارید. IP و User-Agent داده شخصی‌اند و
نباید بدون سیاست نگهداری مشخص بی‌نهایت ذخیره شوند.

### 4. rate limit چندنمونه‌ای

ذخیره‌سازی فایل‌محور روی یک instance قابل قبول است، اما در serverless یا چند container
مشترک نیست. برای scale افقی Redis یا rate limiter ارائه‌دهنده را جایگزین کنید.

### 5. هدرهای امنیتی

روی پاسخ‌ها این هدرها را اعمال کنید:

- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- HSTS فقط روی HTTPS production

## چک‌لیست تحویل به Arena

- [ ] `files/src/app/admin/login/page.tsx` جایگزین مسیر اصلی شود.
- [ ] در کل پروژه `ADMIN_PASSWORD` فقط در فایل‌های server-only بماند.
- [ ] جستجو برای نمایش رمز انجام شود:

```bash
rg "ADMIN_PASSWORD|saite-demo|IS_DEMO_MODE" src/app src/components
```

خروجی نباید شامل رندر credential در صفحه login باشد.

- [ ] جستجو برای import مستقیم secret از Client Component انجام شود.
- [ ] production با credential سفارشی تست شود.
- [ ] تست redirectهای خارجی و protocol-relative اجرا شود.
- [ ] با DevTools بررسی شود کوکی نشست `HttpOnly`, `Secure` در production و `SameSite=Strict` است.
- [ ] پاسخ صفحه و endpoint login با `Cache-Control: no-store` بررسی شود.
- [ ] در Network tab مقدار password فقط در body درخواست POST به endpoint امن دیده شود، نه در URL، query string یا HTML اولیه.

## تست دستی پیشنهادی

1. صفحه را در development باز کنید و View Source بگیرید: نباید رمز یا fallback credential وجود داشته باشد.
2. همین کار را با URL زیر انجام دهید:

```text
/admin/login?redirect=%2Fadmin
```

3. این ورودی‌ها را امتحان کنید و انتظار داشته باشید همگی به `/admin` fallback شوند:

```text
https://evil.example
//evil.example
javascript:alert(1)
/adminx
```

4. پس از ورود موفق، مقصد باید فقط `/admin` یا یکی از مسیرهای داخلی `/admin/...` باشد.
5. کوکی نشست را در Application/Storage بررسی کنید و مقدارش در document.cookie نباشد.

## جمع‌بندی

فایل جدید صفحه ورود از نظر نشت credential، trust boundary و HTML اولیه امن‌تر است.
اما امنیت واقعی یک زنجیره است: Route Handler، proxy، layout، cookie policy، secret
management، rate limit، audit log و هدرهای HTTP باید هم‌زمان درست باشند. صفحه ورود
خوب به‌تنهایی پنل امن نمی‌سازد؛ این نسخه حداقل دیگر خودش اطلاعات ورود را لو نمی‌دهد.
