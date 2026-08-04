# 🛠 عیب‌یابی نصب و اجرا

> **📌 پکیج منیجر پروژه: npm**
>
> بخش‌هایی از این سند تاریخچهٔ مشکلات pnpm را ثبت کرده‌اند. از
> ۳ اوت ۲۰۲۶، پروژه رسماً فقط با **npm** کار می‌کند:
> `pnpm-lock.yaml` حذف شده و CI با `npm ci` اجرا می‌شود.
> بخش‌های مربوط به pnpm فقط برای مرجع تاریخی مانده‌اند.


---

## ❌ خطای `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`

### پیام خطا

```
[ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION] 2 lockfile entries failed verification:
  @hookform/resolvers@5.6.0 was published at 2026-08-01T09:13:32Z,
    within the minimumReleaseAge cutoff
  react-hook-form@7.84.0 was published at 2026-08-01T01:28:52Z,
    within the minimumReleaseAge cutoff
```

### ✅ این خطا رفع شده است

اگر آخرین نسخهٔ مخزن را بگیرید، دیگر این خطا را نمی‌بینید:

```bash
git pull origin arena/019fc7c0-saite
# ترجیح روی ویندوز با اتصال ناپایدار:
npm install --no-audit --no-fund
# یا در صورت اتصال پایدار:
pnpm install
```

### چرا این اتفاق افتاد؟

**تقصیر Node یا ویندوز شما نبود.** موضوع کاملاً متفاوت است:

هنگام نصب Zod و React Hook Form، pnpm به‌طور خودکار **آخرین نسخه** را
برداشت — و آن نسخه‌ها **همان روز منتشر شده بودند**:

| بسته | نسخهٔ نصب‌شده | تاریخ انتشار |
|---|---|---|
| `react-hook-form` | 7.84.0 | ۱ اوت (همان روز) |
| `@hookform/resolvers` | 5.6.0 | ۱ اوت (همان روز) |

pnpm روی سیستم شما سیاستی به نام **`minimumReleaseAge`** فعال دارد که
بسته‌های تازه‌منتشرشده را رد می‌کند.

### این سیاست خوب است، نه بد

این یک محافظ امنیتی مهم در برابر **حملات زنجیرهٔ تأمین** است. اگر
حساب یک توسعه‌دهنده هک شود و نسخهٔ آلوده منتشر کند، معمولاً ظرف چند
ساعت کشف و حذف می‌شود. این سیاست باعث می‌شود شما هرگز آن پنجرهٔ خطر را
لمس نکنید.

> 💡 pnpm شما درست عمل کرد. من باید از ابتدا نسخهٔ پایدارتر انتخاب می‌کردم.

### راه‌حل اعمال‌شده

۱. نسخه‌ها به **پایدارترین نسخهٔ قبلی** برگردانده شدند:

```jsonc
"react-hook-form": "7.83.0",      // ۲۵ ژوئیه — پین دقیق، بدون ^
"@hookform/resolvers": "5.5.7",   // ۲۶ ژوئیه — پین دقیق، بدون ^
```

> نکته: `^` عمداً حذف شد. با `^7.83.0`، هنگام نصب دوباره ممکن بود
> pnpm سراغ 7.84.0 برود و همین خطا برگردد.

۲. فایل `.npmrc` به پروژه اضافه شد تا سیاست برای همهٔ اعضای تیم یکسان باشد.

۳. با نصب تمیز (`rm -rf node_modules` سپس `pnpm install --frozen-lockfile`)
تست شد و موفق بود. تمام ۸۵ تست هم با نسخهٔ قدیمی‌تر پاس می‌شوند.

---

## ⏳ خطای `error (23)` یا `TimeoutError` هنگام دانلود

### پیام خطا

```
[WARN] GET https://registry.npmjs.org/next/-/next-16.2.12.tgz
       error (23). Will retry in 1 minute. 1 retries left.
[23] The operation was aborted due to timeout
TimeoutError: The operation was aborted due to timeout

Downloading @next/swc-win32-x64-msvc@16.2.12: 12.88 MB/43.83 MB
Downloading next@16.2.12: 6.70 MB/34.52 MB
```

### ✅ تنظیمات لازم به پروژه اضافه شد

فایل `.npmrc` حالا شامل تنظیمات پایدارسازی دانلود است. کافی است
آخرین نسخه را بگیرید:

```bash
git pull origin arena/019fc7c0-saite
pnpm install
```

### چرا این اتفاق می‌افتد؟

این **خطای شبکه** است، نه خطای پروژه. دو بستهٔ Next.js بسیار حجیم‌اند:

| بسته | حجم فشرده | حجم بازشده |
|---|---:|---:|
| `next` | ۳۵ مگابایت | ~۱۵۵ مگابایت |
| `@next/swc-win32-x64-msvc` | ۴۴ مگابایت | — |

در لاگ شما دیده می‌شود که دانلود در **۱۲.۸ از ۴۳ مگابایت** قطع شده —
یعنی اتصال برقرار می‌شود اما قبل از پایان، مهلت تمام می‌شود.

### سه تنظیمی که اضافه شد

```ini
fetch-timeout=600000        # ۱۰ دقیقه به‌جای ۶۰ ثانیه
fetch-retries=5             # ۵ بار تلاش مجدد
network-concurrency=4       # ۴ دانلود هم‌زمان به‌جای ۱۶
```

> 💡 **مهم‌ترین‌شان `network-concurrency` است.** به‌طور پیش‌فرض pnpm
> ۱۶ فایل را هم‌زمان دانلود می‌کند. روی اتصال محدود، پهنای باند بین
> این ۱۶ تقسیم می‌شود و هیچ‌کدام قبل از مهلت کامل نمی‌شوند. با کاهش
> به ۴، فایل‌های بزرگ سهم بیشتری می‌گیرند و تمام می‌شوند.

### اگر باز هم قطع شد

**۱. عدد را بازهم کمتر کنید** (فقط ۲ دانلود هم‌زمان):

```bash
pnpm install --network-concurrency=2
```

**۲. اگر VPN یا پروکسی روشن است، خاموشش کنید** — اغلب پروکسی‌ها روی
فایل‌های بزرگ مهلت کوتاه‌تری اعمال می‌کنند.

**۳. نصب مرحله‌به‌مرحله** — ابتدا فقط بسته‌های سنگین:

```bash
pnpm add next@16.2.12
pnpm install
```

**۴. رجیستری آینه** (اگر دسترسی مستقیم به npm کند است):

```bash
pnpm config set registry https://registry.npmmirror.com
pnpm install

# بازگشت به حالت عادی پس از نصب:
pnpm config set registry https://registry.npmjs.org
```

**۵. ادامه از جایی که مانده** — نکتهٔ مهم: pnpm بسته‌های دانلودشده را
کش می‌کند. با اجرای دوبارهٔ `pnpm install`، از صفر شروع نمی‌کند و فقط
باقی‌مانده را می‌گیرد. پس چند بار اجرا کردن، کم‌کم کار را تمام می‌کند.

---

## 🔴 اگر دانلود با pnpm هرگز کامل نمی‌شود

### ✅ راه‌حل: از npm استفاده کنید

```powershell
cd D:\saite
.\scripts\install-with-npm.ps1
```

یا به‌صورت دستی:

```powershell
npm config set fetch-timeout 1800000
npm config set fetch-retries 10
npm config set maxsockets 3
npm install --no-audit --no-fund
```

### چرا npm جواب می‌دهد ولی pnpm نه؟

| | pnpm | npm |
|---|:---:|:---:|
| ادامهٔ دانلود ناقص | ❌ از صفر شروع می‌کند | ✅ ادامه می‌دهد |
| مهلت پیش‌فرض | ۶۰ ثانیه | طولانی‌تر |

شواهد از لاگ واقعی شما:

```
اجرا ۱: swc = 12.8 MB
اجرا ۲: swc = 20.6 MB
اجرا ۳: swc =  7.2 MB   ← برگشت به عقب
اجرا ۴: swc =  4.3 MB   ← باز هم از صفر
```

اتصال شما حدود ۲۰ مگابایت دوام می‌آورد. چون pnpm هر بار از صفر شروع
می‌کند، فایل ۴۴ مگابایتی **هرگز** کامل نمی‌شود — هرچقدر هم تلاش کنید.

> ✅ این روش در محیط تست اجرا شد: `npm install` هر ۵۱۳ بسته را نصب کرد
> و `next build` با موفقیت کامپایل شد.

### ⚠️ نکتهٔ مهم پس از نصب با npm

از این به بعد به‌جای `pnpm` از `npm run` استفاده کنید:

| به‌جای | بنویسید |
|---|---|
| `pnpm dev` | `npm run dev` |
| `pnpm build` | `npm run build` |
| `pnpm test` | `npm test` |
| `pnpm verify` | `npm run verify` |

> 📌 نگران نباشید: نسخهٔ بسته‌ها **دقیقاً یکسان** است. فقط ابزار
> دریافت فرق می‌کند. اگر روزی اتصال بهتری داشتید، می‌توانید
> `node_modules` را پاک کنید و دوباره با pnpm نصب کنید.

### روش آخر: دانلود با مرورگر

اگر npm هم شکست خورد، فایل‌ها را دستی بگیرید (مرورگرها resume دارند):

```
https://registry.npmjs.org/next/-/next-16.2.12.tgz
https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-16.2.12.tgz
```

سپس در پوشهٔ پروژه:

```powershell
npm cache add .\next-16.2.12.tgz
npm cache add .\swc-win32-x64-msvc-16.2.12.tgz
npm install --prefer-offline --no-audit --no-fund
```

---

## ⚠️ خطای PowerShell: `Unexpected token` یا `missing terminator`

### پیام خطا

```
At D:\saite\scripts\install-with-npm.ps1:25 char:1
+ }
Unexpected token '}' in expression or statement.
+ ... "  âœ… Ù†ØµØ¨ Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª" ...
The string is missing the terminator: '.
```

### علت

Windows PowerShell 5.1 فایل‌های `.ps1` را به‌صورت **ANSI** می‌خواند،
نه UTF-8 — مگر اینکه فایل BOM داشته باشد. در نتیجه متن فارسی داخل
اسکریپت خراب می‌شود و پارسر خطا می‌دهد.

### ✅ رفع شد

اسکریپت‌ها بازنویسی شدند و حالا **فقط انگلیسی (ASCII)** هستند.
آخرین نسخه را بگیرید:

```powershell
git pull origin arena/019fc7c0-saite
.\scripts\install-with-npm.ps1
```

> 📌 اگر خودتان اسکریپت PowerShell می‌نویسید، متن غیرانگلیسی در آن
> نگذارید یا فایل را با «UTF-8 with BOM» ذخیره کنید.

---

## 🗑 پاک‌سازی کامل و شروع دوباره

اگر همه‌چیز به هم ریخت، این ترتیب را در **Git Bash** اجرا کنید:

```bash
cd /d/saite

# ۱. حذف پوشهٔ وابستگی‌ها
rm -rf node_modules

# ۲. حذف کش Next.js
rm -rf .next

# ۳. گرفتن آخرین نسخهٔ سالم
git pull origin arena/019fc7c0-saite

# ۴. نصب دوباره
pnpm install

# ۵. اجرا
pnpm dev
```

> ⚠️ **فایل `pnpm-lock.yaml` را حذف نکنید.** این فایل تضمین می‌کند شما
> دقیقاً همان نسخه‌هایی را بگیرید که تست شده‌اند.

### در PowerShell (اگر Git Bash استفاده نمی‌کنید)

```powershell
cd D:\saite
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
git pull origin arena/019fc7c0-saite
pnpm install
pnpm dev
```

---

## 🔢 نسخهٔ Node شما

پروژه به **Node 22 یا بالاتر** نیاز دارد. برای بررسی:

```bash
node -v
```

### آیا Node خیلی جدید مشکل‌ساز است؟

شما پرسیدید آیا نسخهٔ خیلی جدید Node می‌تواند دلیل مشکل باشد.
**در این مورد خاص، نه** — خطای شما مربوط به سیاست امنیتی pnpm بود، نه Node.

اما به‌طور کلی: نسخه‌های **LTS زوج** (۲۲، ۲۴) پایدارترند. نسخه‌های فرد
(۲۳، ۲۵) نسخهٔ آزمایشی‌اند و برای پروژهٔ واقعی توصیه نمی‌شوند.

اگر `node -v` عدد فردی نشان داد، پیشنهاد می‌کنم آخرین LTS را نصب کنید.

---

## ✅ چک‌لیست سلامت

بعد از نصب موفق، این را اجرا کنید:

```bash
npm run verify
```

خروجی مورد انتظار:

```
✓ type-check   بدون خطا
✓ lint         بدون خطا
✓ Tests        231 passed (28 فایل)
✓ Build        65 صفحه
```

اگر همهٔ این‌ها سبز بود، پروژه کاملاً سالم است.
