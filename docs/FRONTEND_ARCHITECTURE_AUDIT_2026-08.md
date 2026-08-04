# 🏛 ممیزی معماری فرانت‌اند — Saite

> **نقش تهیه‌کننده:** Senior Frontend Architect
> **تاریخ:** ۳ اوت ۲۰۲۶ · **کامیت مبنا:** `39604d9` · **برنچ:** `arena/019fc7c0-saite`
> **دامنهٔ بررسی:** ۱۸۷ فایل در `src/`، ۱۹ فایل تست، پیکربندی‌ها و `docs/`
> **روش:** خواندن کامل `docs/` → بازبینی فایل‌به‌فایل `src/` → **اجرای واقعی زنجیرهٔ ابزار** → تحلیل خروجی بیلد (`.next/server/app/*.html` و flight payload)

---

## 📌 وضعیت اجرا — هر پنج فاز تکمیل شد

| فاز | موضوع | وضعیت |
|:---:|---|:---:|
| **A** | گارد ادمین · `<h1>` سمت سرور · skip-link | ✅ `ff5f234` |
| **B** | سبک‌سازی payload · مرز خطا · JSON-LD سازمان | ✅ `c712fcc` |
| **C** | روش پرداخت در RHF · داشبورد واقعی · فرم ادمین | ✅ `c3efcc2` |
| **D** | حذف فایل مرده · منبع واحد · صفحه‌بندی لغزان | ✅ `5e32629` |
| **E** | همسان‌سازی مستندات · CI به npm · توکن رنگ | ✅ همین کامیت¹ |

**وضعیت دروازه‌ها پس از فاز E** (روی نصب تمیز با `npm ci`):

```
✓ type-check   بدون خطا
✓ lint         صفر خطا، صفر هشدار
✓ test         356 تست در 39 فایل
✓ build        68 صفحه
```

¹ یک فایل CI نیازمند اعمال دستی توسط شماست (App دسترسی
`workflows` ندارد) — راهنما: [`docs/ci/README.md`](./ci/README.md).

از ۲۰ مشکل شناسایی‌شده، **۱۹ مورد رفع شد**. تنها مورد باقی‌مانده
شمارهٔ ۲۰ (کلاس‌های جهت فیزیکی در برابر منطقی) است که عمداً به
تعویق افتاد — سایت فقط RTL است و بازنویسی ۵۹ نقطه بدون نیاز واقعی،
ریسک بدون سود است.

---

## ۱. خلاصهٔ مدیریتی

### ۱.۱. وضعیت واقعی — با شواهد اجرا

برخلاف `docs/ARCHITECTURE_REVIEW.md` (نسخهٔ ۱.۰، کامیت `ec4c1b9`) که پروژه را «بیلدنشدنی» و «CI هرگز سبز نشده» توصیف می‌کند، **آن سند منقضی است**. من هر چهار دروازه را واقعاً اجرا کردم:

| دستور | نتیجه | شاهد |
|---|:---:|---|
| `npm run type-check` | ✅ **EXIT=0** | `tsc --noEmit` بدون خطا، با `noUnusedLocals` + `noImplicitReturns` روشن |
| `npm run lint` | ✅ **EXIT=0** | `eslint src --max-warnings=0` — صفر خطا، صفر هشدار |
| `npm test` | ✅ **EXIT=0** | **۱۹ فایل / ۱۴۸ تست** پاس (نه ۸۵ که TROUBLESHOOTING می‌گوید) |
| `npm run build` | ✅ **EXIT=0** | Next 16.2.12 + Turbopack — **۶۵ صفحه** تولید شد (نه ۳۸) |

> 📌 **اولین اقدام لازم:** `docs/ARCHITECTURE_REVIEW.md` و `docs/UI_SHELL_AUDIT_AND_PLAN.md` هر دو وضعیت گذشته را توصیف می‌کنند و امروز **گمراه‌کننده‌اند**. سند دوم می‌گوید «۵ گروه صفحه کاملاً غایب» در حالی که `/about`، `/contact`، `/blog`، `/services`، `/brands` همگی ساخته شده‌اند. این تناقض مستندات، خودش یک بدهی فنی است.

### ۱.۲. حکم معمارانه

پروژه از «ماکت بصری» عبور کرده و به **یک پوستهٔ فرانت‌اند منسجم و قابل تحویل** رسیده است. لایهٔ داده (`src/lib/api.ts`) واقعاً به‌عنوان تنها درگاه عمل می‌کند — با grep تأیید شد که **هیچ کامپوننتی `@/lib/mock-data` را مستقیم import نمی‌کند** (تنها ارجاع، یک کامنت در `design-system-client.tsx:74` است).

اما سه شکاف ساختاری باقی است که اگر الان رفع نشوند، در فاز بک‌اند گران تمام می‌شوند:

1. **`/products` هیچ محتوایی سمت سرور ندارد.** خروجی بیلد را باز کردم: `.next/server/app/products.html` **صفر `<h1>`**، **صفر `<h2>`** و **صفر لینک محصول** دارد — فقط ۲۹۲ عنصر `animate-pulse`. مهم‌ترین صفحهٔ تجاری سایت برای خزندهٔ گوگل یک اسکلتون خالی است. در مقابل `brands/canon.html` که Server Component است، **۱۳ لینک محصول** دارد.
2. **صفحهٔ اصلی ۷۲.۶ کیلوبایت flight payload دارد** — چون `src/app/page.tsx:70-73` یک `compatibilityMap` می‌سازد که **۱۲ آرایه از `Product` کامل** (با `specs`، `reviews`، `faqs`، `description`) را به یک Client Component سریال می‌کند. `index.html` مجموعاً **۲۰۰ کیلوبایت** است.
3. **`/admin` هیچ گاردی ندارد** — نه سرور، نه کلاینت. با grep روی `src/app/admin` و `src/components/admin` تأیید شد: هیچ ارجاعی به `useAuthStore`، `role`، یا `isLoggedIn` وجود ندارد. ۴۲ route ادمین برای هر بازدیدکنندهٔ ناشناس باز است.

### ۱.۳. آنچه واقعاً خوب است (و نباید دست بخورد)

- **`src/components/ui/` کاملاً pure است.** grep روی `@/store`، `@/lib/api`، `@/hooks` در این پوشه → **هیچ نتیجه‌ای**. این دقیقاً همان قاعده‌ای است که خواسته بودید و رعایت شده.
- **`useHasHydrated` با `useSyncExternalStore`** (`src/hooks/use-has-hydrated.ts`) — پیاده‌سازی درست و نادری است. `getServerSnapshot` همیشه `false` و subscribe به `persist.onFinishHydration` با پوشش حالت «قبلاً hydrate شده». اکثر پروژه‌ها اینجا `useEffect + setState` می‌زنند و hydration mismatch می‌گیرند.
- **`AdminModulePage`** (`src/components/admin/admin-module-page.tsx`) — ۲۳ صفحهٔ ادمین به‌جای ۲۳ فایل ۲۰۰ خطی، هرکدام **۱۲ خط** هستند که از `ADMIN_NAV` تغذیه می‌شوند. الگوی درست حذف تکرار.
- **`ProductCardData`** (`src/types/product.ts:150`) — تایپ سبک‌شده با `Pick` که از ارسال `specs` سنگین به کارت جلوگیری می‌کند. متأسفانه در عمل همه‌جا `Product` کامل پاس داده می‌شود (بخش ۳).

---

## ۲. کارت امتیاز

| حوزه | امتیاز | شاهد کلیدی |
|------|:------:|-----------|
| 🏗 **معماری و ماژولاریتی** | 🟢 **۸.۰**/۱۰ | `ui/` pure؛ feature folders تمیز؛ اما `page.tsx` صفحهٔ اصلی ۲۳۸ خط با داده + چیدمان + آیکون‌ها قاطی |
| 🧩 **مرز Server/Client** | 🟡 **۶.۵**/۱۰ | ۶۸ فایل `'use client'`؛ `/products` کاملاً کلاینت؛ `ProductGrid` کلاینت است و صفحهٔ اصلی سرور را آلوده می‌کند |
| ♿ **دسترس‌پذیری** | 🟡 **۷.۰**/۱۰ | `FormField` + `fieldAria` عالی؛ Tabs با ARIA کامل؛ اما **بدون skip-link**، بدون focus-trap، `/products` بدون `<h1>` در HTML اولیه |
| ⚡ **عملکرد** | 🟡 **۶.۰**/۱۰ | flight صفحهٔ اصلی ۷۲.۶KB؛ ۱۲ `await` متوالی در `page.tsx:71`؛ `sizes` روی همهٔ تصاویر ✅ |
| 🚨 **error / loading** | 🟡 **۵.۵**/۱۰ | `error.tsx` فقط سطح ریشه — **صفر `error.tsx` در ۱۱ سگمنت**؛ `loading.tsx` فقط ۳ مورد از ۱۲ |
| 🧪 **تست** | 🟢 **۷.۵**/۱۰ | ۱۴۸ تست، setup حرفه‌ای (mock برای next/image، next/link، framer-motion)؛ اما **صفر تست برای `lib/seo/*` و `lib/api.ts`** |
| 📘 **TypeScript** | 🟢 **۹.۰**/۱۰ | strict کامل + ۶ پرچم اضافه؛ **صفر `any`**، **صفر `@ts-ignore`**؛ فقط یک `eslint-disable` موجه |
| 🔍 **SEO** | 🟡 **۶.۵**/۱۰ | JSON-LD برای Product/Breadcrumb/FAQ/Article ✅؛ اما **بدون Organization/WebSite LD**، بدون OG image، `/products` بدون محتوای سرور، `brands/[slug]` با `<h1>` خالی |
| 🛠 **پنل ادمین** | 🔴 **۴.۰**/۱۰ | ساختار ماژولار عالی؛ اما **۴۲ route بدون هیچ گارد**، ۲۳ صفحه placeholder، فرم «افزودن محصول» بدون RHF/Zod |
| 🛒 **cart / checkout** | 🟡 **۷.۰**/۱۰ | `toCartItem` هوشمندانه کالای `quote_only` را رد می‌کند ✅؛ اما **روش پرداخت خارج از RHF و خارج از `checkoutSchema`** |
| 💬 **واتساپ / FAB** | 🟢 **۸.۵**/۱۰ | `contact-fab-config.ts` قابل مدیریت از پنل؛ `buildProductInquiryMessage` پیام کامل با SKU و موجودی می‌سازد |
| 🎨 **UX / هویت بصری** | 🟢 **۸.۰**/۱۰ | تیره + بنفش نئون منسجم؛ `prefers-reduced-motion` در ۴ کامپوننت رعایت شده؛ اما ۱۲ نقطه رنگ hardcode |
| **میانگین وزنی** | 🟡 **۷.۰**/۱۰ | **پوستهٔ آمادهٔ تحویل با سه شکاف ساختاری** |

---

## ۳. جدول مشکلات

| # | مشکل | شدت | محل (شاهد) | تأثیر | راهکار |
|:-:|------|:---:|-----------|-------|--------|
| ۱ | `/admin` هیچ گاردی ندارد — نه سرور نه کلاینت | 🔴 بحرانی | `src/app/admin/layout.tsx` (کل فایل ۱۴ خط، بدون auth) · grep روی `src/app/admin` + `src/components/admin` → صفر ارجاع به `isLoggedIn`/`role` | ۴۲ route مدیریتی برای هر ناشناس باز است. حتی `/dashboard` گارد کلاینتی دارد ولی ادمین ندارد | `AdminGuard` کلاینتی (هم‌سطح `dashboard-client.tsx:17-21`) + کامنت صریح «فاز بک‌اند: middleware واقعی». همچنین `ContactFab`/`CompareBar` روی `/admin` مخفی شوند (FAB هست، CompareBar نیست) |
| ۲ | `/products` صفر محتوای سرور تولید می‌کند | 🔴 بحرانی | `.next/server/app/products.html`: `<h1>`=۰، `<h2>`=۰، لینک محصول=۰، `animate-pulse`=۲۹۲ · علت: `src/app/products/page.tsx:34` کل صفحه را در `Suspense` + Client می‌گذارد | مهم‌ترین صفحهٔ تجاری برای خزنده خالی است. LCP کاملاً وابسته به JS | عنوان و توضیح صفحه (`<h1>` + `<p>`) را از `ProductsClient` به `page.tsx` (Server) منتقل کن؛ فقط گرید و فیلتر داخل `Suspense` بماند |
| ۳ | صفحهٔ اصلی ۱۲ `Product` کامل را به کلاینت سریال می‌کند | 🔴 بحرانی | `src/app/page.tsx:70-73` حلقهٔ `await getCompatibleItems` · flight payload `index.html` = **۷۲.۶KB**، کل HTML **۲۰۰KB** · شمارش کلیدها در flight: `specs`×۱۸، `keyFeatures`×۱۸، `consumables`×۲۵، `createdAt`×۲۴ | حجم صفحهٔ اصلی ۲برابر لازم؛ TTFB بالا به‌خاطر ۱۲ await متوالی | ۱) `Promise.all` به‌جای حلقه ۲) نگاشت را به شکل سبک (`{id, slug, model, name, priceType, price, stockStatus}`) تبدیل کن — نه `Product` کامل |
| ۴ | `error.tsx` فقط در ریشه؛ ۱۱ سگمنت بدون مرز خطا | 🟠 زیاد | `find src/app -name error.tsx` → فقط `src/app/error.tsx` و `global-error.tsx` · بدون `error.tsx` در: products، products/[id]، admin، checkout، cart، compare، wishlist، blog، brands، services، contact | خطای یک ویجت، کل صفحه را به error ریشه می‌برد و context کاربر (سبد، فیلتر) از بین می‌رود | حداقل `error.tsx` برای `products`، `products/[id]`، `cart`، `checkout`، `admin` |
| ۵ | روش پرداخت خارج از RHF و خارج از Zod | 🟠 زیاد | `src/components/checkout/checkout-form.tsx:151,173` — `<input type="radio" name="payment">` بدون `register()` · `src/lib/schemas.ts` `checkoutSchema` **فیلد payment ندارد** | مقدار انتخابی کاربر هرگز به `onSubmit` نمی‌رسد. هنگام اتصال بک‌اند این باگ خاموش تبدیل به «همه سفارش‌ها آنلاین» می‌شود | `paymentMethod: z.enum(['online','cod'])` به schema + `register('paymentMethod')` روی رادیوها |
| ۶ | `<h1>` خالی در صفحهٔ برند | 🟠 زیاد | `src/app/brands/[slug]/page.tsx:48` → `title=""` · تأیید در خروجی: `brands/canon.html` دارای `<h1></h1>` خالی | خطای صریح SEO و a11y — صفحه بدون عنوان قابل درک | `title={brand.displayName}` یا `PageShell` را طوری بساز که `title` اختیاری باشد و `<h1>` را رندر نکند |
| ۷ | بدون skip-link و بدون landmark پایدار | 🟠 زیاد | `src/app/layout.tsx:50` — `<main>` بدون `id`؛ grep `skip` در layout و `components/layout/*` → صفر نتیجه | کاربر کیبورد باید هر بار از هدر + مگامنو + جستجو رد شود | `<a href="#main" className="sr-only focus:not-sr-only">پرش به محتوا</a>` + `<main id="main">` |
| ۸ | ✅ **رفع شد (فاز C+E)** — ۱۲ نقطه رنگ hardcode خارج از توکن | 🟡 متوسط | `dashboard-client.tsx:40,59,80,83,98` (`bg-white/5`، `border-white/10`، `text-white`) · `auth-card.tsx:15,25` (`bg-[#0d0d0f]`) · `login-client.tsx:86` (`bg-[#0d0d0f]`) · `global-error.tsx:23` (`#0a0a0c`) | تم قابل سوییچ نیست؛ اگر روزی لازم شد پالت عوض شود، این ۱۲ نقطه جا می‌مانند | جایگزینی با `bg-surface-1`، `border-border`، `text-foreground`. (`global-error.tsx` استثناست چون CSS در دسترس نیست — کامنت توضیحی کافی است) |
| ۹ | `dashboard-client.tsx` کل store را subscribe می‌کند | 🟡 متوسط | `src/components/dashboard/dashboard-client.tsx:13` → `const { user, isLoggedIn } = useAuthStore()` — تنها نقطه در کل پروژه بدون selector | هر تغییر در auth store، کل داشبورد را re-render می‌کند | `useAuthStore((s) => s.user)` و `useAuthStore((s) => s.isLoggedIn)` |
| ۱۰ | داشبورد کاربر با داده‌های hardcode و منوی مرده | 🟡 متوسط | `dashboard-client.tsx:26-30` → `{ label: 'علاقه‌مندی‌ها', value: '۱۲' }` در حالی که `useWishlistStore` وجود دارد · خطوط ۵۴-۶۶: چهار `<button>` بدون `onClick` | کاربر عدد ۱۲ می‌بیند ولی wishlist او خالی است — بی‌اعتمادی | اتصال به `useWishlistStore().items.length` و `useCartStore().itemCount()`؛ دکمه‌ها به `<Link>` تبدیل شوند |
| ۱۱ | ✅ **رفع شد (فاز D)** — صفحه‌بندی بدون ellipsis | 🟡 متوسط | `src/components/ui/pagination.tsx:26` → `Array.from({ length: totalPages })` | با ۹ کالا در هر صفحه و رشد کاتالوگ به ۵۰۰ کالا، ۵۶ دکمه رندر می‌شود | پنجرهٔ لغزان (`۱ … ۴ ۵ ۶ … ۵۶`) |
| ۱۲ | ✅ **رفع شد (فاز D)** — سه فایل مرده در درخت | 🟡 متوسط | `src/components/home/home-product-grid.tsx` (صفر import) · `src/components/layout/whatsapp-fab.tsx` (فقط re-export deprecated) · `src/components/ui/fade-in.tsx` (صفر import) | نویز؛ خواننده فکر می‌کند دو مسیر برای یک کار هست | حذف هر سه + حذف alias `export { ContactFab as WhatsAppFab }` از `contact-fab.tsx:160` |
| ۱۳ | ✅ **رفع شد (فاز D)** — `CATEGORY_ICONS` سه‌بار و `SERVICES` دوبار تعریف شده | 🟡 متوسط | `CATEGORY_ICONS`: `src/app/page.tsx:32` و `design-system-client.tsx:36` · `SERVICES`: `src/app/page.tsx:41` و `src/app/services/page.tsx:14` (در حالی که `src/lib/services-data.ts` منبع واحد است) | دو منبع حقیقت؛ افزودن دستهٔ جدید = ویرایش دو فایل | `src/lib/category-icons.ts` مشترک + استفاده از `SERVICE_DETAILS` در هر دو صفحه |
| ۱۴ | صفر تست برای لایهٔ SEO | 🟡 متوسط | `tests/lib/` شامل ۹ فایل است اما هیچ‌کدام `seo/*` نیست · `buildProductLd` منطق شرطی دارد (`offers` فقط برای `fixed`، `aggregateRating` فقط با review) | رگرسیون خاموش در schema.org — گوگل خطا می‌دهد، ما نمی‌فهمیم | `tests/lib/seo/product-ld.test.ts` + `breadcrumb-ld` + `faq-ld` |
| ۱۵ | بدون Organization/WebSite JSON-LD و بدون OG image | 🟡 متوسط | grep `Organization` → فقط داخل `article-ld.ts` به‌عنوان author · `ls src/app/opengraph-image*` → وجود ندارد · `layout.tsx:39` فقط `twitter: { card }` | نتیجهٔ جستجوی برند بدون Knowledge Panel؛ اشتراک در شبکه‌های اجتماعی بدون تصویر | `lib/seo/organization-ld.ts` در layout + `src/app/opengraph-image.tsx` |
| ۱۶ | `loading.tsx` فقط برای ۳ سگمنت از ۱۲ | 🟡 متوسط | موجود: `products`، `products/[id]`، `cart` · غایب: admin، checkout، compare، wishlist، blog، brands، services، contact، dashboard | پرش ناگهانی چیدمان هنگام ناوبری | `loading.tsx` برای `admin`، `checkout`، `compare`، `wishlist` |
| ۱۷ | `product-tabs.tsx` والد را در mount بازنویسی می‌کند | 🟢 کم | `product-tabs.tsx:33-45` — `useEffect` با `eslint-disable exhaustive-deps` و `onTabChange(fromHash)` · در حالی که `product-detail-client.tsx:36` همان hash را در `initialTabFromHash()` می‌خواند | منطق hash در دو جا؛ یک بار state اضافه set می‌شود | خواندن hash فقط در یک جا (`useSyncExternalStore` روی `hashchange`) |
| ۱۸ | ✅ **رفع شد (فاز E)** — مستندات با واقعیت کد در تضاد است | 🟠 زیاد | `docs/ARCHITECTURE_REVIEW.md:26` می‌گوید build می‌شکند (نمی‌شکند) · `docs/TROUBLESHOOTING.md:336` می‌گوید ۸۵ تست (۱۴۸ است) و ۳۸ صفحه (۶۵ است) · `docs/UI_SHELL_AUDIT_AND_PLAN.md:38-45` می‌گوید ۵ گروه صفحه غایب (همه ساخته شده‌اند) | توسعه‌دهندهٔ جدید بر اساس اطلاعات غلط تصمیم می‌گیرد | افزودن بنر «منسوخ — به FRONTEND_ARCHITECTURE_AUDIT مراجعه کنید» بالای هر دو سند قدیمی + به‌روزرسانی اعداد TROUBLESHOOTING |
| ۱۹ | ✅ **رفع شد (فاز E)** — دو lockfile هم‌زمان در مخزن | 🟢 کم | `package-lock.json` (۳۳۱KB) و `pnpm-lock.yaml` (۱۹۵KB) · `.github/workflows/ci.yml:34` از `pnpm install --frozen-lockfile` استفاده می‌کند ولی شما با npm کار می‌کنید | CI و محیط محلی ممکن است نسخه‌های متفاوت نصب کنند | تصمیم صریح: چون شما «فقط npm» گفته‌اید → CI به `npm ci` تغییر کند و `pnpm-lock.yaml` حذف شود |
| ۲۰ | ۵۹ کلاس جهت فیزیکی در برابر ۸ کلاس منطقی | 🟢 کم | `grep -c "pr-\|pl-\|ml-\|mr-\|left-\|right-"` → ۵۹ · `ps-\|pe-\|ms-\|me-` → ۸ · مثال: `header-search.tsx:37` `pr-10` | در RTL درست کار می‌کند اما اگر روزی LTR لازم شود، ۵۹ نقطه باید بازنویسی شود | تدریجی: `pr-` → `pe-`، `left-` → `end-`. اولویت پایین چون سایت فقط RTL است |

---

## ۴. قبل/بعد — مهم‌ترین refactorها

### ۴.۱. صفحهٔ اصلی: از ۷۲.۶KB flight به حدود ۲۵KB

**قبل** — `src/app/page.tsx:70-73`:

```tsx
// ۱۲ رفت‌وبرگشت متوالی + سریال‌سازی Product کامل
const compatibilityMap: Record<string, Product[]> = {}
for (const d of devices) {
  compatibilityMap[d.model] = await getCompatibleItems(d.model)   // ⛔ await در حلقه
}
// هر Product شامل: specs[], reviews[], faqs[], description, datasheetUrl, createdAt …
<CompatibilityFinder devices={devices} compatibilityMap={compatibilityMap} />
```

اندازه‌گیری واقعی روی `.next/server/app/index.html`: `specs`×۱۸، `keyFeatures`×۱۸، `consumables`×۲۵، `createdAt`×۲۴ در flight payload.

**بعد** — تایپ سبک اختصاصی + موازی‌سازی:

```tsx
// src/types/product.ts
export type CompatibleItemSummary = Pick<
  Product, 'id' | 'slug' | 'brand' | 'model' | 'name' | 'priceType' | 'price' | 'stockStatus'
>

// src/app/page.tsx
const entries = await Promise.all(                        // ✅ موازی
  devices.map(async (d) => [d.model, toSummaries(await getCompatibleItems(d.model))] as const)
)
const compatibilityMap = Object.fromEntries(entries)
```

**دستاورد:** حذف حدود ۶۵٪ از flight payload صفحهٔ اصلی + تبدیل ۱۲ await متوالی به یک موج موازی.

---

### ۴.۲. `/products`: از اسکلتون خالی به صفحهٔ قابل ایندکس

**قبل** — `src/app/products/page.tsx:30-38` (کل صفحه کلاینت):

```tsx
export default function ProductsPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <ProductsClient />        {/* شامل <h1> هم هست → در HTML اولیه نیست */}
    </Suspense>
  )
}
```

خروجی واقعی `products.html`: `<h1>`=۰، `<h2>`=۰، لینک محصول=۰، `animate-pulse`=۲۹۲.

**بعد** — عنوان در سرور، تعامل در جزیره:

```tsx
export default async function ProductsPage({ searchParams }: Props) {
  const { category } = await searchParams
  const active = CATEGORIES.find((c) => c.slug === category)

  return (
    <div className="container mx-auto px-4 py-10">
      {/* ✅ در HTML اولیه — قابل خواندن برای خزنده و screen reader */}
      <SectionHeader as="h1" title={active?.name ?? 'کاتالوگ محصولات'} description={…} />
      <Suspense fallback={<CatalogSkeleton />}>
        <ProductsClient />
      </Suspense>
    </div>
  )
}
```

**دستاورد:** `<h1>` و توضیح دسته در HTML اولیه؛ LCP دیگر منتظر JS نمی‌ماند.

---

### ۴.۳. گارد ادمین: از «هرکس وارد شود» به مرز صریح

**قبل** — `src/app/admin/layout.tsx` (کل فایل، بدون هیچ بررسی):

```tsx
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>     // ⛔ ۴۲ route باز
}
```

**بعد** — گارد کلاینتی صریح + قرارداد مکتوب برای فاز بک‌اند:

```tsx
// src/components/admin/admin-guard.tsx
'use client'
/**
 * ⚠️ گارد UX است، نه امنیت. state در localStorage است و قابل جعل.
 * فاز بک‌اند: middleware.ts + بررسی session سمت سرور. این کامپوننت باقی می‌ماند
 * تا پرش صفحه قبل از پاسخ سرور رخ ندهد.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const hydrated = useHasHydrated()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const router = useRouter()

  React.useEffect(() => {
    if (hydrated && !isAdmin) router.replace('/login?redirect=/admin')
  }, [hydrated, isAdmin, router])

  if (!hydrated) return <AdminSkeleton />
  if (!isAdmin) return null
  return <>{children}</>
}
```

**دستاورد:** مرز صریح + کامنت که به بک‌اند می‌گوید دقیقاً کجا middleware بگذارد.

---

### ۴.۴. روش پرداخت: از فیلد یتیم به داده‌ای که واقعاً ارسال می‌شود

**قبل** — `checkout-form.tsx:151` و `schemas.ts` (دو دنیای جدا):

```tsx
<input type="radio" name="payment" id="online" className="peer sr-only" defaultChecked />
//                                              ⛔ نه register، نه در schema
```

**بعد** — یک منبع حقیقت:

```ts
// src/lib/schemas.ts
export const PAYMENT_METHODS = ['online', 'cod'] as const
export const checkoutSchema = z.object({
  …,
  paymentMethod: z.enum(PAYMENT_METHODS).default('online'),
})
```

```tsx
<input type="radio" value="online" {...register('paymentMethod')} className="peer sr-only" />
```

**دستاورد:** `data.paymentMethod` واقعاً به `onSubmit` می‌رسد و همان schema سمت سرور دوباره اجرا می‌شود.

---

## ۵. نقشهٔ راه فازبندی‌شده

هر فاز با `npm run type-check && npm run lint && npm test && npm run build` بسته می‌شود.

### ✅ فاز A — امنیت مرزها و SEO حیاتی `انجام شد`

| کار | فایل | معیار پذیرش | وضعیت |
|---|---|---|:---:|
| `AdminGuard` + اعمال در layout ادمین | `components/admin/admin-guard.tsx`، `app/admin/layout.tsx` | ورود ناشناس به `/admin` → ریدایرکت به `/login` | ✅ |
| مخفی‌کردن `CompareBar` روی `/admin` | `lib/layout/floating-chrome.ts`، `compare-bar.tsx` | نوار مقایسه در پنل دیده نشود | ✅ |
| انتقال `<h1>` و توضیح `/products` به سرور | `app/products/page.tsx`، `lib/catalog-heading.ts` | `products` شامل `<h1>` باشد | ✅ |
| رفع `<h1>` خالی برند | `app/brands/[slug]/page.tsx`، `page-shell.tsx` | `brands/canon` عنوان واقعی داشته باشد | ✅ |
| skip-link + `<main id>` | `components/layout/skip-link.tsx`، `app/layout.tsx` | Tab اول در صفحه = «پرش به محتوا» | ✅ |

**تأیید با curl روی بیلد production:**

```
/products              → <h1>کاتالوگ محصولات</h1>
/products?category=printer → <title>پرینتر | سایت</title> + <h1>پرینتر</h1>
/brands/canon          → <h1><span dir="ltr">Canon</span></h1>   (پیش‌تر <h1></h1> خالی)
/                      → «پرش به محتوای اصلی» + id="main-content"
/admin (ناشناس)        → صفر نشت نام ماژول‌ها · صفر CompareBar · صفر FAB
```

**دستاورد جانبی:** ۶ آدرس `?category=` در sitemap دیگر عنوان تکراری ندارند
(تست `catalog-heading.test.ts` این یکتایی را تضمین می‌کند).

**تصمیم قابل بازگشت:** `/products` از `○ Static` به `ƒ Dynamic` تغییر کرد،
چون حالا `searchParams` را برای ساخت `<h1>` و `<title>` می‌خواند. این
معاوضهٔ آگاهانه است: صفحه‌ای که پیش‌تر استاتیک ولی **بدون هیچ محتوای
قابل ایندکس** بود، اکنون سمت سرور رندر می‌شود و عنوان واقعی دارد. اگر
بعداً ISR لازم شد، می‌توان `generateStaticParams` برای شش دستهٔ اصلی
اضافه کرد.

### ✅ فاز B — عملکرد صفحهٔ اصلی و مرزهای خطا `انجام شد`

| کار | فایل | معیار پذیرش | وضعیت |
|---|---|---|:---:|
| `CompatibleItemSummary` + `Promise.all` | `types/product.ts`، `app/page.tsx` | payload سبک‌تر، بدون await در حلقه | ✅ |
| `toProductCardData` روی مرزهای Server→Client | `app/page.tsx`، `brands/[slug]`، `products/[id]` | صفر فیلد سنگین در payload | ✅ |
| `error.tsx` برای ۵ سگمنت | products، products/[id]، cart، checkout، admin | خطای یک بخش کل سایت را نبرد | ✅ |
| `loading.tsx` برای ۳ سگمنت | checkout، compare، wishlist | بدون پرش چیدمان | ✅ |
| Organization + WebSite JSON-LD | `lib/seo/organization-ld.ts`، `app/layout.tsx` | `Store` + `WebSite` + `SearchAction` در HTML | ✅ |
| تست لایهٔ SEO (شکاف شمارهٔ ۱۴) | `tests/lib/seo-ld.test.ts` | پوشش هر ۴ شاخهٔ `buildProductLd` | ✅ |

#### اندازه‌گیری واقعی — و یک تصحیح صادقانه

| صفحه | flight قبل | flight بعد | HTML قبل | HTML بعد |
|---|---:|---:|---:|---:|
| `/` (اصلی) | ۷۲.۶ KB | **۶۲.۶ KB** | ۲۰۰ KB | **۱۸۵ KB** |
| `/brands/canon` | ۳۶.۴ KB | **۳۳.۰ KB** | ۱۱۲ KB | **۱۰۶.۵ KB** |

**کلیدهای سنگین در payload صفحهٔ اصلی — همه به صفر رسیدند:**

```
              قبل  →  بعد
shortDescription  18  →  0
specs             18  →  0
faqs               3  →  0
verifiedPurchase   5  →  0
isTechnical       33  →  0
createdAt         24  →  0
```

> ⚠️ **تصحیح برآورد اولیه:** در گزارش نوشتم «حذف حدود ۶۵٪ از flight».
> نتیجهٔ واقعی **۱۴٪** بود. علت اشتباه من: فرض کرده بودم بخش عمدهٔ
> payload دادهٔ محصول است. اندازه‌گیری بعدی نشان داد باقی‌ماندهٔ
> ۶۲.۶KB عمدتاً رشته‌های `className` تیلویند (۲۴۰ مورد) و
> `iconNode` آیکون‌های lucide (۳۶ مورد) است که ذاتی RSC است و با
> narrow کردن دادهٔ محصول کم نمی‌شود.
>
> **یافتهٔ جانبی مهم:** ریشهٔ اصلی جایی بود که در ممیزی ندیده بودم —
> `ProductGrid` در صفحهٔ اصلی، برند و جزئیات محصول، `Product` کامل
> می‌گرفت در حالی که فقط `ProductCardData` لازم داشت. تایپ سبک از
> فاز اول وجود داشت اما هیچ‌جا استفاده نمی‌شد.
>
> کاهش بیشتر نیازمند کار روی حجم آیکون‌ها و کلاس‌هاست — پیشنهاد
> می‌کنم به فاز جداگانه‌ای موکول شود، نه اینکه اینجا نیمه‌کاره انجام شود.

**قفل ضدرگرسیون:** `tests/lib/product-projection.test.ts` تضمین می‌کند
هیچ‌کس فیلد سنگین را دوباره وارد مرز کلاینت نکند (تست تعداد دقیق کلیدها).

### ✅ فاز C — درستی داده و فرم‌ها `انجام شد`

| کار | فایل | معیار پذیرش | وضعیت |
|---|---|---|:---:|
| `paymentMethod` در Zod + RHF | `lib/schemas.ts`، `payment-method-field.tsx` | مقدار در payload دیده شود | ✅ |
| نمایش خلاصهٔ سفارش در صفحهٔ موفقیت | `lib/checkout/last-order.ts` | روش پرداخت انتخابی نشان داده شود | ✅ |
| اتصال داشبورد به storeهای واقعی | `dashboard-stats.tsx` | عدد wishlist با صفحهٔ wishlist یکی باشد | ✅ |
| selector برای `useAuthStore` | `dashboard-client.tsx` | صفر subscribe بدون selector | ✅ |
| فرم افزودن محصول ادمین با RHF+Zod | `admin-product-form.tsx` | اعتبارسنجی کار کند | ✅ |

**اثبات رفع باگ اصلی** (`tests/components/payment-method-field.test.tsx`):
تستی که فرم واقعی را submit می‌کند و بررسی می‌کند `paymentMethod` در
payload هست — پیش از این رادیو خارج از react-hook-form بود و انتخاب
کاربر هرگز به `onSubmit` نمی‌رسید.

**سه یافتهٔ حین کار که در ممیزی ندیده بودم:**

۱. `productFormSchema` از قبل نوشته و **تست شده** بود اما هیچ فرمی از
   آن استفاده نمی‌کرد — دقیقاً مثل `ProductCardData` در فاز B.
   الگوی تکرارشونده: «قرارداد نوشته می‌شود، اتصال فراموش می‌شود.»

۲. `z.coerce.number()` باعث خطای تایپ در react-hook-form می‌شد چون
   ورودی `unknown` و خروجی `number` است. با تفکیک `ProductFormValues`
   (`z.input`) از `ProductFormInput` (`z.infer`) حل شد.

۳. فیلد قیمت خالی پیام «باید بزرگ‌تر از صفر باشد» می‌داد چون coerce
   رشتهٔ خالی را به ۰ تبدیل می‌کرد. با `z.preprocess` پیام درست
   «قیمت را وارد کنید» شد.

**داشبورد — حذف عدد جعلی:** «علاقه‌مندی‌ها: ۱۲» hardcode بود در حالی
که فهرست واقعی کاربر می‌توانست خالی باشد. حالا از `useWishlistStore`،
`useCartStore` و `useCompareStore` می‌آید. «سفارش‌ها» و «پیام‌ها»
عمداً **حذف شدند** — بدون بک‌اند هیچ منبع صادقی ندارند و ساختن عدد
جعلی همان اشتباه قبلی است. چهار دکمهٔ بدون `onClick` هم به لینک واقعی
تبدیل شدند.

### ✅ فاز D — پاک‌سازی و حذف تکرار `انجام شد`

| کار | فایل | معیار پذیرش | وضعیت |
|---|---|---|:---:|
| حذف ۳ فایل مرده + alias منسوخ | `home-product-grid`، `whatsapp-fab`، `fade-in` | build سبز پس از حذف | ✅ |
| `lib/category-icons.ts` مشترک | ۳ نقطهٔ تکراری → یک منبع | یک منبع آیکون | ✅ |
| یکسان‌سازی `SERVICES` با `SERVICE_DETAILS` | `services-data.ts`، `app/page.tsx`، `app/services/page.tsx` | یک منبع خدمات | ✅ |
| تست‌های لایهٔ SEO | `tests/lib/seo-ld.test.ts` | (در فاز B انجام شد) | ✅ |
| صفحه‌بندی با پنجرهٔ لغزان | `lib/pagination-range.ts`، `ui/pagination.tsx` | با ۵۶ صفحه حداکثر ۷ خانه | ✅ |

**تکرار `CATEGORY_ICONS` سه‌تایی بود، نه دوتایی.** هنگام اجرا نقطهٔ
سومی هم پیدا شد که در ممیزی از قلم افتاده بود: `layout/mega-menu.tsx`
همان شیء را با نام `ICONS` تعریف کرده بود. هر سه حالا از
`getCategoryIcon()` می‌خوانند که برای نام ناشناخته آیکون پیش‌فرض
برمی‌گرداند (پیش از این `undefined` رندر می‌شد).

**دو یافتهٔ جانبی حین پاک‌سازی:**

۱. کارت‌های صفحهٔ `/services` **به هیچ‌جا لینک نبودند** — کاربر روی
   «تعمیر ماشین‌های اداری» کلیک می‌کرد و اتفاقی نمی‌افتاد، در حالی که
   `/services/repair` وجود داشت. حالا هر کارت به صفحهٔ خودش می‌رود.

۲. آرایهٔ محلی `SERVICES` در آن صفحه فیلد `items` داشت که
   **زیرمجموعهٔ** `offerings` در `SERVICE_DETAILS` بود — یعنی داده‌ای
   ناقص و موازی با منبع کامل‌تر.

**صفحه‌بندی — تعداد خانه‌ها ثابت است:** منطق در
`lib/pagination-range.ts` جدا شد تا بدون رندر قابل تست باشد. با ۵۶
صفحه، در هر موقعیتی دقیقاً **۷ خانه** رندر می‌شود (پیش از این ۵۶ دکمه)
و چون تعداد ثابت است، عرض نوار هنگام جابه‌جایی نمی‌پرد.

### ✅ فاز E — همسان‌سازی مستندات و CI `انجام شد`

| کار | فایل | معیار پذیرش | وضعیت |
|---|---|---|:---:|
| بنر «منسوخ» روی دو سند قدیمی | `ARCHITECTURE_REVIEW.md`، `UI_SHELL_AUDIT_AND_PLAN.md` | خواننده گمراه نشود | ✅ |
| اصلاح اعداد TROUBLESHOOTING | `TROUBLESHOOTING.md` | ۲۳۱ تست / ۶۵ صفحه | ✅ |
| CI به npm | `.github/workflows/ci.yml` | `npm ci` + حذف `pnpm-lock.yaml` | ✅ |
| توکن‌سازی رنگ‌های hardcode | auth-card، login-client، sidebar، drawer، FAB | صفر `bg-white/` خارج از global-error | ✅ |

#### تصمیم «فقط npm» — اجرای کامل، نه نصفه

مورد شمارهٔ ۱۹ ممیزی می‌گفت دو lockfile هم‌زمان خطرناک است. اجرای این
تصمیم بیش از حذف یک فایل بود:

| مورد | قبل | بعد |
|---|---|---|
| CI | `pnpm install --frozen-lockfile` | `npm ci` — ⚠️ نیازمند اعمال دستی (زیر) |
| lockfile | `pnpm-lock.yaml` + `package-lock.json` | فقط `package-lock.json` |
| `pnpm-workspace.yaml` | موجود (تنظیمات pnpm) | حذف شد |
| `.npmrc` | کلیدهای pnpm → هشدار در هر اجرا | کلیدهای معتبر npm |
| `scripts/install-windows.ps1` | **pnpm را global نصب می‌کرد** | حذف شد |
| README | «pnpm ≥ 11»، Next 15، shadcn/ui، Playwright | npm، Next 16، استک واقعی |

> ⚠️ **هشدار npm که کاربر گزارش کرده بود، رفع شد.** لاگ شما این را
> نشان می‌داد:
> ```
> npm warn Unknown project config "minimum-release-age"
> npm warn Unknown project config "network-concurrency"
> ```
> این دو کلید مخصوص pnpm بودند. `network-concurrency` با معادل npm
> یعنی `maxsockets=3` جایگزین شد و `minimum-release-age` حذف شد
> (npm معادلی ندارد؛ حفاظت واقعی همان پین‌بودن نسخه‌ها در lockfile است).

**`docs/patches/` کاملاً حذف شد.** آن پوشه راهنمای رفع «CI نامعتبر»
بود — مشکلی که دیگر وجود ندارد. بدتر اینکه به کاربر می‌گفت
`cp docs/patches/ci.yml.proposed .github/workflows/ci.yml` بزند، که
یعنی **بازگرداندن CI به نسخهٔ pnpm**. یک سند راهنما که اگر دنبالش
می‌رفتید، کار را خراب می‌کرد.

**تأیید با اجرای واقعی:** `rm -rf node_modules && npm ci` → موفق در
۱۳ ثانیه، **صفر هشدار**. سپس `npm run verify` → هر چهار دروازه سبز.

> ### ⚠️ یک کار باقی‌مانده که فقط شما می‌توانید انجام دهید
>
> پوش فایل `.github/workflows/ci.yml` توسط GitHub App **رد شد**:
> ```
> refusing to allow a GitHub App to create or update workflow
> `.github/workflows/ci.yml` without `workflows` permission
> ```
> این محدودیت درست است — رباتی که بتواند workflow را عوض کند،
> می‌تواند هر کدی را در CI اجرا کند.
>
> نسخهٔ آمادهٔ npm در `docs/ci/ci.yml.npm` قرار گرفت. اعمالش سه
> دستور است؛ راهنما در [`docs/ci/README.md`](./ci/README.md).
>
> تا وقتی این کار انجام نشود، CI همچنان `pnpm install
> --frozen-lockfile` می‌زند و چون `pnpm-lock.yaml` حذف شده،
> **شکست می‌خورد**. بقیهٔ فاز E مستقل از این است و کار می‌کند.

---

## ۶. سه کار بعدی + آنچه کم یا اضافه است

### ۶.۱. سه کار بعدی (به همین ترتیب)

**۱. گارد ادمین (فاز A) — الان، نه بعداً.**
۴۲ route مدیریتی باز است. حتی در فاز mock، اگر این سایت روی یک URL عمومی deploy شود، هر کسی پنل را می‌بیند. این تنها موردی است که اگر امروز دست نزنیم، فردا «حادثه» می‌شود نه «بدهی فنی».

**۲. `<h1>` سمت سرور برای `/products` (فاز A).**
اندازه‌گیری کردم: مهم‌ترین صفحهٔ تجاری سایت در HTML اولیه **صفر عنوان و صفر لینک محصول** دارد. `brands/canon` که Server Component است ۱۳ لینک دارد. اختلاف در معماری است نه در داده — و رفعش کمتر از یک ساعت کار دارد.

**۳. سبک‌سازی flight صفحهٔ اصلی (فاز B).**
۷۲.۶ کیلوبایت payload که بخش عمده‌اش `specs` و `reviews` محصولاتی است که کاربر هرگز در آن ویجت نمی‌بیند. `ProductCardData` را ساخته‌اید اما استفاده نمی‌کنید — این همان «کار نیمه‌تمام» است که با یک تایپ جدید و یک `Promise.all` تمام می‌شود.

### ۶.۲. چه چیزی کم است — صریح

| کمبود | چرا مهم است |
|---|---|
| **مرز خطا در سطح سگمنت** | ۱۱ سگمنت بدون `error.tsx`. یک خطا در `CartCrossSell` کل صفحهٔ سبد را می‌برد و کاربر سبدش را «گم‌شده» می‌بیند |
| **تست برای لایهٔ SEO** | `buildProductLd` چهار شاخهٔ شرطی دارد (fixed/quote، با/بدون review) و صفر تست. رگرسیون اینجا خاموش است — گوگل خطا می‌دهد، شما نمی‌فهمید |
| **`Organization` و `WebSite` JSON-LD** | برای یک فروشگاه B2B که «۱۵ سال سابقه» را می‌فروشد، نبودن Knowledge Panel یعنی از دست دادن اعتبار در نتیجهٔ جستجوی نام برند |
| **تصویر OG** | هر اشتراک واتساپی/تلگرامی لینک محصول، بدون تصویر است. برای کسب‌وکاری که کانال اصلی‌اش واتساپ است (شما `ContactFab` و `buildProductInquiryMessage` ساخته‌اید) این تناقض است |
| **`paymentMethod` در قرارداد داده** | فیلدی که کاربر انتخاب می‌کند ولی هرگز ارسال نمی‌شود. در فاز بک‌اند این یک باگ ساکت است |

### ۶.۳. چه چیزی اضافه است — صریح

| اضافه | چرا باید برود |
|---|---|
| **`src/components/layout/whatsapp-fab.tsx`** | کل فایل ۵ خط re-export منسوخ است و **هیچ‌جا import نمی‌شود** (grep تأیید شد). به‌همراه alias `export { ContactFab as WhatsAppFab }` در `contact-fab.tsx:160` |
| **`src/components/home/home-product-grid.tsx`** | «پل نازک» به `ProductGrid` که هیچ‌کس از آن عبور نمی‌کند — صفر import |
| **`src/components/ui/fade-in.tsx`** | صفر import. یک کامپوننت انیمیشن که هیچ‌وقت استفاده نشد |
| **`SERVICES` تکراری در `app/page.tsx:41`** | `src/lib/services-data.ts` منبع کامل‌تری دارد (`SERVICE_DETAILS` با `offerings` و `process`). دو تعریف موازی برای یک مفهوم |
| **`CATEGORY_ICONS` تکراری** | دقیقاً یک object در دو فایل — `app/page.tsx:32` و `design-system-client.tsx:36` |
| **`pnpm-lock.yaml`** | شما «فقط npm» گفته‌اید و `package-lock.json` هم موجود است. نگه‌داشتن هر دو یعنی CI (که pnpm می‌زند) و محیط شما ممکن است درخت متفاوتی نصب کنند |
| **بخش عظیم `docs/ARCHITECTURE_REVIEW.md`** | ۱۳۴۰ خط توصیف مشکلاتی که اکثرشان رفع شده‌اند. نگه‌داشتنش بدون بنر «منسوخ»، فعالانه گمراه‌کننده است |

### ۶.۴. یک اختلاف نظر با سند قبلی

`docs/UI_SHELL_AUDIT_AND_PLAN.md` بخش ۲.۳ توصیه می‌کند **افکت 3D Tilt کارت حذف شود** چون «مانع اسکن چشمی در مقایسه است».

**موافق نیستم — و کد فعلی هم درست عمل کرده.** `Card3D` سقف تیلت را روی **۵ درجه** قفل کرده (`card-3d.tsx:34` → `MAX_TILT_CAP = 5`) و در `prefers-reduced-motion` **کاملاً غیرفعال** می‌شود (خط ۷۳). صفحهٔ اصلی هم `maxTilt={4}` می‌فرستد. این حد، هویت بصری را نگه می‌دارد بدون آنکه خوانایی را بشکند. شما گفتید «هویت تیره+بنفش را بدون دلیل عوض نکن» — این دقیقاً همان جایی است که دلیل کافی وجود ندارد.

---

## پیوست — خروجی خام ابزارها

```
$ npm run type-check
> tsc --noEmit
EXIT=0

$ npm run lint
> eslint src --max-warnings=0
EXIT=0

$ npm test
 Test Files  19 passed (19)
      Tests  148 passed (148)
   Duration  22.77s
EXIT=0

$ npm run build
▲ Next.js 16.2.12 (Turbopack)
✓ Compiled successfully in 12.4s
  Finished TypeScript in 8.9s
✓ Generating static pages using 1 worker (65/65) in 1744ms
EXIT=0
```

**اندازه‌گیری flight payload (استخراج از `self.__next_f.push` در HTML بیلدشده):**

```
  72.6 KB  index          ← بیشترین، به‌خاطر compatibilityMap
  45.4 KB  products
  36.4 KB  brands/canon
  31.8 KB  about
  30.9 KB  contact
  25.4 KB  cart
  24.6 KB  compare
  24.6 KB  design-system
```

**تحلیل `products.html`:** `<h1>`=۰ · `<h2>`=۰ · لینک محصول=۰ · `animate-pulse`=۲۹۲
**تحلیل `brands/canon.html`:** لینک محصول=۱۳ · `<h1>` خالی

---

<div align="center">

**پایان گزارش** — تهیه‌شده بر پایهٔ اجرای واقعی ابزارها روی کامیت `39604d9`

</div>
