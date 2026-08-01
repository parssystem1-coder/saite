# 🛠 عیب‌یابی نصب و اجرا

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
git pull origin arena/019fbe01-saite
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

## ⏳ خطای دانلود کند یا `error (23)`

### پیام خطا

```
[WARN] GET https://registry.npmjs.org/next/-/next-16.2.12.tgz
       error (23). Will retry in 1 minute.
Downloading next@16.2.12: 1.06 MB/34.52 MB
```

این خطای شبکه است، نه خطای پروژه. پکیج Next.js حدود **۳۵ مگابایت** و
کامپایلر SWC ویندوز حدود **۴۴ مگابایت** است.

### راه‌حل‌ها

**۱. صبر کنید** — pnpm خودکار تلاش مجدد می‌کند.

**۲. افزایش زمان انتظار:**

```bash
pnpm config set fetch-timeout 600000
pnpm config set fetch-retries 5
pnpm install
```

**۳. اگر اتصال ناپایدار است، از رجیستری آینه استفاده کنید:**

```bash
pnpm config set registry https://registry.npmmirror.com
pnpm install

# برای بازگشت به حالت عادی:
pnpm config set registry https://registry.npmjs.org
```

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
git pull origin arena/019fbe01-saite

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
git pull origin arena/019fbe01-saite
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
pnpm verify
```

خروجی مورد انتظار:

```
✓ type-check   بدون خطا
✓ lint         بدون خطا
✓ Tests        85 passed
✓ Build        38 صفحه
```

اگر همهٔ این‌ها سبز بود، پروژه کاملاً سالم است.
