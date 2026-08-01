# 🔀 راهنمای ادغام در main و به‌روزرسانی لپ‌تاپ

> **وضعیت فعلی:** PR شمارهٔ ۳ ساخته شده، CI سبز است و **بدون تعارض** آمادهٔ ادغام است.

---

## ✅ کارهایی که از قبل انجام دادم

| کار | وضعیت |
|---|:---:|
| ادغام `main` در برنچ و **حل تعارض `ci.yml`** | ✅ |
| اجرای `pnpm verify` پس از حل تعارض (۸۵ تست) | ✅ |
| پوش برنچ | ✅ |
| ساخت PR شمارهٔ ۳ با توضیحات کامل | ✅ |
| تأیید CI روی PR | ✅ سبز |
| تأیید وضعیت ادغام | ✅ `CLEAN` / `MERGEABLE` |

> 💡 یک تعارض واقعی در `.github/workflows/ci.yml` وجود داشت (نام‌گذاری مرحلهٔ
> Checkout). از قبل حلش کردم تا ادغام شما بدون دردسر باشد.

**آمار PR:** ۱۱۶ فایل تغییر، ۱۲٬۱۶۵ خط افزوده، ۱٬۱۲۷ خط حذف.

---

## 🖱 گام ۱: ادغام PR (با مرورگر — ساده‌ترین راه)

۱. این لینک را باز کنید:

   **https://github.com/parssystem1-coder/saite/pull/3**

۲. توضیحات را مرور کنید (خلاصهٔ کامل هر ۴ فاز آنجاست).

۳. دکمهٔ سبز **Merge pull request** را بزنید.

۴. **Confirm merge** را بزنید.

> ✅ چون CI سبز و وضعیت `CLEAN` است، دکمه بدون هشدار فعال خواهد بود.

### کدام نوع merge را انتخاب کنم؟

| گزینه | توصیه |
|---|---|
| **Create a merge commit** | ✅ **پیشنهاد من** — تاریخچهٔ کامل هر ۴ فاز حفظ می‌شود |
| Squash and merge | همهٔ ۱۸ کامیت به یکی تبدیل می‌شود؛ تاریخچه از دست می‌رود |
| Rebase and merge | تاریخچه بازنویسی می‌شود؛ برای این حجم توصیه نمی‌شود |

---

## 💻 گام ۱ (جایگزین): ادغام از طریق Git Bash

اگر ترجیح می‌دهید با دستور انجام دهید:

```bash
cd /d/saite

# مطمئن شوید همه‌چیز به‌روز است
git fetch origin

# رفتن به main
git checkout main
git pull origin main

# ادغام برنچ کاری
git merge origin/arena/019fbe01-saite --no-ff -m "Merge phases 1-4: office equipment store"

# ارسال به گیت‌هاب
git push origin main
```

> ⚠️ اگر پیام تعارض دیدید، متوقف شوید و به من بگویید. **نباید** تعارضی
> پیش بیاید چون از قبل حلش کردم.

---

## 📥 گام ۲: به‌روزرسانی لپ‌تاپ پس از ادغام

بعد از اینکه PR را merge کردید، در **Git Bash**:

```bash
cd /d/saite

# دریافت آخرین وضعیت از گیت‌هاب
git fetch origin

# رفتن روی main
git checkout main

# دریافت تغییرات ادغام‌شده
git pull origin main

# تأیید — باید کامیت merge را ببینید
git log --oneline -5
```

### خروجی مورد انتظار

```
xxxxxxx Merge pull request #3 from parssystem1-coder/arena/019fbe01-saite
be09a66 Merge remote-tracking branch 'origin/main' into arena/019fbe01-saite
04040bb fix: switch install fallback to npm, which resumes downloads
fae5677 fix: ASCII-only PS scripts and add resumable manual download
a2ef44c fix: harden network config and add retry script for Windows
```

### تأیید نهایی که همه‌چیز روی main است

```bash
ls src/lib/mock-data.ts src/lib/schemas.ts src/app/faq/page.tsx src/components/home/compatibility-finder.tsx
```

اگر هر چهار فایل را دید، ادغام کامل و موفق بوده است.

---

## 🧹 گام ۳ (اختیاری): حذف برنچ کاری

بعد از ادغام موفق، اگر خواستید برنچ را پاک کنید:

**در گیت‌هاب:** در همان صفحهٔ PR، دکمهٔ **Delete branch** ظاهر می‌شود.

**در لپ‌تاپ:**

```bash
git branch -d arena/019fbe01-saite
git remote prune origin
```

> 📌 عجله‌ای نیست. نگه داشتن برنچ ضرری ندارد.

---

## 🚀 گام ۴: اجرای پروژه

اگر هنوز `node_modules` را نصب نکرده‌اید:

```powershell
cd D:\saite
.\scripts\install-with-npm.ps1
```

سپس:

```powershell
npm run dev
```

و در مرورگر: **http://localhost:3000**

> اگر با pnpm نصب کردید، به‌جای `npm run dev` بنویسید `pnpm dev`.

---

## 📊 خلاصهٔ آنچه در این جلسه ساخته شد

| فاز | محتوا |
|---|---|
| **۰** | رفع ۶ بلاکر بیلد — پروژه از «بیلد نمی‌شود» به «سبز» رسید |
| **۱** | سیستم طراحی سه‌بعدی + مدل دادهٔ دامنه + ۲۸ محصول نمونه |
| **۲** | مگامنو، منوی موبایل، ابزار یافتن قطعهٔ سازگار، ۹ بخش صفحهٔ اصلی |
| **۳** | صفحهٔ محصول کامل، مقایسه، صفحه‌بندی، JSON-LD |
| **۴** | ۱۲ لینک شکسته رفع شد، Zod، علاقه‌مندی‌ها، محتوا |

**نتیجهٔ نهایی:**

```
✅ ۸۵ تست
✅ ۳۸ صفحهٔ استاتیک
✅ ۰ لینک شکسته
✅ ۰ خطای lint
✅ CI سبز
```

---

## ⚠️ آنچه هنوز باقی است (نیازمند بک‌اند)

این موارد **عمداً** انجام نشدند چون به سرور نیاز دارند:

| مورد | شدت |
|---|:---:|
| `/admin` هیچ محافظتی ندارد | 🔴 بحرانی |
| احراز هویت شبیه‌سازی‌شده است (رمز بررسی نمی‌شود) | 🔴 بحرانی |
| نقش کاربر در LocalStorage قابل جعل است | 🔴 بحرانی |
| پرداخت و ثبت سفارش وجود ندارد | 🔴 |
| فاز ۵ پوسته (دسترس‌پذیری، بهینه‌سازی تصویر، `error.tsx`) | 🟡 |

> 🔒 **مهم:** تا وقتی `middleware.ts` و NextAuth پیاده نشده‌اند، این سایت را
> روی اینترنت عمومی منتشر نکنید. تحلیل کامل در `docs/ARCHITECTURE_REVIEW.md`.
