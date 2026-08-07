# پرامپت تحلیل مستقل پروژه Saite — مخصوص Copilot

> **نحوهٔ استفاده:**
> - **در VS Code:** پروژه را در `D:\saite` باز کن، برنچ `arena/019fdc47-saite` را چک‌اوت کن، Copilot Chat را باز کن (`Ctrl+Shift+I` یا آیکون Copilot)، با `@workspace` شروع کن و کل متن بخش «پرامپت» را کپی کن. وقتی Copilot خواست دستور ترمینال اجرا کند، اجازه بده (یا خودت دستور را اجرا کن و خروجی را به او بده).
> - **در نسخهٔ وب Copilot:** اگر امکان اتصال مخزن/فایل‌ها را دارد، مخزن را انتخاب کن؛ در غیر این صورت فایل‌های کلیدی (لیست پایین) را ضمیمه کن و در متن بگو که محیط اجرای دستور نداری.
> - بعد از دریافت پاسخ Copilot، آن را با سه گزارش ما مقایسه کن: `docs/REVIEW-2026-08-07.md`، `docs/NEW-FOLDER-INTEGRATION-REPORT.md`، `docs/PRODUCT-EDITOR-INTEGRATION-REVIEW.md`.

---

## ─── پرامپت (از اینجا کپی کن) ───

**نقش تو:** Senior Frontend Architect — Next.js App Router، React 19، TypeScript strict، UI ماژولار.

**مأموریت:** تحلیل عمیق و **مستقل** کد فرانت‌اند پروژهٔ Saite و تولید یک گزارش فنی فارسی با شواهد دقیق (مسیر فایل + شماره خط). **هیچ تغییری در کد نده** — فقط تحلیل و پیشنهاد.

### اطلاعات پروژه
- مخزن: `parssystem1-coder/saite` (Repo ID: 1318710372) — https://github.com/parssystem1-coder/saite
- مسیر محلی: ریشهٔ workspace (در سیستم کاربر: `D:\saite`) — برنچ: `arena/019fdc47-saite`
- محصول: فروشگاه RTL ماشین‌های اداری (B2B + B2C) — هویت بصری: تیره + بنفش نئون (این هویت را به‌عنوان تصمیم ثابت بپذیر؛ فقط ناسازگاری‌ها را گزارش کن)
- استک: Next.js 16.2.12 (App Router + Turbopack) · React 19.2 · TypeScript strict (با ۶ پرچم اضافه) · Tailwind v4 · Zustand 5 · TanStack Query 5 · Zod 4 + React Hook Form 7 · Vitest 4 · پکیج‌منیجر: **فقط npm** (Node ≥ 22)

### ⚠️ بافت حیاتی — پوشهٔ «New folder» (حتماً بخوان)
- **کد اصلی برنامه فقط در `src/` است.**
- پوشهٔ ریشهٔ «New folder» یک **پوشهٔ مرجع/راهنمای موقت** است که ما برای استخراج الگو از برخی موارد ساخته‌ایم. شامل دو بسته است: `saite-product-editor` (اسنپ‌شات قدیمی‌تر از ادیتور محصول که **قبلاً در `src/` ادغام شده** — نسخهٔ `src/` جدیدتر است) و `saite-arena-final-complete-payment` (ماژول‌های پیشنهادی: domain-foundation، shipping، payments، orders، customers، پچ سخت‌سازی و…).
- **تصمیم ما:** بعد از استخراج الگوهای موردنیاز از این پوشه، **«New folder» حذف خواهد شد**.
- از تو می‌خواهم:
  1. «New folder» را **به‌عنوان بخشی از برنامه تحلیل نکن** و پیشنهاد «ادغام New folder در src» نده.
  2. فقط در صورت نیاز به‌عنوان **مرجع الگو** به آن اشاره کن (مثلاً پچ سخت‌سازی: security-headers، price-authority، session revocation — اگر به‌نظرت ارزش پیاده‌سازی در src دارند، بگو).
  3. بدان: وجود این پوشه در ریشه باعث شکست `type-check` و `build` می‌شود (فایل خراب `New folder/saite-product-editor/src/components/admin/products/components/RichTextEditor.tsx` با `\'use client\'` در خط ۱، و importهای `@/` در فایل‌های خارج از `src/`). این **مشکل شناخته‌شده** است و ربطی به سلامت کد `src/` ندارد.

### محدوده (اجباری)
- فقط فرانت‌اند. برای بک‌اند/DB/پرداخت واقعی/Auth واقعی **کد نساز و اجرا نکن** — فقط می‌توانی «آماده‌سازی/قرارداد» پیشنهاد دهی.
- تنها درگاه داده: `src/lib/api.ts` — کامپوننت‌ها نباید مستقیم `mock-data` import کنند (این قانون باید با grep راستی‌آزمایی شود).
- `src/components/ui/` باید pure بماند (بدون store/api/hooks).
- الگوی «Server Page + Client island»؛ `'use client'` بی‌دلیل پخش نشود.

### روش کار
1. `docs/` را بخوان: `API_CONTRACT.md`، `TROUBLESHOOTING.md`، `ADMIN_AUTH_SERVER_SIDE.md`، `FRONTEND_ARCHITECTURE_AUDIT_2026-08.md`، `MERGE-GUIDE.md`، `docs/ci/README.md`.
   ⚠️ توجه: `ARCHITECTURE_REVIEW.md` و `UI_SHELL_AUDIT_AND_PLAN.md` **منقضی‌اند** (وضعیت گذشته را توصیف می‌کنند). قضاوت نهایی را از **کد** بگیر، نه از این دو سند.
2. کد `src/` را فایل‌به‌فایل بررسی کن: `src/app`، `src/components`، `src/lib`، `src/store`، `src/hooks`، `src/types`، `src/proxy.ts`، `tests/`، `package.json`، `tsconfig.json`، `next.config.ts`، `eslint.config.mjs`.
3. ابزارها را اجرا کن (اگر محیط اجازه دهد):
   ```bash
   npm run type-check   # انتظار: شکست فقط به‌خاطر «New folder» — برای بررسی src خالص، پوشه را موقتاً کنار بگذار و دوباره اجرا کن
   npm run lint         # eslint src --max-warnings=0
   npm test             # vitest — انتظار: ~496 تست / 52 فایل
   npm run build        # انتظار: شکست فقط به‌خاطر «New folder»؛ بدون آن باید سبز شود (~60 route)
   ```
   اگر نتوانستی دستوری را اجرا کنی، **صریح بگو کدام را اجرا نکرده‌ای** و تحلیل را از روی خواندن کد بده. **هیچ نتیجه‌ای را جعل نکن** (مثلاً نگو «build سبز شد» مگر واقعاً اجرا کرده باشی).

### محورهای تحلیل (۱۲ محور)
1. معماری و ماژولاریتی (تک‌مسئولیتی per فایل، feature folders، حذف تکرار)
2. مرز Server/Client
3. دسترس‌پذیری (a11y)
4. عملکرد (payload، serialization، تصاویر، LCP)
5. error / loading (مرزهای خطا و اسکلتون‌ها)
6. تست (پوشش و کیفیت)
7. TypeScript (strictness، any، تایپ‌های باریک)
8. SEO (metadata، JSON-LD، sitemap، OG، محتوای سرور)
9. پنل ادمین (گارد، placeholderها، فرم‌ها، RBAC)
10. cart / checkout (مرجع قیمت، RHF/Zod، روش پرداخت)
11. واتساپ / FAB
12. UX / هویت بصری

### راستی‌آزمایی مستقل ادعاهای زیر (هر کدام: تأیید / رد / جزئی + شواهد فایل:سطر)
این ادعاها را **خودت مستقل بررسی کن** — نه این‌که چون نوشته‌اند قبول کنی، نه این‌که رد کنی:
1. گارد ادمین سه‌لایه: `src/proxy.ts` + `src/app/admin/(panel)/layout.tsx` + `getAdminSession()` در route handlerها — آیا واقعاً وجود دارد، کامل است، و آیا `/admin/api/session` درست از گارد مستثنا شده؟
2. آیا `/products` در HTML اولیه (سمت سرور) `<h1>` و توضیح دارد؟
3. شمارش دقیق `error.tsx` و `loading.tsx` در `src/app` — کدام سگمنت‌ها هنوز ندارند؟
4. آیا مبلغ نهایی checkout از `totalPrice()` کلاینت (سبد در localStorage) می‌آید و **مرجع قیمت سمت سرور نیست**؟
5. آیا `next.config.ts` هیچ هدر امنیتی (CSP / X-Frame-Options / Referrer-Policy) ندارد؟
6. آیا توکن نشست ادمین (`src/lib/auth/server/session-token.ts`) قابلیت **ابطال نشست** (revision/version) ندارد؟
7. چند صفحه از صفحات ادمین با `AdminModulePage` placeholder هستند؟ (عدد دقیق از مجموع)
8. آیا `src/components/ui/` واقعاً pure است؟ (grep برای `@/store`، `@/lib/api`، `@/hooks`، `useAuthStore`…)
9. شمارش دقیق فایل‌های `'use client'` در `src/` و ارزیابی موجه بودن هر کدام.
10. آیا `src/app/api/admin/emojis/route.ts` بدون گارد احراز هویت است؟ (و آیا matcher پروکسی آن را پوشش می‌دهد؟)
11. آیا `buildProductSchema` در `src/components/admin/products/product-editor.utils.ts` تصاویر `blob:` را از JSON-LD فیلتر می‌کند؟
12. آیا `src/lib/product-editor/http-adapter.ts` دارای timeout / AbortController / جزئیات خطا (status + body) است؟
13. آیا `ProductImages` دارای `revokeObjectURL` (ضد نشت حافظه) و مرتب‌سازی قابل‌دسترس با کیبورد است؟
14. آیا کلیدهای localStorage ویرایشگر محصول (`saite.product-editor.*`) مرکزی و مستند شده‌اند؟
15. آیا مستندات موجود در `docs/` با واقعیت کد هم‌خوانی دارند؟ کدام سند منقضی است؟

### خروجی‌های موردنیاز (زبان گزارش: فارسی؛ کد/دستور: انگلیسی)
1. **خلاصه مدیریتی** (۱ پاراگراف + حکم نهایی: وضعیت کلی پروژه)
2. **کارت امتیاز** — جدول: ۱۲ محور بالا با نمرهٔ ۰–۱۰ + شاهد کلیدی هر کدام + میانگین وزنی
3. **جدول مشکلات** — ستون‌ها: `# | مشکل | شدت (بحرانی/زیاد/متوسط/کم) | محل (فایل:سطر) | تأثیر | راهکار`
4. **قبل/بعد** ۳ تا ۵ refactor مهم (با قطعه‌کد کوتاه)
5. **نقشهٔ راه فازبندی** — هر فاز با دروازه: `npm run type-check && npm run lint && npm test && npm run build` سبز
6. **سه کار بعدی** — صریح و بدون تعارف (با ذکر اینکه چه چیزی کم/اضافه است)
7. **حداقل ۵ یافتهٔ مستقل** که در چک‌لیست بالا نیستند
8. **مقایسه با گزارش‌های موجود** — در پایان: اگر گزارش‌های `docs/REVIEW-2026-08-07.md`، `docs/NEW-FOLDER-INTEGRATION-REPORT.md` و `docs/PRODUCT-EDITOR-INTEGRATION-REVIEW.md` را خواندی، فهرست «موارد توافق» و «موارد اختلاف» را با استناد بده. اگر نخواندی، بگو.

### قواعد صداقت (مهم)
- هیچ ادعایی بدون **شواهد** (فایل:سطر یا خروجی واقعی دستور).
- هر چیزی را که بررسی نکردی یا نتوانستی اجرا کنی، در بخش «محدودیت‌های بررسی» بنویس.
- **هیچ فایلی را تغییر نده، commit/push نکن، و هیچ ابزاری را نصب نکن** (فقط npm ci مجاز است اگر node_modules نبود).
- اگر با ادعای مستندات مخالفی، صریح بگو — هدف ما مقایسهٔ نظرهاست، نه تأیید متقابل.

---

## ─── پایان پرامپت ───

### فایل‌های کلیدی برای ضمیمه (اگر نسخهٔ وب بدون دسترسی به workspace داری)
```
package.json · tsconfig.json · next.config.ts · eslint.config.mjs · vitest.config.ts
src/lib/api.ts · src/lib/api-client.ts · src/lib/mock-data.ts (فقط برای فهم ساختار)
src/app/layout.tsx · src/app/page.tsx · src/app/products/page.tsx
src/app/admin/layout.tsx · src/app/admin/(panel)/layout.tsx · src/proxy.ts
src/lib/auth/server/session-token.ts · src/lib/auth/server/admin-session.ts
src/app/admin/api/session/route.ts · src/app/api/admin/emojis/route.ts
src/store/cart-store.ts · src/components/checkout/checkout-client.tsx · src/lib/schemas.ts
src/components/admin/products/product-editor.utils.ts · src/lib/product-editor/http-adapter.ts
src/lib/product-editor/mock-adapter.ts · src/components/admin/products/components/ProductImages.tsx
src/lib/admin/nav.ts · src/components/layout/contact-fab.tsx · src/lib/contact-fab-config.ts
docs/API_CONTRACT.md · docs/ADMIN_AUTH_SERVER_SIDE.md · docs/TROUBLESHOOTING.md
```
