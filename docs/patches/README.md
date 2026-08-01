# 🔧 پچ‌های نیازمند اعمال دستی

> 👈 **راهنمای گام‌به‌گام و کامل: [HOW-TO-FIX.md](./HOW-TO-FIX.md)**

فایل‌های این پوشه تغییراتی هستند که **ربات اجازهٔ اعمال خودکارشان را ندارد**.

GitHub App مورد استفاده فاقد دسترسی `workflows` است، بنابراین هر تغییری در
`.github/workflows/**` هنگام push رد می‌شود:

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/ci.yml` without `workflows` permission
```

---

## `ci.yml.proposed`

نسخهٔ اصلاح‌شدهٔ workflow است. **این تغییر بحرانی است** — فایل فعلی روی مخزن
از نظر نحوی نامعتبر است و به همین دلیل CI تا امروز **حتی یک بار هم اجرا نشده**
(هر دو run ثبت‌شده در ۰ ثانیه با failure پایان یافته‌اند).

### چه چیزی اصلاح می‌شود

| # | تغییر | چرا |
|:-:|-------|-----|
| ۱ | حذف خط اول `yaml` | این خط اضافی، فایل را از نظر YAML نامعتبر می‌کند و کل workflow را می‌شکند |
| ۲ | افزودن مرحلهٔ `pnpm test` | تست‌ها اصلاً در CI اجرا نمی‌شدند |
| ۳ | `pnpm install --frozen-lockfile` | جلوگیری از تغییر ناخواستهٔ lockfile در CI |
| ۴ | `branches: [main, 'arena/**']` | پوشش تمام برنچ‌های کاری به‌جای یک نام ثابت |

### نحوهٔ اعمال

```bash
cp docs/patches/ci.yml.proposed .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: fix invalid workflow YAML and add test step"
git push
```

> 💡 برای اینکه دفعهٔ بعد این محدودیت پیش نیاید، می‌توانید در تنظیمات GitHub App
> دسترسی `workflows` را فعال کنید.
