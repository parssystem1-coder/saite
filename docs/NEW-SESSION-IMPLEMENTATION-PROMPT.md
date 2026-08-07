# پرامپت سشن اجرا — تحلیل + اصلاحات Saite

> **نحوهٔ استفاده:** کل متن از «از اینجا شروع کن» تا «پایان» را در سشن جدید (Arena Agent Mode) بچسبان. سشن باید روی مخزن `parssystem1-coder/saite` باز باشد.
> نسخهٔ ذخیره‌شده: `docs/NEW-SESSION-IMPLEMENTATION-PROMPT.md`

---

## ─── از اینجا شروع کن ───

**نقش تو:** Senior Frontend Architect — Next.js App Router، React 19، TypeScript strict، UI ماژولار.

**مأموریت:** پروژهٔ فروشگاه RTL «Saite» (ماشین‌های اداری، B2B+B2C) را **اول تحلیل کن** (وضعیت فعلی را راستی‌آزمایی کن)، سپس **فازبه‌فاز اصلاحات را اجرا کن** طبق سند مرجعی که در ریپو هست، بعد از هر فاز کیفیت را با ابزارها بسنج، commit و push کن و خلاصهٔ فارسی بده.

---

### ۱) منابع حقیقت (اول این‌ها را کامل بخوان)

| فایل | نقش |
|---|---|
| `docs/MASTER-REFERENCE-IMPLEMENTATION.md` | **سند اصلی اجرا** — حکم نهایی، ۲۰ مشکل تلفیقی، فازها، ممنوعیت‌ها، تست‌ها، چک‌لیست امنیتی، Open Items |
| `docs/product-editor-patches/*.patch` | ۷ پچ آماده و تأییدشده (قابل `git apply`) |
| `docs/REVIEW-2026-08-07.md` | شواهد بازبینی اول (اجرای واقعی ابزارها + تحلیل New folder) |
| `docs/NEW-FOLDER-INTEGRATION-REPORT.md` | گروه‌های A/B/C/D — کدام ماژول‌های New folder ارزش انتقال دارند |
| `docs/PRODUCT-EDITOR-INTEGRATION-REVIEW.md` | راستی‌آزمایی چک‌لیست Copilot + جزئیات پچ‌ها |
| `docs/API_CONTRACT.md` · `docs/TROUBLESHOOTING.md` · `docs/ADMIN_AUTH_SERVER_SIDE.md` | قراردادهای پروژه (فقط npm؛ تاریخچهٔ مشکلات نصب) |

⚠️ `docs/ARCHITECTURE_REVIEW.md` و `docs/UI_SHELL_AUDIT_AND_PLAN.md` **منقضی‌اند** — از آن‌ها برای قضاوت استفاده نکن.

### ۲) بافت حیاتی پروژه

- کد اصلی فقط در `src/` است. پوشهٔ ریشهٔ «New folder» **مرجع/الگوی موقت** است و طبق تصمیم ما **باید حذف شود** (بعد از استخراج فایل‌های لازم). وجودش type-check و build را می‌شکند (فایل خراب `New folder/saite-product-editor/.../RichTextEditor.tsx` و importهای `@/` خارج از src) — این شناخته‌شده است.
- **محدوده:** فقط فرانت‌اند. بک‌اند/DB/پرداخت واقعی/Auth واقعی نساز (فقط آماده‌سازی/قرارداد).
- تنها درگاه داده: `src/lib/api.ts` — کامپوننت‌ها مستقیم `mock-data` import نکنند. `src/components/ui/` باید pure بماند.
- الگوی «Server Page + Client island»؛ هویت بصری تیره+بنفش نئون را **عوض نکن**.
- پکیج‌منیجر فقط **npm** (کاربر روی Windows + Git Bash است؛ هیچ‌وقت pnpm/yarn پیشنهاد نده). مسیرها با فاصله («New folder») را در bash کوئوت کن.
- برنچ سشن تو همان برنچی است که Arena به تو داده — همهٔ کارها و pushها روی همان برنچ.

### ۳) آماده‌سازی (اگر لازم بود)

```bash
cd <workspace>
git fetch origin
# اگر docs/MASTER-REFERENCE-IMPLEMENTATION.md وجود نداشت (سشن از main جدید ساخته شده):
git checkout origin/arena/019fdc47-saite -- docs/    # آوردن مستندات مرجع از برنچ قبلی — بدون سوییچ برنچ
npm install --no-audit --no-fund
```

### ۴) فاز تحلیل (قبل از هر اصلاح — خروجی: گزارش کوتاه فارسی)

1. ابزارها را اجرا کن و خروجی را ثبت کن (انتظار: lint و test سبز؛ type-check و build فقط به‌خاطر «New folder» قرمز):
   ```bash
   npm run type-check ; npm run lint ; npm test ; npm run build
   ```
   برای اثبات سلامت src خالص: پوشهٔ «New folder» را موقتاً به بیرون از workspace منتقل کن، دوباره type-check و build بزن (باید سبز شوند)، بعد برگردانش.
2. ادعاهای کلیدی سند مرجع را سریع راستی‌آزمایی کن (هر کدام: ✅ همان‌طور است / ❌ تغییر کرده): گارد ادمین (`src/proxy.ts` + `(panel)/layout.tsx`)، صفر هدر امنیتی در `next.config.ts`، نشست بدون ابطال (`session-token.ts`)، مرجع قیمت کلاینت (`checkout-client.tsx` → `totalPrice()`)، گارد نداشتن `/api/admin/emojis`، ۲۰/۲۹ placeholder ادمین، pure بودن `ui/`، فیلتر blob در `product-editor.utils.ts`، http-adapter بدون timeout، ProductImages بدون revoke.
3. اگر چیزی با سند مرجع فرق داشت (مثلاً قبلاً اصلاح شده)، در گزارش بگو و همان مورد را از فازها حذف/تطبیق بده. چیز جدید مهمی دیدی؟ به Open Items سند اضافه کن.
4. گزارش تحلیلی کوتاه بده (۵–۱۰ خط): وضعیت ابزارها، تأیید/تغییر ادعاها، و برنامهٔ فازهای این سشن. **بعد از این گزارش، مستقیم اصلاحات را شروع کن** (منتظر تأیید نمان).

### ۵) فازهای اجرا — ترتیب دقیق (منبع: بخش ۶ سند مرجع + این شفاف‌سازی‌ها)

> **دروازهٔ هر فاز:** `npm run type-check && npm run lint && npm test && npm run build` — همه باید سبز شوند. اگر فازی شکست، بایست، علت را دقیق گزارش کن (فایل:سطر)، بعد ادامه بده.

**فاز ۰ — تثبیت workspace**
1. قبل از حذف «New folder»، فایل‌های مرجع پچ سخت‌سازی را به پچ‌های apply-ready تبدیل کن: برای هر فایل از `New folder/saite-arena-final-complete-payment/saite-hardening-patch/files/` که در فاز ۱ نیاز است (next.config.ts، eslint.config.mjs، .env.example، src/lib/security-headers.ts، src/lib/checkout/price-authority.ts، src/lib/auth/server/{session-token,admin-secret,rate-limit,rate-limit-store}.ts، src/app/admin/api/session/route.ts، src/store/cart-store.ts، tests/lib/{security-headers,session-revocation,rate-limit-username,price-authority}.test.ts) یک diff واقعی با `diff -u --label a/... --label b/...` بساز و در `docs/hardening-patches/` بگذار، سپس با `git apply --check` روی یک clone آزمایشی (`git clone --local . /tmp/check`) اعتبارسنجی کن. ⚠️ برای ۵ فایلی که خطوط repo-only دارند (rate-limit، rate-limit-store، session route، admin-secret، cart-store) پچ کامل درست نمی‌شود — در عوض یک فایل `docs/hardening-patches/MANUAL-MERGE-NOTES.md` بنویس که دقیقاً بگوید کدام خطوط از src باید حفظ شوند (طبق بخش ۱۰ سند مرجع).
2. `git rm -r "New folder"` (فقط بعد از اطمینان از گام ۱).
3. دروازه: verify سبز. commit: `chore: remove stale New folder reference package`.

**فاز ۱ — امنیت و استحکام** (بخش ۴ و ۶ سند مرجع)
1. اعمال ۷ پچ `docs/product-editor-patches/*.patch` (شامل گارد `/api/admin/emojis`، blob filter، http-adapter، ProductImages، کلیدهای storage، gitignore). اعتبارسنجی با `git apply` و تست.
2. اعمال پچ‌های hardening ساخته‌شده در فاز ۰: `security-headers.ts` + `headers()` در `next.config.ts` + `poweredByHeader:false` + `dangerouslyAllowSVG:false`؛ `session-token.ts` (claim `ver` + `getSessionVersion()` + `timingSafeEqual`)؛ `admin-secret.ts` (`assertSafeProductionCredentials` + حداقل ۱۲)؛ `rate-limit.ts`/`rate-limit-store.ts` (`getUsernameKey` per-username — **مرج دستی** با حفظ خطوط repo)؛ `session/route.ts` (Origin check + `no-store` — **مرج دستی**)؛ `eslint.config.mjs` (قاعدهٔ `no-restricted-imports` برای mock-data)؛ `.env.example` (حذف `DATABASE_URL` و متغیرهای بی‌مصرف — خطوط repo را بررسی کن).
   ⚠️ **`src/app/admin/login/page.tsx` را دست نزن** (نسخهٔ src جلوتر است).
3. تست‌های همراه پچ‌ها را به `tests/lib/` منتقل کن (۴ فایل) + `tests/lib/emojis-route-auth.test.ts` بنویس.
4. دروازه: verify سبز (شمارش تست‌ها را ثبت کن). commit: `fix(security): http headers, session revocation, rate-limit per-username, admin emojis guard`.

**فاز ۲ — مرجع قیمت checkout**
1. `src/lib/checkout/price-authority.ts` (با `import 'server-only'`؛ ورودی فقط `{id, quantity}`؛ سقف ۲۰/۵۰؛ رد quote_only/ناموجود/نامعتبر).
2. `src/store/cart-store.ts`: افزودن `pricedAt` + `CartLine`/`PriceSnapshot` (**مرج دستی** — `clearCart` و persist name موجود را حفظ کن).
3. `src/components/checkout/checkout-client.tsx`: در `handleSubmit` به‌جای `totalPrice()` از `repriceCart(items)` استفاده کن؛ ردیف‌های `rejected` را به کاربر نشان بده؛ `totalPrice()` فقط برای نمایش زنده بماند. `cart-client.tsx` هم اگر نیاز بود هماهنگ شود.
4. تست: `tests/lib/price-authority.test.ts` (از پچ + سناریوهای اضافه: ادغام تکراری‌ها، سقف).
5. دروازه: verify سبز. commit: `fix(checkout): server-side price authority (repriceCart)`.

**فاز ۳ — هسته‌های دامنه (انتقال از New folder)** — فقط اگر فاز ۰ هنوز حذفش نکرده باشد، فایل‌ها را از آنجا بردار؛ در غیر این صورت از `docs/hardening-patches` یا محتوای گزارش‌ها بازسازی کن.
1. انتقال گروه A (جدول بخش ۲ گزارش NEW-FOLDER-INTEGRATION): `src/domain/commerce.ts` + `src/lib/domain/commerce-rules.ts` + `src/lib/shipping/{eligibility,validation}.ts` + `src/lib/payments/{payment-rules,provider-contract}.ts` + `src/lib/orders/{label,return-policy}.ts` + `src/lib/customers/customer-segmentation.ts` + `src/types/{shipping,payment,order-fulfillment,customer,checkout-order}.ts` + `src/lib/checkout/address-label.ts`.
2. **حل ۵ تداخل تایپی** (بخش ۷ سند مرجع): `ShippingPaymentMode` منبع واحد در `src/domain/commerce.ts`؛ `OrderStatus` دومی → `FulfillmentOrderStatus`؛ `ShippingMethod` نسخهٔ `types/shipping.ts` بماند (checkout-order حذف شود)؛ `'cod'` vs `'cash_on_delivery'` مپر در لایهٔ مرزی؛ `AuthUser`/`CustomerProfile` مکمل بمانند.
3. تست‌ها: انتقال `commerce-rules.test.ts`، `shipping.test.ts`، `payment-rules.test.ts` به `tests/lib/` (در تست commerce از فیکسچر واقعی به‌جای `as never` استفاده کن) + نوشتن `tests/lib/orders.test.ts` و `tests/lib/customer-segmentation.test.ts`.
4. دروازه: verify سبز. commit: `feat(domain): commerce/shipping/payment/order/customer core rules`.

**فاز ۴ — ادمین واقعی نمونه (settings)**
1. بازنویسی `shipping-settings-page` و `payment-settings-page` با الگوی پروژه: Server Page (`metadata` + `robots noindex`) + Client island + `AdminPageHeader`؛ داده از `mock-adapter` جدید (`src/lib/shipping/mock-adapter.ts`، `src/lib/payments/mock-adapter.ts` — الگو: `src/lib/product-editor/mock-adapter.ts`)؛ اتصال به `isMethodEligible`/`quoteShipping`/`validateShippingMethod` و `validateProvider`/`chooseProvider`.
2. افزودن دو آیتم href در `src/lib/admin/nav.ts` (گروه system؛ حذف از `planned`).
3. تست رندر برای حداقل یکی از صفحات.
4. دروازه: verify سبز. commit: `feat(admin): shipping & payment settings pages wired to domain rules`.

**فاز ۵ — کیفیت**
1. audit `'use client'` (۸۷ فایل): طبقه‌بندی و حذف موارد بی‌مورد (فقط مواردی که بدون شکستن رفتار قابل انتقال‌اند).
2. focus-trap کامل + مدیریت scroll-lock در `product-filters-drawer.tsx` (کامنت `:22`).
3. TipTap lazy: `next/dynamic` برای `RichTextEditor` در `ContentPanel` (بدون وابستگی جدید).
4. `opengraph-image.tsx` با هویت بنفش نئون.
5. `error.tsx`/`loading.tsx` برای سگمنت‌های بدون مرز: blog، brands، services، compare، wishlist، dashboard.
6. آرشیو docs منقضی (`docs/archive/`) + به‌روزرسانی README اشاره به سند مرجع.
7. دروازه: verify سبز. commit: `refactor(quality): client-boundary audit, a11y drawer, lazy tiptap, og-image, error boundaries`.

**فاز ۶ — پایش (فقط با تأیید صریح کاربر — چون وابستگی سنگین Playwright می‌خواهد)**
- در گزارش پایانی پیشنهاد بده و منتظر تأیید بمان؛ چیزی نصب نکن.

### ۶) قواعد فنی (نقض نکن)

1. **از `New folder/saite-product-editor` هیچ‌چیز کپی نکن** — نسخهٔ src در همهٔ فایل‌ها جدیدتر است. (این پوشه در فاز ۰ حذف می‌شود.)
2. فایل‌های پچ سخت‌سازی را `cp` نکن — **diff-merge دستی** برای ۵ فایل با خطوط repo-only (جزئیات در `docs/hardening-patches/MANUAL-MERGE-NOTES.md`).
3. `login/page.tsx` را عوض نکن. هویت بصری را عوض نکن. UI خالص بماند.
4. تست‌ها فقط در `tests/**` (include تنظیم‌شده در vitest.config).
5. `price-authority` را بدون cart-store پچ‌شده نیاور (import `CartLine`).
6. هیچ وابستگی جدیدی بدون تأیید کاربر اضافه نکن (فاز ۶ استثناست).
7. هیچ‌وقت secret/رمز را در کد، کامیت یا گزارش ننویس. هیچ تغییری روی `main` نده — فقط برنچ سشن.
8. صداقت: هیچ نتیجه‌ای را جعل نکن؛ هر چیزی را اجرا نکردی، صریح بگو.

### ۷) گردش کار بعد از هر فاز

```bash
git add -A
git commit -m "<پیام فاز طبق بخش ۵>"
git push origin <برنچ سشن>
```

سپس در همان پاسخ، این بلوک را برای کاربر بده (با برنچ واقعی خودت):

```bash
cd /d/saite
git fetch origin
git checkout <BRANCH>
git pull origin <BRANCH>
npm install --no-audit --no-fund
npm run dev
```

### ۸) خروجی نهایی (بعد از آخرین فاز)

1. جدول خلاصهٔ فازها: فاز | commit | نتیجهٔ verify | تست‌ها (قبل/بعد)
2. به‌روزرسانی `docs/MASTER-REFERENCE-IMPLEMENTATION.md`: تیک زدن فازهای انجام‌شده، به‌روزرسانی Open Items (بخش ۱۳) — موارد حل‌شده حذف، موارد جدید اضافه.
3. سه کار بعدی پیشنهادی.
4. بلوک pull برای کاربر.

---

## ─── پایان ───
