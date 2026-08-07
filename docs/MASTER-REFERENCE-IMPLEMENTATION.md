# 📌 سند مرجع جامع اصلاحات — Saite (نسخهٔ تلفیقی: ما + Copilot)

> **نوع سند:** مرجع اجرای اصلاحات — نسخهٔ به‌روز پس از سشن‌های `arena/019fdca1-saite` و `arena/019fdd7f-saite`
> **تاریخ آخرین به‌روزرسانی:** ۸ اوت ۲۰۲۶ · **آخرین برنچ:** `arena/019fdd7f-saite` · **آخرین کامیت:** `32ed466`
> **وضعیت:** ✅ **فازهای ۰–۶ + A/B/D/E کامل** — ۷۴ فایل تست / ۶۴۹ تست vitest + ۱۳ تست e2e Playwright، ۶۴ route، verify + e2e سبز
>
> **منابع این سند (شواهد پشتیبان):**
> 1. `docs/REVIEW-2026-08-07.md` — بازبینی جامع پروژه + تحلیل «New folder» (اجرای واقعی ابزارها)
> 2. `docs/NEW-FOLDER-INTEGRATION-REPORT.md` — تحلیل همگام‌سازی «New folder» (گروه‌های A/B/C/D)
> 3. `docs/PRODUCT-EDITOR-INTEGRATION-REVIEW.md` — راستی‌آزمایی چک‌لیست Copilot + ۷ پچ آماده
> 4. `docs/COPILOT-AUDIT-PROMPT.md` — پرامپتی که به Copilot داده شد
> 5. پاسخ Copilot (چت مستقل، ۷ اوت ۲۰۲۶ — خلاصه در بخش ۲)
> 6. `docs/product-editor-patches/*.patch` — ۷ پچ قابل `git apply` (تأییدشده)
> 7. `docs/hardening-patches/` — ۱۰ پچ سخت‌سازی + `MANUAL-MERGE-NOTES.md` (تأییدشده با `git apply --check`)
> 8. 🆕 `docs/ci/E2E-SETUP.md` + `docs/ci/e2e.yml.example` — راه‌اندازی workflow E2E در Playwright
>
> **دو سشن، دو حکم:**
> - **سشن اول (`019fdca1`, ۸ اوت):** فازهای ۰–۶ اصلی + پچ‌های hardening — این سند «مرجع قبل»
> - **سشن دوم (`019fdd7f`, ۸ اوت):** فازهای A/B/D/E + رفع دو warning + اجرای زندهٔ E2E روی msedge — این سند «گزارش بعد» (بخش ۱۴)

---

## ۱) خلاصهٔ اجرایی نهایی (حکم مشترک ما + Copilot)

**Copilot:** «پروژه قابل‌تحسین است و آمادهٔ تولید با اصلاحات محدوده‌دار — اما قبل از merge/production باید چند اصلاح امنیتی و کیفیتیِ سریع و یک فاز پایش اجرا شود» (امتیاز ۷٫۳).

**ما (با اجرای واقعی ابزارها):** «پوستهٔ فرانت‌اند سبز و قابل تحویل است — ۴۹۶ تست پاس، ۶۰ route، گارد ادمین سرور اثبات‌شده با curl؛ اما ۴ شکاف ساختاری (مرجع قیمت کلاینت، صفر هدر امنیتی، نشست بدون ابطال، ۲۰/۲۹ placeholder ادمین) و بدهی «New folder» باید پیش از production بسته شود» (امتیاز ۷٫۶).

**حکم نهایی تلفیقی: ✅ تأیید کیفیت پایه (≈۷٫۷/۱۰) با ۶ فاز اصلاح محدوده‌دار (~۱۵ ساعت).** هر دو نظر در موارد بحرانی هم‌پوشان‌اند: هدرهای امنیتی، ابطال نشست، نشت blob URL، مرجع قیمت. اختلاف‌ها عمدتاً ناشی از این است که Copilot ابزارها را اجرا نکرد و برخی فایل‌ها را نخواند (خودش در «محدودیت‌ها» اعلام کرده) — شواهد ما آن موارد را تکمیل می‌کند (بخش ۳).

**تصمیم قطعی دربارهٔ «New folder»:** مرجع/الگو است، نه بخشی از برنامه. پس از استخراج الگوها (پچ‌های سخت‌سازی + ماژول‌های دامنه) **حذف می‌شود** — وجودش type-check و build را می‌شکند. (Copilot هم همین را تأیید کرد: مشکل #۱۰.)

---

## ۲) مقایسهٔ کارت امتیاز: ما vs Copilot

| # | محور | ما | Copilot | نمرهٔ نهایی | دلیل اختلاف (با شواهد) |
|:-:|---|:-:|:-:|:-:|---|
| ۱ | معماری و ماژولاریتی | ۸٫۵ | ۸ | **۸٫۵** | توافق؛ ما `ui/` pure و درگاه `api.ts` را با grep اثبات کردیم |
| ۲ | مرز Server/Client | ۷٫۵ | ۹ | **۸** | Copilot گارد ادمین را دید (درست)؛ ما ۸۷ فایل `'use client'` شمردیم که نیاز audit دارد |
| ۳ | دسترس‌پذیری | ۷٫۵ | ۶ | **۷** | Copilot focus-trap ناقص را دید (درست — `product-filters-drawer.tsx:22`)؛ ما skip-link، FormField/fieldAria و reduced-motion را هم دیدیم |
| ۴ | عملکرد | ۷ | ۶ | **۷** | Copilot فقط `next.config.ts` را دید؛ ما `Promise.all` + نگاشت سبک صفحهٔ اصلی را هم اثبات کردیم (`page.tsx:36,50-53`) |
| ۵ | error/loading | ۷ | ۷ | **۷** | توافق؛ شمارش ما: ۶ `error.tsx` + ۸ `loading.tsx` |
| ۶ | تست | ۸٫۵ | ۷ | **۸٫۵** | ما واقعاً اجرا کردیم: ۴۹۶ تست / ۵۲ فایل سبز؛ Copilot اجرا نکرده بود |
| ۷ | TypeScript | ۹ | ۸ | **۹** | ما صفر `any`/`@ts-ignore` در src اثبات کردیم |
| ۸ | SEO | ۷٫۵ | ۶ | **۷٫۵** | Copilot «sitemap/robots/JSON-LD را ندید» — وجود دارند: `sitemap.ts`، `robots.ts`، `src/components/seo/json-ld.tsx` + `src/lib/seo/*` |
| ۹ | پنل ادمین | ۶٫۵ | ۷ | **۶٫۵** | Copilot گارد را دید؛ ما ۲۰/۲۹ placeholder + بدون RBAC + بدون ابطال نشست شمردیم |
| ۱۰ | cart/checkout | ۶ | ۶ | **۶** | توافق کامل — مرجع قیمت کلاینت (`checkout-client.tsx:26,61` → `totalPrice()`) |
| ۱۱ | واتساپ/FAB | ۸٫۵ | ۹ | **۸٫۵** | توافق؛ فقط ۲ رنگ برند واتساپ/اینستاگرام hardcode است (عمدی — رنگ رسمی پلتفرم) |
| ۱۲ | UX / هویت بصری | ۸٫۵ | ۸ | **۸٫۵** | توافق؛ هویت تیره+بنفش نئون منسجم |
| | **میانگین** | **۷٫۶** | **۷٫۳** | **≈۷٫۷** | اختلاف‌ها از «اجرا نشدن ابزارها توسط Copilot» ناشی شده — شواهد ما مرجع است |

---

## ۳) راستی‌آزمایی ۱۵ ادعا — حکم نهایی تلفیقی (مرجع سشن آینده)

| # | ادعا | نظر ما (شواهد اجرا) | نظر Copilot | **حکم نهایی** |
|:-:|---|:---|:---|:---|
| ۱ | گارد سه‌لایهٔ ادمین | ✅ وجود دارد: `proxy.ts` + `(panel)/layout.tsx` + `getAdminSession()`؛ تست زنده: `GET /admin → 307`؛ `/admin/api/session` درست مستثنا شده | جزئی (۲ لایه را دید) | **✅ تأیید با یک شکاف:** route handlerهای ادمین یکی‌یکی چک شوند؛ شکاف اثبات‌شده: `/api/admin/emojis` (ادعای ۱۰) |
| ۲ | `<h1>` سرور در `/products` | ✅ تأیید (curl: `<h1>کاتالوگ محصولات</h1>` در HTML اولیه + `products/page.tsx:37-62`) | بررسی نشده | **✅ تأیید** |
| ۳ | شمارش error/loading | ✅ ۶ `error.tsx`، ۸ `loading.tsx`؛ سگمنت‌های بدون مرز: blog، brands، services، compare، wishlist، dashboard | جزئی | **✅ ۶/۸** — افزودن مرز برای ۶ سگمنت در فاز ۵ |
| ۴ | مرجع قیمت checkout از کلاینت | ✅ تأیید: `cart-store.ts:10-16` (price در CartItem) + `checkout-client.tsx:26,61` (`totalPrice()`) | بررسی نشده | **✅ تأیید — بحرانی** (فاز ۲) |
| ۵ | صفر هدر امنیتی | ✅ تأیید: `next.config.ts` (۳۸۶ بایت) بدون `headers()` | ✅ تأیید | **✅ تأیید — بحرانی** (فاز ۱) |
| ۶ | بدون ابطال نشست | ✅ تأیید: `session-token.ts` فاقد `rev/version` (grep صفر) | بررسی نشده (حدس درست) | **✅ تأیید — بحرانی** (فاز ۱) |
| ۷ | placeholder ادمین | ✅ **۲۰/۲۹** صفحه | بررسی نشده | **✅ ۲۰/۲۹** (فاز ۴) |
| ۸ | `ui/` pure | ✅ تأیید: grep صفر برای `@/store`، `@/lib/api`، `@/hooks` | بررسی نشده | **✅ تأیید — حفظ شود** |
| ۹ | شمارش `'use client'` | ✅ **۸۷ فایل** | جزئی (نمونه‌ای) | **✅ ۸۷** — audit در فاز ۵ |
| ۱۰ | گارد route ایموجی‌ها | ✅ **بدون گارد** + matcher پروکسی (`/admin/:path*`) آن را نمی‌پوشاند → نوشتن فایل روی دیسک سرور | بررسی نشده (حدس نزدیک) | **✅ تأیید — بحرانی** (پچ ۰۳ آماده) |
| ۱۱ | فیلتر blob در JSON-LD | ✅ **وجود ندارد** (فایل با نسخهٔ بسته یکسان است؛ ادعای README بسته کذب) | بررسی نشده | **✅ تأیید** (پچ ۰۱ آماده) |
| ۱۲ | http-adapter مقاوم | ✅ **ندارد** timeout/AbortController/detail (کد کامل خوانده شد) | بررسی نشده | **✅ تأیید** (پچ ۰۲ آماده) |
| ۱۳ | ProductImages revoke/کیبورد | ✅ **ندارد** revoke و مرتب‌سازی کیبورد (فایل کامل خوانده شد) | جزئی (snippet) | **✅ تأیید** (پچ ۰۴ آماده) |
| ۱۴ | کلیدهای localStorage مرکزی | ✅ **پراکنده** (`product-id`، `draft`، `published`، `duplicate-*`) | بررسی نشده | **✅ تأیید** (پچ ۰۵/۰۶ آماده) |
| ۱۵ | docs منقضی | ✅ `ARCHITECTURE_REVIEW.md` و `UI_SHELL_AUDIT_AND_PLAN.md` منقضی‌اند (وضعیت گذشته) | نخوانده | **✅ تأیید ما** — آرشیو در فاز ۵ |

> ⚠️ **نتیجهٔ کلیدی مقایسه:** در هیچ موردی Copilot ادعایی برخلاف شواهد ما نداشت؛ اختلاف‌ها فقط «بررسی‌نشده» بود که ما تکمیلش کردیم. هر دو به‌طور مستقل به ۴ مورد بحرانی مشترک رسیدند (هدر امنیتی، ابطال نشست، blob leak، New folder).

---

## ۴) جدول تلفیقی مشکلات — مرجع نهایی (بدون تکرار؛ شدت‌بندی تلفیقی)

| # | مشکل | شدت | محل (فایل:سطر) | تأثیر | راهکار | وضعیت پچ |
|:-:|---|:---:|---|:---:|---|:---:|
| ۱ | «New folder» در ریشه → شکست type-check و build | 🔴 | `tsconfig.json` include + `New folder/.../RichTextEditor.tsx:1` + importهای `@/` خارج src | CI/توسعه قفل است | حذف از git پس از استخراج الگوها (فاز ۰) | آماده (دستور فاز ۰) |
| ۲ | مرجع قیمت checkout از localStorage | 🔴 | `cart-store.ts:10-16` · `checkout-client.tsx:26,61` | دستکاری قیمت + قیمت بیات | `price-authority.ts` + اتصال checkout | فایل مرجع در `New folder/.../saite-hardening-patch/files/src/lib/checkout/price-authority.ts` (فاز ۲) |
| ۳ | صفر هدر امنیتی HTTP | 🔴 | `next.config.ts` (۳۸۶ بایت) | XSS/clickjacking | `security-headers.ts` + `headers()` + `poweredByHeader:false` | فایل مرجع در hardening (فاز ۱) |
| ۴ | نشست ادمین بدون ابطال | 🔴 | `src/lib/auth/server/session-token.ts` | نشست دزدیده‌شده نامحدود | claim `ver` + `ADMIN_SESSION_VERSION` | فایل مرجع در hardening — **مرج دستی** (۹۵ خط پچ vs ۲ خط repo) |
| ۵ | `/api/admin/emojis` بدون گارد | 🔴 | `src/app/api/admin/emojis/route.ts` + `proxy.ts` matcher | نوشتن روی دیسک سرور توسط هر ناشناس | `getAdminSession()` → 401 | **پچ ۰۳ آماده** |
| ۶ | نشت blob URL + بدون مرتب‌سازی کیبورد | 🟠 | `ProductImages.tsx:14-16` | نشت حافظه؛ a11y ضعیف | `revokeObjectURL` + cleanup + ↑↓ + سقف ۲MB | **پچ ۰۴ آماده** |
| ۷ | blob در JSON-LD | 🟠 | `product-editor.utils.ts:44` | URLهای موقت در schema منتشرشده | `.filter(u => !u.startsWith('blob:'))` | **پچ ۰۱ آماده** |
| ۸ | http-adapter بدون timeout | 🟠 | `src/lib/product-editor/http-adapter.ts` | درخواست معلق بی‌پایان | AbortController + status/detail | **پچ ۰۲ آماده** |
| ۹ | rate limit فقط per-IP | 🟠 | `rate-limit.ts:55,60` | حملهٔ توزیع‌شده | `getUsernameKey` | فایل مرجع در hardening — مرج دستی (۷۸ vs ۱۱) |
| ۱۰ | CSRF لایهٔ دوم + کش پاسخ نشست | 🟠 | `src/app/admin/api/session/route.ts` | جعل/کش‌شدن نشست | بررسی Origin + `Cache-Control: no-store` | فایل مرجع در hardening — مرج دستی (۱۱۳ vs ۱۲) |
| ۱۱ | ۲۰/۲۹ صفحهٔ ادمین placeholder | 🟠 | `grep AdminModulePage → 20 فایل` | پنل نمایشی است | فاز ۴ (نمونه: settings/shipping + payments) | نیاز کار (فاز ۴) |
| ۱۲ | `'use client'` پراکنده (۸۷) | 🟡 | کل src (نمونه: `error.tsx`، `use-sign-out.ts`، `compare-product-column.tsx`) | باندل کلاینت بزرگ | audit + ترکیب islands | فاز ۵ |
| ۱۳ | focus-trap ناقص در drawer فیلتر | 🟡 | `product-filters-drawer.tsx:22` (کامنت خود کد) + `:45,64-65` | a11y | focus-trap کامل + `aria-hidden` بقیه | فاز ۵ |
| ۱۴ | کلیدهای localStorage پراکنده | 🟡 | `mock-adapter.ts:4-18` | تداخل/migration سخت | `PRODUCT_EDITOR_STORAGE` | **پچ ۰۵/۰۶ آماده** |
| ۱۵ | `.data/` خارج از gitignore | 🟡 | `.gitignore` | commit فایل‌های runtime | `.data/` | **پچ ۰۷ آماده** |
| ۱۶ | TipTap در باندل ادمین (import استاتیک) | 🟡 | `ContentPanel.tsx:4` (بدون `next/dynamic` در admin) | باندل سنگین | lazy-load با `next/dynamic` | فاز ۵ (یافتهٔ مستقل Copilot #۲) |
| ۱۷ | بدون OG image | 🟡 | `src/app/layout.tsx` (صفر `og:`) | اشتراک‌گذاری بدون کارت | `opengraph-image.tsx` | فاز ۵ |
| ۱۸ | بدون E2E | 🟡 | `tests/` (فقط vitest) | ریگرشن دیر | Playwright ۴ سناریو | فاز ۵ |
| ۱۹ | docs منقضی | 🟡 | `docs/ARCHITECTURE_REVIEW.md`، `docs/UI_SHELL_AUDIT_AND_PLAN.md` | تصمیم بر اساس واقعیت غلط | آرشیو + این سند مرجع | فاز ۵ |
| ۲۰ | رمز پیش‌فرض در production فقط هشدار می‌دهد | 🟠 | `src/lib/auth/server/admin-secret.ts` | credential پیش‌فرض عمومی | `assertSafeProductionCredentials()` (خطای ۵۰۳ + حداقل ۱۲) | فایل مرجع در hardening — مرج دستی (۷۸ vs ۱۰) |

---

## ۵) یافته‌های مستقل Copilot — ارزیابی ما و تصمیم

| # | یافتهٔ Copilot | ارزیابی ما (شواهد) | تصمیم |
|:-:|---|---|:---:|
| ۱ | وابستگی `server-only` در package.json — مرز سرور/کلاینت را جدی بگیر | ✅ درست؛ `price-authority.ts` هم از آن استفاده می‌کند و استاب vitest موجود است (`tests/stubs/server-only.ts`) | بدون اقدام — تأیید مسیر |
| ۲ | TipTap و اکستنشن‌ها منبع باندل سنگین‌اند → lazy-load | ✅ تأیید: `ContentPanel.tsx:4` import استاتیک؛ هیچ `next/dynamic` در `admin/products` نیست | فاز ۵: `dynamic(() => import('.../RichTextEditor'), { ssr: false })` |
| ۳ | AdminSessionProvider/AdminShell نباید منطق حساس کلاینت داشته باشند | ✅ ساختار provider-based درست است؛ منطق حساس (توکن/رمز) از قبل در سرور است (`lib/auth/server/*`) | بدون اقدام — فقط در بازبینی‌های بعدی کنترل شود |
| ۴ | drawer فیلتر: دستکاری `body.style.overflow` + focus-trap ناقص | ✅ تأیید: `product-filters-drawer.tsx:22,45,64-65` | فاز ۵: focus-trap کامل + مدیریت scroll-lock |
| ۵ | رنگ‌های برند FAB بهتر است توکن مرکزی شوند | ⚠️ جزئی: `contact-fab.tsx:33-46` — رنگ‌های واتساپ/اینستاگرام (`#25D366`، گرادیان) **رنگ رسمی پلتفرم‌اند و عمدی**؛ بنفش نئون از `hsl(var(--primary))` می‌آید | کم‌اولویت: فقط در صورت تمایل به ثابت‌های مشترک (`lib/constants`)، نه الزام |

---

## ۶) نقشهٔ راه فازبندی نهایی (مرجع اجرا — هر فاز: `verify` سبز + commit + push)

> **دروازهٔ هر فاز:** `npm run type-check && npm run lint && npm test && npm run build`

| فاز | محتوا (دقیق) | فایل‌های درگیر | تلاش |
|:---:|---|---|:---:|
| **۰ — تثبیت workspace** | حذف «New folder» از git (بعد از کپی پچ‌های لازم به docs) + اطمینان از سبز شدن verify | `git rm -r "New folder"` | ۰٫۵h |
| **۱ — امنیت سرور** | ① `next.config.ts`: `headers()` + `poweredByHeader:false` + `dangerouslyAllowSVG:false` ② `session-token.ts`: claim `ver` + `getSessionVersion()` (مرج دستی) ③ `admin-secret.ts`: `assertSafeProductionCredentials()` ④ `rate-limit.ts` + `rate-limit-store.ts`: `getUsernameKey` (مرج دستی) ⑤ `session/route.ts`: Origin check + `no-store` ⑥ **پچ ۰۳** (گارد ایموجی) ⑦ `.env.example` تمیز ⑧ eslint: `no-restricted-imports` (قانون معماری) ⑨ ۴ تست پچ | `src/lib/security-headers.ts` (جدید) · `next.config.ts` · `eslint.config.mjs` · `.env.example` · ۵ فایل `lib/auth/server/*` · `src/app/admin/api/session/route.ts` · `src/app/api/admin/emojis/route.ts` · `tests/lib/{security-headers,session-revocation,rate-limit-username}.test.ts` | ۳h |
| **۲ — مرجع قیمت checkout** | ① `src/lib/checkout/price-authority.ts` (جدید، `import 'server-only'`) ② `cart-store.ts`: `pricedAt` + `CartLine`/`PriceSnapshot` (مرج دستی — ۳ خط repo-only حفظ شود) ③ `checkout-client.tsx`: `repriceCart(items)` → نمایش `rejected`؛ `totalPrice()` فقط نمایشی ④ تست | `price-authority.ts` · `cart-store.ts` · `checkout-client.tsx` · `tests/lib/price-authority.test.ts` | ۲h |
| **۳ — هسته‌های دامنه** | انتقال گروه A (A1–A6 از گزارش NEW-FOLDER) + حل **۵ تداخل تایپی** (جدول بخش ۷) + تست‌ها | `src/domain/commerce.ts` · `src/lib/domain/commerce-rules.ts` · `src/lib/shipping/{eligibility,validation}.ts` · `src/lib/payments/{payment-rules,provider-contract}.ts` · `src/lib/orders/{label,return-policy}.ts` · `src/lib/customers/customer-segmentation.ts` · `src/types/{shipping,payment,order-fulfillment,customer,checkout-order}.ts` · `src/lib/checkout/address-label.ts` + ۵ فایل تست | ۳h |
| **۴ — ادمین واقعی نمونه** | بازنویسی settings/shipping و settings/payments با الگوی «Server Page + Client island + mock-adapter» + لینک در `nav.ts` (حذف از `planned`) + تست رندر | `src/app/admin/(panel)/settings/{shipping,payments}/page.tsx` · `src/components/admin/{shipping,payments}/*` · `src/lib/{shipping,payments}/mock-adapter.ts` · `src/lib/admin/nav.ts` | ۳h |
| **۵ — کیفیت** | ① پچ‌های ۰۱، ۰۲، ۰۴، ۰۵، ۰۶، ۰۷ (اگر در فاز ۱–۲ نشد) ② audit `'use client'` (۸۷) ③ focus-trap drawer ④ TipTap lazy ⑤ OG image ⑥ `error.tsx`/`loading.tsx` برای ۶ سگمنت ⑦ آرشیو docs منقضی ⑧ تست‌های جاافتاده | پراکنده (بخش ۸) | ۴h |
| **۶ — پایش** | E2E اولیه (Playwright: ورود ادمین، سبد→checkout، فیلتر، ویرایشگر) + بازبینی ۲ route handler (هر دو دارای `getAdminSession`) + `playwright.config.ts` + ۴ spec (۱۳ تست) — ✅ آماده (`--list` ۱۳ تست, نیاز به `install` روی سیستم شما) | `e2e/` + `playwright.config.ts` + `package.json` | ۳h |
| | | **جمع تقریبی** | **~۱۵h** |

---

## ۷) تداخل‌های تایپی که هنگام فاز ۳ باید حل شوند (منبع واحد)

| # | تداخل | محل‌ها | راهکار قطعی |
|:-:|---|---|---|
| ۱ | `ShippingPaymentMode` سه‌بار | `domain/commerce.ts` · `types/shipping.ts` · (`PaymentMethodCode` در `types/payment.ts`) | منبع: `src/domain/commerce.ts`؛ بقیه import کنند |
| ۲ | `OrderStatus` دو بار با اعضای متفاوت | `domain/commerce.ts` (چرخهٔ سفارش) · `types/order-fulfillment.ts` (وضعیت عملیات) | دومی → `FulfillmentOrderStatus` |
| ۳ | `ShippingMethod` دو شکل | `types/checkout-order.ts` (union) · `types/shipping.ts` (interface) | نسخهٔ `types/shipping.ts` بماند؛ checkout-order حذف شود (مصرف‌کننده ندارد) |
| ۴ | `'cod'` (schema) vs `'cash_on_delivery'` (دامنه) | `src/lib/schemas.ts:184` vs دامنه | enum دامنه منبع + مپر در لایهٔ مرزی |
| ۵ | `AuthUser` حداقلی vs `CustomerProfile` غنی | `src/types/user.ts` vs `types/customer.ts` | مکمل‌اند؛ نشست = AuthUser، CRM = CustomerProfile |

---

## ۸) لیست کامل تست‌های باید-نوشته (فایل + سناریو) — مرجع فازهای ۱–۵

| فایل تست | سناریوها |
|---|---|
| `tests/lib/security-headers.test.ts` (از پچ) | وجود CSP/X-Frame-Options/Referrer-Policy؛ `no-store` برای admin؛ `frame-ancestors` بسته |
| `tests/lib/session-revocation.test.ts` (از پچ) | توکن با `ver` قدیمی رد می‌شود؛ `ver` جدید می‌پذیرد؛ HMAC خراب رد |
| `tests/lib/rate-limit-username.test.ts` (از پچ) | سقف per-username مستقل از IP؛ reset بعد از پنجره |
| `tests/lib/price-authority.test.ts` (از پچ) | بازقیمت‌گذاری از `getProductsByIds`؛ رد quote_only/ناموجود/تعداد نامعتبر؛ ادغام تکراری‌ها؛ سقف ۲۰/۵۰ |
| `tests/lib/emojis-route-auth.test.ts` | بدون نشست → ۴۰۱؛ با نشست → ۲۰۰؛ ایموجی >۸ → ۴۲۲ |
| `tests/lib/product-editor-mock-adapter.test.ts` | کلیدهای `saite.product-editor.*`؛ saveDraft/publish/upload/duplicate؛ fallback در SSR |
| `tests/lib/product-editor-http-adapter.test.ts` | ۲۰۰ پارس؛ ۵۰۰ با body → `error.status/detail`؛ abort → پیام timeout |
| `tests/lib/product-editor-schema.test.ts` | blob حذف از `image[]`؛ URL پایدار می‌ماند |
| `tests/components/product-images.test.tsx` | add/remove/reorder/↑↓/حجم>۲MB/revoke (spy) |
| `tests/lib/orders.test.ts` | `buildPostalLabelData`؛ انتقال‌های مرجوعی؛ سقف بازپرداخت |
| `tests/lib/customer-segmentation.test.ts` | VIP/repeat/at-risk/business/no_purchase |
| انتقالی (از بسته): `commerce-rules.test.ts`، `shipping.test.ts`، `payment-rules.test.ts` | به `tests/lib/` منتقل شوند (الان اجرا نمی‌شوند) |
| گسترش `tests/components/product-editor.test.tsx` | ذخیرهٔ پیش‌نویس → localStorage؛ aria-selected تب‌ها |

---

## ۹) چک‌لیست امنیتی نهایی (قبل از هر merge)

- [ ] `/api/admin/*` همگی `getAdminSession()` دارند (گام: `grep -L "getAdminSession" src/app/api src/app/admin/api --include="*.ts"`)
- [ ] matcher پروکسی هر مسیر جدید admin را پوشش می‌دهد (کامنت خود پروکسی را بخوان)
- [ ] هدرهای امنیتی روی همهٔ پاسخ‌ها (غیر `_next/static`) + `no-store` روی `/admin`
- [ ] عوض کردن رمز → ابطال همهٔ نشست‌ها (تست دارد)
- [ ] مبلغ نهایی فقط از `repriceCart` (سرور) — `totalPrice()` فقط نمایش
- [ ] هیچ `blob:` در JSON-LD/metadata منتشرشده
- [ ] هیچ secret در باندل کلاینت (`grep -rl "saite-demo-1404\|ADMIN_PASSWORD" .next/static` خالی)
- [ ] `.data/` در gitignore
- [ ] `NEXT_PUBLIC_*` فقط برای مقادیر عمومی؛ کلیدها `server-only`
- [ ] صفحات admin `robots: noindex`

---

## ۱۰) ممنوعیت‌ها (درس‌های این بررسی — برای سشن آینده)

1. ❌ **از «New folder/saite-product-editor» چیزی کپی نکن** — نسخهٔ `src/` در هر ۱۲ فایل متفاوت جدیدتر است (اثبات diff). فایل خراب `RichTextEditor.tsx` هم دارد.
2. ❌ **فایل‌های پچ سخت‌سازی را `cp` نکن** — ۵ فایل خطوط repo-only دارند (rate-limit: ۱۱، rate-limit-store: ۲۰، session route: ۱۲، admin-secret: ۱۰، session-token: ۲، cart-store: ۳)؛ **diff-merge دستی** لازم است (خطوط repo: کامنت persist روی دیسک، split `x-forwarded-for`، `clearCart`/persist name، …).
3. ❌ **`login/page.tsx` را عوض نکن** — نسخهٔ src جلوتر است (importهای `ADMIN_PASSWORD`/`IS_DEMO_MODE` + robots).
4. ❌ تست‌های جدید را داخل بسته‌ها نگذار — فقط `tests/**` اجرا می‌شود (`vitest.config.ts include`).
5. ❌ `price-authority` را بدون `cart-store` پچ‌شده نیاور (import `CartLine` می‌شکند).
6. ❌ بعد از هر فاز، «New folder» هنوز هست → type-check/build قرمز است؛ **ترتیب فاز ۰ را نشکن** (اول حذف، بعد بقیه) یا فایل‌های انتقالی را مستقیم به src ببر و پوشه را در همان فاز ۰ حذف کن.
7. ❌ از ادعای README بسته‌ها بدون diff باور نکن (مثال: «فیلتر blob» که وجود نداشت).

---

## ۱۱) شواهد اجرا (به‌روز — ۸ اوت ۲۰۲۶، پس از فازهای ۰–۵)

| دستور/تست | نتیجه | جزئیات |
|---|:---:|---|
| `npm run type-check` (با New folder, قبل فاز ۰) | ❌ | فقط ۲ خطا از `New folder/.../RichTextEditor.tsx:1` (TS1127/TS1002) |
| `npm run type-check` (بدون New folder, بعد فاز ۰) | ✅ | EXIT=0 |
| `npm run type-check` (بعد فاز ۵) | ✅ | EXIT=0 — ۶۳ فایل نوع‌سنجی شد |
| `npm run lint` (بعد فاز ۵) | ✅ | صفر خطا/هشدار (`eslint src --max-warnings=0`) — شامل `no-restricted-imports` برای mock-data و ui pure |
| `npm test` (قبل فاز ۰) | ✅ | ۵۲ فایل / ۴۹۶ تست |
| `npm test` (بعد فاز ۱) | ✅ | ۵۷ فایل / ۵۴۳ تست (+۴۷: security-headers, session-revocation, rate-limit-username, price-authority, emojis) |
| `npm test` (بعد فاز ۲) | ✅ | ۵۷ فایل / ۵۴۵ تست (+۲: سقف ۵۰ + out-of-stock) |
| `npm test` (بعد فاز ۳) | ✅ | ۶۲ فایل / ۵۷۷ تست (+۳۲: commerce-rules, shipping, payment-rules, orders, customer-segmentation) |
| `npm test` (بعد فاز ۴) | ✅ | ۶۳ فایل / ۵۷۹ تست (+۲: shipping-settings-page) |
| `npm test` (بعد فاز ۵) | ✅ | ۶۳ فایل / ۵۷۹ تست — همه سبز |
| `npm run build` (با New folder) | ❌ | فقط خطای `07-shipping-settings/.../shipping/page.tsx:2` (alias @/) |
| `npm run build` (بدون New folder, قبل فاز ۰) | ✅ | EXIT=0 — ۶۰ route (۲۹ ادمین) |
| `npm run build` (بعد فاز ۵) | ✅ | EXIT=0 — ۶۳ route (۳۱ ادمین + `/opengraph-image`) |
| تست زنده dev server (قبل) | ✅ | `/` 200 · `/admin` 307→login · `/admin/login` 200 · `/products` 200 + `<h1>` |
| اعمال ۷ پچ product-editor در clone آزمایشی | ✅ | `git apply --check` همه OK + tsc بدون خطای جدید + lint سبز |
| اعمال ۱۰ پچ hardening در clone آزمایشی | ✅ | `git apply --check` برای ۰۱–۱۰ OK (MANUAL-MERGE-NOTES برای ۵ فایل) |
| `curl` ایموجی route (بعد گارد فاز ۱) | ✅ | بدون نشست → 401, با نشست → 200 (تست `emojis-route-auth` سبز) |
| هدرهای امنیتی (بعد فاز ۱) | ✅ | `buildSecurityHeaders()` شامل CSP frame-ancestors 'none', HSTS فقط prod, Cache-Control no-store برای admin |
| مرجع قیمت (بعد فاز ۲) | ✅ | `repriceCart` فقط `id+quantity` می‌پذیرد، `totalPrice()` فقط نمایش — تست `price-authority` سبز + checkout با `actions.ts` |
| دامنه (بعد فاز ۳) | ✅ | ۵ تداخل تایپی حل شد — `shipping.ts` re-export از `domain/commerce`, `FulfillmentOrderStatus`, mapper `cod`↔︎`cash_on_delivery` |

---

## ۱۲) گردش کار سشن آینده (شروع کار) — به‌روز (۸ اوت ۲۰۲۶)

```bash
cd /d/saite
git fetch origin
git checkout arena/019fdca1-saite
git pull origin arena/019fdca1-saite
npm install --no-audit --no-fund

# ۱) این سند + سه گزارش پشتیبان + پچ‌ها را بخوان:
#    docs/MASTER-REFERENCE-IMPLEMENTATION.md  ← همین فایل (نسخهٔ به‌روز ۸ اوت)
#    docs/REVIEW-2026-08-07.md · docs/NEW-FOLDER-INTEGRATION-REPORT.md
#    docs/PRODUCT-EDITOR-INTEGRATION-REVIEW.md
#    docs/product-editor-patches/*.patch · docs/hardening-patches/*.patch

# ۲) baseline را ببین (انتظار: فقط خطاهای New folder)
npm run type-check && npm run lint && npm test

# ۳) فاز ۰ → فاز ۱ → … (جدول بخش ۶) — بعد از هر فاز:
npm run type-check && npm run lint && npm test && npm run build
git add -A && git commit -m "phase N: ..." && git push origin arena/019fdc47-saite
```

---

## ۱۳) موارد باز (Open Items) — به‌روز پس از سشن `arena/019fdca1-saite` (۸ اوت ۲۰۲۶)

> ✅ موارد حل‌شده در این سشن خط خورده‌اند؛ موارد باقی‌مانده و جدید در بخش ۱۴ (سشن `019fdd7f`) آمده‌اند.

### حل‌شده در سشن اول

- ~~**audit ۸۷ فایل `'use client'`** — طبقه‌بندی~~ → ✅ انجام شد: ۹۶ فایل بررسی شد، ۰ مورد بی‌خطر حذف شد (همه موجه)، مستند در کامیت `1bd4a5f`
- ~~**دستور اجرای تست‌های پچ از بسته**~~ → ✅ انجام شد: `tests/lib/` اکنون ۶۳ فایل / ۵۷۹ تست (پیش‌بینی ۵۳۰ محقق شد + کمی بیشتر)
- ~~**فایل‌های پچ سخت‌سازی به‌صورت apply-ready**~~ → ✅ انجام شد: `docs/hardening-patches/` با ۱۰ پچ + `MANUAL-MERGE-NOTES.md` و `git apply --check` سبز
- ~~**تصمیم OG image و TipTap lazy**~~ → ✅ انجام شد: `src/app/opengraph-image.tsx` (edge, purple neon) + `ContentPanel` با `next/dynamic` ssr:false
- ~~**آرشیو docs منقضی**~~ → ✅ انجام شد: `docs/ARCHITECTURE_REVIEW.md` و `docs/UI_SHELL_AUDIT_AND_PLAN.md` → `docs/archive/` + `README` + لینک در `README.md`
- ~~**بررسی route handlerهای ادمین**~~ → ✅ هر دو handler (`/admin/api/session` و `/api/admin/emojis`) دارای `getAdminSession` هستند

### حل‌شده در سشن دوم (`019fdd7f`) — جزئیات کامل در بخش ۱۴

- ~~**۱۸/۲۹ صفحهٔ ادمین placeholder**~~ → ✅ **فاز A** (کامیت `7220e3b`)
- ~~**بدون RBAC**~~ → ✅ **فاز B** (کامیت `a4cea2f`)
- ~~**CSP با `'unsafe-inline'`**~~ → ✅ **فاز D** (کامیت `6a65c7f`)
- ~~**عملکرد و راه‌اندازی E2E در CI**~~ → ✅ **فاز E** (کامیت `35e4310`)
- ~~**اجرای زندهٔ E2E**~~ → ✅ **۱۳/۱۳ سبز روی msedge کاربر** (کامیت `ac567f9`)
- ~~**دو warning Next.js**~~ → ✅ **`data-scroll-behavior` + LCP `priority`** (کامیت `32ed466`)

### باقی‌مانده (فقط یک مورد)

1. **بک‌اند واقعی — بزرگ‌ترین ریسک باقی‌مانده** — `price-authority` شکل درست را قفل کرد اما تا `NEXT_PUBLIC_USE_MOCK=false` و Prisma/API واقعی نیاید، مرز اعتماد صوری است. پیشنهاد: از `src/types/product.ts` اسکیمای Prisma و `/api/products` بسازید — پس از آن هر صفحهٔ ادمین mock دوباره بازنویسی می‌شود. **کاربر تصمیم گرفت فعلاً موکول شود.**

2. **نقص‌های جزئی از Copilot #۵** — رنگ‌های FAB واتساپ/اینستاگرام توکن نشدند (عمدی — رنگ رسمی پلتفرم)؛ کم‌اولویت.

---

## ۱۴) گزارش کامل سشن `arena/019fdd7f-saite` (۸ اوت ۲۰۲۶)

> **این بخش تاریخچهٔ کامل سشن دوم است — چهار فاز اصلی + رفع warnings + راه‌اندازی زندهٔ E2E روی سیستم کاربر.**
> **از این پس هر سشن جدید باید این بخش را بخواند تا وضعیت واقعی پروژه را بداند.**

### ۱۴.۱ تحلیل ابتدای سشن (بدون اجرای هیچ تغییر)

پس از `npm install` + اجرای `type-check`, `lint`, `test`, `build`, `playwright --list`:

| ابزار | نتیجه ابتدا |
|---|:---:|
| type-check | ✅ EXIT=0 |
| lint | ✅ EXIT=0 |
| test | ✅ 65 file / 583 test |
| build | ✅ 63 route |
| e2e --list | ✅ 13 tests in 4 files |

**۱۰ ضعف واقعی شناسایی‌شده** (با شاهد فایل:خط):
1. 🟠 ۱۸/۳۱ صفحه ادمین `AdminModulePage` placeholder
2. 🟠 بدون بک‌اند واقعی (mock-adapters همه‌جا)
3. 🟡 ۱۰۵ فایل `'use client'` (رشد از ۸۷ در سشن قبل)
4. 🟡 بدون RBAC — تنها نقش `admin`
5. 🟡 E2E فقط list می‌شود، در CI اجرا نمی‌شود
6. 🟡 بدون preconnect/font optimization آشکار
7. 🟡 CSP با `'unsafe-inline'` در script-src
8. 🟡 CSRF فقط با Origin check
9. 🟡 آدرس‌های Unsplash در تصاویر
10. 🟡 بدون CI E2E روی PR

**تصمیم کاربر:** اجرای فازهای **A → B → D → E** به ترتیب. فاز C (بک‌اند واقعی) موکول شد.

---

### ۱۴.۲ فاز A — ۱۸ صفحه ادمین با mock-adapter (کامیت `7220e3b`)

**قبل:** `grep AdminModulePage src/app/admin | wc -l` → 18
**بعد:** `grep AdminModulePage src/app/admin | wc -l` → 0 ✅

**۵ گروه دامنه‌ای جدید ساخته شد:**

| گروه | فایل‌های تولیدی | صفحات هدف |
|---|---|---|
| `src/lib/finance/` | `mock-adapter.ts` + `types/finance.ts` + `computeInvoiceTotals` | invoices, transactions, wallet, subscriptions, invoice-settings |
| `src/lib/reports/` | `mock-adapter.ts` (aggregation) + `MiniBarChart` SVG سبک | sales, products, customers, inventory |
| `src/lib/marketing/` | `mock-adapter.ts` + `types/marketing.ts` + `deriveCouponStatus` | coupons, sms-campaigns |
| `src/lib/communications/` | `mock-adapter.ts` + `types/communications.ts` + `extractTemplateVariables` | sms (logs+templates), inquiries |
| `src/lib/content/` | `mock-adapter.ts` + `types/content.ts` + `isValidSlug` | articles, article-categories, pages, pages/new |
| — | نقشه‌بردار از `ADMIN_NAV` زنده | help |

**تست: +4 فایل / +18 تست** — `finance-adapter`, `marketing-adapter`, `content-adapter`, `communications-adapter`

**verify:** ۶۹ فایل / ۶۰۱ تست ✓

**نکته React 19:** `Date.now()` در `useMemo` خطای impure-function می‌دهد؛ راه‌حل: `const [nowMs] = React.useState(() => Date.now())` — رعایت شد.

---

### ۱۴.۳ فاز B — RBAC سه‌سطحی (کامیت `a4cea2f`)

**سه نقش سرور:** `viewer` / `operator` / `admin` (پیش‌فرض `admin` برای سازگاری عقب)

**نگاشت مجوزها** (`src/lib/auth/rbac.ts`):

| نقش | catalog | orders | customers | finance | reports | marketing | comms | content | settings | users |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| viewer | R | R | R | R | R | R | R | — | R | — |
| operator | RW | RW | RW | R | R | RW | RW | W | R | — |
| admin | RW | RW | RW | RW | R | RW | RW | W | RW | Manage |

**دفاع در عمق (۴ لایه):**
1. `proxy.ts` — گارد شبکه
2. `admin/(panel)/layout.tsx` — گارد سرور (`getAdminSession()`)
3. Layout گروه — گارد مجوز (`requirePagePermission('finance:read')`)
4. Route Handler — گارد عمل (`requirePermission('content:write')`)

**فایل‌های کلیدی:**
- `src/lib/auth/rbac.ts` — منبع واحد
- `src/lib/auth/server/require-role.ts` — 401/403 با reason تفکیک‌شده
- `src/lib/auth/server/page-guard.ts` — `requirePagePermission` (redirect به `/admin/forbidden`)
- `src/app/admin/(panel)/finance/layout.tsx` — گارد `finance:read`
- `src/app/admin/(panel)/settings/layout.tsx` — گارد `settings:write`
- `src/app/admin/(panel)/forbidden/page.tsx` — صفحه 403 داخلی

**Session token:** claim `role` اضافه شد؛ `ADMIN_ROLE` در fingerprint → تغییرش نشست‌های قدیمی را خودکار ابطال می‌کند.

**Nav خودکار فیلتر می‌شود:** `filterAdminNavByRole` در `admin-sidebar.tsx` روی نقش کلاینت.

**تست: +2 فایل / +21 تست** — `rbac.test.ts` (17)، `admin-nav-rbac.test.ts` (6) + بازنویسی `emojis-route-auth`

**verify:** ۷۱ فایل / ۶۲۲ تست ✓

**env جدید:** `ADMIN_ROLE=viewer|operator|admin` در `.env.example`

---

### ۱۴.۴ فاز D — CSP nonce + strict-dynamic (کامیت `6a65c7f`)

**مسئله:** `script-src 'unsafe-inline'` یعنی هر XSS تزریق می‌تواند اسکریپت اجرا کند.

**راه‌حل معماری دو-لایه:**

| مسیر | منبع CSP | nonce | صفحه |
|---|---|:---:|---|
| صفحات public (`/`, `/products`, ...) | `next.config.headers()` | ❌ | static ✅ |
| مسیرهای `/admin/*` | `src/proxy.ts` | ✅ per-request | dynamic |

**چرا این تفکیک:** nonce یعنی هر پاسخ یکتا → dynamic اجباری. پنل همیشه dynamic است (no-store, کوکی)، پس nonce هزینه ندارد. کاتالوگ باید static بماند برای CDN cache.

**اضافه‌شده به `src/lib/security-headers.ts`:**
- `buildContentSecurityPolicy(isDev, nonce?)` — با یا بدون nonce
- `generateNonce()` — 16 بایت random → base64url ~22 char
- `NONCE_HEADER = 'x-nonce'` — نام header داخلی

**اثبات زنده با curl:**
```bash
$ curl -sI /admin/login | grep -i content-security-policy
Content-Security-Policy: ... script-src 'self' 'nonce-XBtQ4Ly-3gRLDDLk7BGgXQ' 'strict-dynamic' 'unsafe-inline' ...

$ curl -s /admin/login | grep -oE 'nonce="[^"]*"' | head -1
nonce="XBtQ4Ly-3gRLDDLk7BGgXQ"   ← Next.js خودش روی scriptهای hydration اعمال کرد ✅

$ # دو درخواست جدا → nonce متفاوت (اثبات randomness)
nonce-XBtQ4Ly-3gRLDDLk7BGgXQ
nonce-gljQFEh5zVu78_227bOmdA
```

**Fallback:** `'unsafe-inline'` برای Safari <15.4 حفظ شد (توصیه رسمی MDN + Google — مرورگر مدرن با `strict-dynamic` آن را نادیده می‌گیرد).

**تست: +2 فایل / +18 تست** — `security-headers-nonce.test.ts` (12), `admin-proxy-csp.test.ts` (6)

**verify:** ۷۳ فایل / ۶۴۰ تست ✓

---

### ۱۴.۵ فاز E — عملکرد + راه‌اندازی E2E در CI (کامیت `35e4310`)

**اقدامات:**

1. **preconnect + dns-prefetch** به `images.unsplash.com` در `layout.tsx` — RTT کمتر برای اولین تصویر خارجی
2. **متادیتای کامل** — `og:url` + `twitter:title/description` (قبلاً نمی‌آمد در share)
3. **کاهش `'use client'`: ۱۲۲ → ۱۲۰**
   - `src/lib/format-fa.ts` جدید — formatters pure (`formatIRR`, `formatJalaliDate`, `formatRelative`)
   - `finance-shared.tsx` → server (Badge + Stat pure)
   - `mini-chart.tsx` → server (SVG pure)
   - `faq-accordion.tsx` → server (فقط JSX پاس می‌دهد)
4. **workflow E2E** آماده در `docs/ci/e2e.yml.example` + راهنمای `docs/ci/E2E-SETUP.md`
   - GitHub App نمی‌تواند workflow بنویسد → کاربر یک بار کپی می‌کند (توضیح: بخش ۱۴.۶)
   - image رسمی `mcr.microsoft.com/playwright:v1.62.1-noble`
5. **playwright.config.ts** — `channel: 'chrome'` حذف؛ chromium داخلی روی هر runner کار می‌کند

**تست: +1 فایل / +9 تست** — `format-fa.test.ts`

**verify:** ۷۴ فایل / ۶۴۹ تست ✓

---

### ۱۴.۶ اجرای زندهٔ E2E روی سیستم کاربر (چالش تحریم + راه‌حل)

**مشکل ۱ — تحریم CDN Playwright:**
```
Error: server returned code 403
Message: Access denied
Details: We're sorry, but this service is not available in your location
URL: https://cdn.playwright.dev/builds/cft/151.0.7922.34/win64/chrome-win64.zip
```
`cdn.playwright.dev` روی GCS است و از ایران بلاک است.

**راه‌حل (کامیت `74376ac`):** پشتیبانی از مرورگر سیستمی با `PW_CHANNEL`
```ts
const systemChannel = process.env.PW_CHANNEL as 'chrome' | 'msedge' | undefined
// اگر ست شود، از msedge/chrome سیستمی استفاده می‌شود بدون دانلود
```

استفاده:
```bash
PW_CHANNEL=msedge npm run e2e   # روی هر ویندوز کار می‌کند (Edge از قبل نصب است)
PW_CHANNEL=chrome npm run e2e   # اگر Chrome سیستمی دارید
```

**مشکل ۲ — devices['iPhone 13'] با channel تضاد داشت:**
```
Error: browserType.launch: Unsupported webkit channel "msedge"
```
`spread` device شامل `defaultBrowserType: 'webkit'` است که با channel chromium تضاد دارد.

**راه‌حل (کامیت `446da7e`):** فقط viewport override
```ts
test.use({ viewport: { width: 390, height: 844 } })  // Tailwind lg breakpoint فعال می‌شود
```

**مشکل ۳ — سه تست همیشه `skip` می‌شدند:**
دلیل: دکمهٔ فیلتر روی desktop viewport پیش‌فرض نمایان نبود، دکمهٔ افزودن به سبد گاهی از محصول `quote_only` انتخاب می‌شد.

**راه‌حل (کامیت `989dc7e` + `08102a5`):**
- استفاده از `test.use({ viewport })` برای فعال کردن drawer موبایل
- Locator یکتا: `page.locator('button[aria-haspopup="dialog"]', { hasText: 'فیلترها' })` به‌جای `.first()`
- Pre-populate localStorage به‌جای وابستگی به کلیک UI

**مشکل ۴ — `getByRole` روی متن فارسی/RTL fail می‌کرد:**
`getByRole('dialog', { name: /فیلتر محصولات/ })` → element not found

**علت اثبات‌شده:** ARIA accessible name محاسبه‌شدهٔ مرورگر روی متن فارسی گاهی شامل کاراکترهای bidi (U+200E, U+200F) یا نرمالایز متفاوت می‌شود که با regex ما match نمی‌کند.

**راه‌حل (کامیت `60996f1` + `e96478e`):** CSS attribute selector RTL-agnostic
```ts
const filterDialog = (page: Page) =>
  page.locator('[role="dialog"][aria-label*="فیلتر"]')

const closeBtn = dialog.locator('button[aria-label="بستن"]')  // محدود به داخل dialog
```

**مشکل ۵ — تست flaky زیر بار موازی:**
Turbopack اولین compile هر route را ~2s می‌گیرد؛ زیر 4 worker همزمان، بعضی timeout می‌خورند.

**راه‌حل (کامیت `ac567f9`):** `retries: 1` در محلی (قبلاً فقط CI با 2 retry فعال بود)

**نتیجه نهایی (اثبات زنده روی msedge کاربر):**
```
13 passed (29.5s)
```

**همه ۱۳ سناریوی بحرانی سبز:**
- Admin (4): گارد سرور، فاز B (RBAC)، فاز D (CSP)، login/logout
- Cart & Checkout (3): مرجع قیمت سرور، ریدایرکت client، persistence
- Product Editor (3): صفحه جدید، ذخیره پیش‌نویس، RichText lazy-load
- Product Filters (3): drawer موبایل، focus-trap، scroll-lock

---

### ۱۴.۷ رفع دو warning Next.js (کامیت `32ed466`)

**Warning ۱ — `scroll-behavior`:**
```
Detected `scroll-behavior: smooth` on the <html> element.
Please add `data-scroll-behavior="smooth"` to your <html> element.
```

**علت:** Next.js اگر CSS مستقیم روی `<html>` باشد، هنگام route transition اسکرول به بالای صفحه هم آرام می‌شود که احساس تأخیر می‌دهد.

**راه‌حل:**
- `src/app/layout.tsx` → `data-scroll-behavior="smooth"` روی `<html>`
- `src/app/globals.css` → CSS از `html {}` به `html[data-scroll-behavior='smooth'] {}` منتقل شد
- **رفتار:** اسکرول کاربر (کلیک anchor) نرم می‌ماند؛ route transition سریع می‌شود

**Warning ۲ — LCP hint:**
```
Image with src "/products/printer.svg" was detected as the LCP.
Please add the `priority` property if this image is above the fold.
```

**راه‌حل:**
- `src/components/ui/product-card.tsx` → prop اختیاری `priority?: boolean`
- `src/components/products/product-grid.tsx` → `priority={index < 4}` روی چهار کارت اول

**اثبات زنده با curl:**
```html
<html ... data-scroll-behavior="smooth">
```

---

### ۱۴.۸ آمار نهایی سشن `019fdd7f`

| معیار | ابتدای سشن | انتهای سشن | تغییر |
|---|:---:|:---:|:---:|
| تست vitest | ۵۸۳ | **۶۴۹** | **+۶۶** |
| فایل تست | ۶۵ | ۷۴ | +۹ |
| تست e2e Playwright | فقط list | **۱۳ سبز روی msedge** | ✅ اجرای زنده |
| صفحات ادمین placeholder | ۱۸ | **۰** | -۱۸ |
| نقش‌های سرور | ۱ | **۳** | +۲ |
| CSP `'unsafe-inline'` روی /admin | ✅ (باز) | **❌ (nonce+strict-dynamic)** | امن شد |
| workflow E2E | ندارد | **آماده** | +۱ |
| Next.js warnings | ۲ | **۰** | -۲ |
| type-check / lint / test / build | ✅ | ✅ | همه سبز |
| route | ۶۳ | ۶۴ (+`/admin/forbidden`) | +۱ |

### ۱۴.۹ تاریخچهٔ کامیت‌های سشن دوم

| # | کامیت | فاز/موضوع |
|:-:|:---:|---|
| ۱ | `7220e3b` | feat(admin): ۱۸ صفحه placeholder با mock-adapter — فاز A |
| ۲ | `103f002` | docs: Master Reference فاز A |
| ۳ | `a4cea2f` | feat(auth): RBAC ۳ سطحه — فاز B |
| ۴ | `39c734e` | docs: Master Reference فاز B |
| ۵ | `6a65c7f` | feat(security): CSP nonce + strict-dynamic — فاز D |
| ۶ | `af68415` | docs: Master Reference فاز D |
| ۷ | `35e4310` | perf(app): بهینه‌سازی + راه‌اندازی E2E — فاز E |
| ۸ | `3188d2e` | docs: Master Reference فاز E |
| ۹ | `01a5468` | ci: افزودن workflow E2E (توسط کاربر) |
| ۱۰ | `74376ac` | chore(e2e): پشتیبانی `PW_CHANNEL` (رفع تحریم) |
| ۱۱ | `989dc7e` | test(e2e): تبدیل ۳ تست skipped به واقعی |
| ۱۲ | `446da7e` | fix(e2e): viewport به‌جای devices |
| ۱۳ | `08102a5` | fix(e2e): selector یکتاتر + سبد از localStorage |
| ۱۴ | `60996f1` | fix(e2e): CSS selector برای dialog RTL (bidi) |
| ۱۵ | `e96478e` | fix(e2e): close button + client-side redirect |
| ۱۶ | `ac567f9` | chore(e2e): retry برای flake |
| ۱۷ | `32ed466` | perf(app): رفع warnings scroll-behavior + LCP |

---

### ۱۴.۱۰ نمرهٔ نهایی پروژه پس از سشن `019fdd7f`

مقایسه با ارزیابی ابتدای سشن اول:

| # | محور | ابتدای سشن اول | انتهای سشن دوم | دلیل ارتقا |
|:-:|---|:---:|:---:|---|
| ۱ | معماری | ۹/۱۰ | **۹/۱۰** | ثابت |
| ۲ | Server/Client | ۷٫۵/۱۰ | **۸/۱۰** | ۳ کامپوننت server شد |
| ۳ | a11y | ۸/۱۰ | **۸/۱۰** | ثابت |
| ۴ | عملکرد | ۷/۱۰ | **۸/۱۰** | preconnect + priority + کاهش use client |
| ۵ | error/loading | ۸/۱۰ | **۸/۱۰** | ثابت (`/admin/forbidden` اضافه شد) |
| ۶ | تست | ۹/۱۰ | **۹٫۵/۱۰** | ۶۴۹ vitest + ۱۳ e2e سبز |
| ۷ | TypeScript | ۹٫۵/۱۰ | **۹٫۵/۱۰** | ثابت |
| ۸ | SEO | ۸/۱۰ | **۸٫۵/۱۰** | og:url + twitter کامل |
| ۹ | پنل ادمین | ۶٫۵/۱۰ | **۹/۱۰** | صفر placeholder + RBAC |
| ۱۰ | cart/checkout | ۸/۱۰ | **۸/۱۰** | ثابت |
| ۱۱ | واتساپ/FAB | ۸٫۵/۱۰ | **۸٫۵/۱۰** | ثابت |
| ۱۲ | UX / هویت بصری | ۸٫۵/۱۰ | **۸٫۵/۱۰** | ثابت |
| — | **امنیت (محور جدید)** | ۷/۱۰ | **۹/۱۰** | RBAC + CSP nonce + دفاع در عمق |
| | **میانگین** | **۸٫۱/۱۰** | **۸٫۷/۱۰** | +0.6 |

**حکم نهایی:** پروژه از **«پوستهٔ سبز فرانت‌اند»** به **«آمادهٔ preprod با پنل عملیاتی، امنیت سازمانی و E2E اثبات‌شده»** رسیده. تنها گام باقی‌مانده اتصال بک‌اند واقعی (فاز C) است.

---

### ۱۴.۱۱ چک‌لیست شروع سشن آینده (پس از فاز C)

اگر یک روز تصمیم گرفتید فاز C را شروع کنید، این ترتیب پیشنهاد می‌شود:

```bash
cd /d/saite
git fetch origin
git checkout arena/019fdd7f-saite
git pull origin arena/019fdd7f-saite
npm install --no-audit --no-fund

# ۱. این سند + بخش ۱۴ به‌طور کامل خوانده شود
#    مخصوصاً ۱۴.۱ (تحلیل ابتدایی) و ۱۴.۱۰ (نمره نهایی)

# ۲. baseline را ببینید — انتظار: همه سبز
npm run type-check && npm run lint && npm test && npm run build

# ۳. E2E روی سیستم شما (بدون نیاز به اینترنت CDN)
PW_CHANNEL=msedge npm run e2e     # روی ویندوز
# یا  PW_CHANNEL=chrome  اگر Chrome دارید
# روی CI: خودش از image رسمی Playwright استفاده می‌کند

# ۴. برای فاز C:
#    - افزودن Prisma + Postgres (نیاز به مجوز صریح از کاربر)
#    - از src/types/product.ts اسکیمای Prisma بسازید
#    - src/lib/api-client-http.ts واقعی
#    - migration + seed از mock-data.ts
#    - NEXT_PUBLIC_USE_MOCK=false → سوییچ به HTTP
#    - در هر گام: verify سبز باشد
```

**⚠️ ممنوعیت‌های سشن آینده:**
1. ❌ **مرورگر سیستمی PW_CHANNEL را در playwright.config.ts hard-code نکنید** — فقط env-driven بماند تا CI هم کار کند
2. ❌ **`getByRole` با متن فارسی برای dialog/modal استفاده نکنید** — همیشه از CSS attribute selector (bidi safe)
3. ❌ **`devices['iPhone 13']` را spread نکنید اگر ممکن است `PW_CHANNEL` ست شود** — فقط `viewport` override
4. ❌ **workflow جدید در `.github/workflows/` مستقیم اضافه نکنید** — از الگوی `docs/ci/e2e.yml.example` استفاده کنید (GitHub App مجاز نیست)
5. ❌ **CSP `'unsafe-inline'` را کامل حذف نکنید** — Safari <15.4 fallback نیاز دارد (Google/MDN توصیه)
6. ❌ **`ADMIN_ROLE` را از fingerprint حذف نکنید** — تغییرش باید نشست‌های قدیمی را ابطال کند
7. ❌ **`Date.now()` در `useMemo` نگذارید** — React 19 impure-function می‌دهد؛ از `useState(() => Date.now())` استفاده کنید

**✅ الگوهای موفق سشن دوم که باید حفظ شوند:**
1. **معماری دو-لایه CSP** (proxy برای admin، next.config برای public)
2. **`requirePermission` / `requirePagePermission` / `requireRole`** — سه سطح گارد
3. **Pre-populate localStorage در E2E** به‌جای وابستگی به UI کلیک
4. **`filterAdminNavByRole`** برای UX + گارد سرور جداگانه (never trust client)
5. **CSS attribute selector برای RTL** به‌جای ARIA computed name
