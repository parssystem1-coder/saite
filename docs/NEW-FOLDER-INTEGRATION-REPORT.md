# گزارش تحلیل همگامسازی «New folder» با پروژهٔ اصلی — چه چیزی پیاده شود و چگونه

> 📌 **وضعیت:** این سند شواهد پشتیبان است. نسخهٔ نهایی تلفیقی (شامل مقایسه با نظر Copilot و نقشهٔ اجرا) → `docs/MASTER-REFERENCE-IMPLEMENTATION.md`
>
> **نقش:** Senior Frontend Architect · **تاریخ:** ۷ اوت ۲۰۲۶ · **برنچ:** `arena/019fdc47-saite`
> **روش:** بازبینی فایل‌به‌فایل هر ۱۰ زیربستهٔ «New folder» (۱۰۹ فایل) + بررسی فایل‌های مرتبط `src/` + diff دوجهته با نسخهٔ مرج‌شده + تأیید سازگاری (تایپ‌ها، tokenها، آیکون‌ها، alias تست) + شواهد `npm run type-check/test/build` (گزارش قبلی: `docs/REVIEW-2026-08-07.md`)
> **دامنه:** فقط تحلیل — هیچ تغییری اعمال نشده است.

---

## ۱) خلاصه مدیریتی — حکم در یک نگاه

| گروه | محتوا | حکم | اولویت |
|---:|---|---|:---:|
| **A. هسته‌های pure** | domain-foundation · shipping lib · payments lib · orders lib · customers lib · checkout-order/address-label | ✅ **پیاده شود** — بعد از جابه‌جایی فیزیکی به `src/` + تست‌ها به `tests/` | ۲–۴ |
| **B. پچ سخت‌سازی** | security-headers · session revocation · rate-limit per-username · price-authority · cart-store جدید · next.config/eslint | ✅ **پیاده شود** — باارزش‌ترین بسته؛ ۶ فایل از ۸ فایل «جایگزین» جلوتر از `src/` هستند (شواهد diff پایین) | **۱** |
| **C. صفحات ادمین settings** | shipping-settings-page · payment-settings-page | 🟡 **بازنویسی شود** — UI دموی استاتیک است؛ باید به الگوی پروژه (Server Page + Client island) و به libهای خودشان وصل شود | ۵ |
| **D. تکراری/خراب/بدون‌کد** | saite-product-editor · admin-login-hardening · order-fulfillment (صفر کد) · HTML previewها · docs منقضی | ❌ **حذف/رد شود** — نسخه‌های داخل `src/` جدیدترند یا فایل خراب دارند | ۶ |

**نکتهٔ کلیدی:** «New folder» یک **پچ امنیتی آماده + پایهٔ دامنهٔ آزمایش‌شده** است که از `src/` جلوتر است، اما نه یک بستهٔ کامل قابل‌کپی. بهترین عملکرد: **انتقال انتخابی با diff-merge و اتصال به نقاط موجود پروژه**، نه کپی کل پوشه.

---

## ۲) گروه A — هسته‌های pure: پیاده‌سازی مستقیم (بعد از جابه‌جایی)

همهٔ این فایل‌ها **بدون وابستگی خارجی** (فقط `@/types/...` و vitest) هستند؛ در `src/` هیچ تداخل نامی ندارند (تأیید شد: `grep` روی `src/types` و `src/lib/schemas.ts` → فقط `PaymentMethod` موجود است که این ماژول‌ها از همان `@/lib/schemas` import می‌کنند).

| # | فایل بسته | مقصد در پروژه | ارزش برای پروژه | نکتهٔ انتقال |
|:-:|---|---|---|---|
| A1 | `08-domain-foundation/src/domain/commerce.ts` | `src/domain/commerce.ts` | **پایهٔ همه‌چیز**: OrderSnapshot، InventoryReservation، AddressSnapshot، idempotencyKey — قرارداد فاز بک‌اند و checkout | بدون تغییر |
| A1 | `08-domain-foundation/src/lib/domain/commerce-rules.ts` | `src/lib/domain/commerce-rules.ts` | قواعد خالص: جمع پول (با محافظ CURRENCY_MISMATCH)، lifecycle رزرو موجودی، assertOrderTotals | بدون تغییر |
| A1 | `08-domain-foundation/tests/commerce-rules.test.ts` | `tests/lib/commerce-rules.test.ts` | ۶ تست | ⚠️ تست از `as never` استفاده می‌کند — پاس می‌شود ولی در انتقال، فیکسچر واقعی بنویس |
| A2 | `07-shipping-settings/src/types/shipping.ts` | `src/types/shipping.ts` | مدل کامل روش ارسال: ۳ مدل پرداخت، ۶ مدل قیمت‌گذاری، zone، carrier | بدون تغییر |
| A2 | `07-shipping-settings/src/lib/shipping/eligibility.ts` | `src/lib/shipping/eligibility.ts` | `isMethodEligible` + `quoteShipping` — **مغز منطقی checkout و ادمین** | بدون تغییر |
| A2 | `07-shipping-settings/src/lib/shipping/validation.ts` | `src/lib/shipping/validation.ts` | اعتبارسنجی فرم روش ارسال (برای ادمین) | بدون تغییر |
| A2 | `07-shipping-settings/tests/shipping.test.ts` | `tests/lib/shipping.test.ts` | ۳ تست | بدون تغییر |
| A3 | `09-payment-gateways/src/types/payment.ts` | `src/types/payment.ts` | PaymentProvider/PaymentIntent/Refund — قرارداد درگاه | بدون تغییر |
| A3 | `09-payment-gateways/src/lib/payments/payment-rules.ts` | `src/lib/payments/payment-rules.ts` | validateProvider، canTransitionPayment، assertPaymentAmount (ضد دستکاری مبلغ)، chooseProvider (fallback) | بدون تغییر |
| A3 | `09-payment-gateways/src/lib/payments/provider-contract.ts` | `src/lib/payments/provider-contract.ts` | قرارداد adapter (create/verify/refund/health) — **قرارداد، نه پیاده‌سازی واقعی** | بدون تغییر |
| A3 | `09-payment-gateways/tests/payment-rules.test.ts` | `tests/lib/payment-rules.test.ts` | ۵ تست | بدون تغییر |
| A4 | `orders-complete-package/src/types/order-fulfillment.ts` | `src/types/order-fulfillment.ts` | بسته‌بندی چندتایی، مرجوعی، لیبل A6 | بدون تغییر |
| A4 | `orders-complete-package/src/lib/orders/label.ts` | `src/lib/orders/label.ts` | `buildPostalLabelData` — دادهٔ لیبل از snapshot | بدون تغییر |
| A4 | `orders-complete-package/src/lib/orders/return-policy.ts` | `src/lib/orders/return-policy.ts` | ماشین وضعیت مرجوعی + محاسبهٔ مبلغ بازپرداخت | بدون تغییر |
| A4 | — | `tests/lib/orders.test.ts` | **باید نوشته شود** (بسته تست ندارد) | جدید |
| A5 | `customers-module-package/src/types/customer.ts` | `src/types/customer.ts` | CustomerProfile کامل (CRM) — **مکمل** `AuthUser` حداقلی (`src/types/user.ts:11-16`) | بدون تغییر |
| A5 | `customers-module-package/src/lib/customers/customer-segmentation.ts` | `src/lib/customers/customer-segmentation.ts` | deriveCustomerSegments (VIP/repeat/at-risk/…) | بدون تغییر |
| A5 | — | `tests/lib/customer-segmentation.test.ts` | **باید نوشته شود** (بسته تست ندارد) | جدید |
| A6 | `cart-checkout-shipping-package/src/types/checkout-order.ts` | `src/types/checkout-order.ts` | ShippingAddress/CheckoutOrderDraft | ⚠️ `ShippingMethod` اینجا با `ShippingMethod` در `types/shipping.ts` **تداخل نامی** دارد — بخش ۵ |
| A6 | `cart-checkout-shipping-package/src/lib/checkout/address-label.ts` | `src/lib/checkout/address-label.ts` | `formatPrintableAddress` — آماده‌سازی لیبل چاپی | بدون تغییر |

### اتصال به پروژهٔ اصلی (شواهد)

- **قیمت/موجودی:** `repriceCart` (گروه B) به `getProductsByIds` در `src/lib/api.ts:185` وصل می‌شود و فیلدهای `priceType`/`price`/`stockStatus` در `src/types/product.ts:87-92` دقیقاً مطابق انتظار آن هستند ✅
- **آدرس:** `checkoutSchema` (`src/lib/schemas.ts:189-203`) فیلدهای `receiverName/phone/province/city/address/postalCode/note` دارد و `ShippingAddress` (A6) همان‌ها را دارد + `unit?` — سازگار ✅
- **تست‌ها:** `vitest.config.ts` شامل `include: ['tests/**/*.{test,spec}.{ts,tsx}']` و alias `@ → ./src` است؛ بنابراین تست‌ها **باید در `tests/` ریپو کپی شوند** تا با `npm test` اجرا شوند (تست‌های داخل بسته الان اجرا نمی‌شوند). استاب `server-only` هم در `tests/stubs/server-only.ts` موجود است (نیاز `price-authority`) ✅

---

## ۳) گروه B — پچ سخت‌سازی: پیاده‌سازی با اولویت ۱

### ۳.۱. جدول مرج per-file (با شواهد diff دوجهته)

اندازه‌گیری: «خطوط فقط در پچ» vs «خطوط فقط در repo» — هر کدام بیشتر باشد، آن نسخه جلوتر است.

| فایل | پچ جلوتر | repo جلوتر | راهکار | شاهد |
|---|:---:|:---:|---|---|
| `next.config.ts` | ✅ کامل | — | **انتقال کامل** (هدر امنیتی روی همهٔ مسیرها + `poweredByHeader:false` + `dangerouslyAllowSVG:false`) | repo فعلی فقط ۳۸۶ بایت، صفر `headers()` |
| `eslint.config.mjs` | ✅ کامل | — | **انتقال کامل** (قاعدهٔ معماری `no-restricted-imports`: ممنوعیت import مستقیم `mock-data` — تبدیل «توافق» به «قانون») | repo بدون این قاعده است |
| `src/lib/auth/server/session-token.ts` | ۹۵ | ۲ (فقط کامنت) | **انتقال کامل** — اضافه شدن claim `ver` (`getSessionVersion()` از `ADMIN_SESSION_VERSION`) + `timingSafeEqual` → **ابطال نشست با عوض کردن رمز** | پچ: `ver: getSessionVersion()` |
| `src/lib/auth/server/admin-secret.ts` | ۷۸ | ۱۰ | **انتقال کامل** — `assertSafeProductionCredentials()`: در production بدون `ADMIN_PASSWORD`/`ADMIN_USERNAME` خطای ۵۰۳ + حداقل طول ۱۲ | پچ: `MIN_PRODUCTION_PASSWORD_LENGTH = 12` |
| `src/lib/auth/server/rate-limit.ts` | ۷۸ | ۱۱ (کامنت + `x-forwarded-for` split) | **مرج دستی** — انتقال `getUsernameKey` (سقف per-username برای حملهٔ توزیع‌شده) و حفظ خطوط repo | پچ: `admin-login-user:${username}` |
| `src/lib/auth/server/rate-limit-store.ts` | ۴۱ | ۲۰ | **مرج دستی** — ۲۰ خط repo-only را قبل از جایگزینی ببین (رفتار persist روی دیسک) | — |
| `src/app/admin/api/session/route.ts` | ۱۱۳ | ۱۲ | **مرج دستی** — انتقال: بررسی Origin (لایهٔ دوم CSRF) + `Cache-Control: no-store` روی پاسخ نشست | پچ: `response.headers.set('Cache-Control', …)` |
| `src/store/cart-store.ts` | ۱۴۷ | ۳ | **انتقال کامل** — اضافه شدن `pricedAt`، `CartLine`، `PriceSnapshot`؛ قرارداد: سبد فقط `{id, quantity}` مرجع است | پچ: `pricedAt?: number` |
| `src/lib/checkout/price-authority.ts` | جدید | — | **اضافه شود** + `tests/lib/price-authority.test.ts` — تنها مرجع مبلغ قابل پرداخت؛ ورودی عمداً فقط `id`+`quantity` | پچ: `repriceCart(lines: CartLine[])` |
| `tests/lib/security-headers.test.ts` · `session-revocation.test.ts` · `rate-limit-username.test.ts` | جدید | — | **اضافه شوند** به `tests/` | ۴ تست |
| `.env.example` | ✅ | — | **انتقال** — حذف `DATABASE_URL` (خط ۱۹ repo فعلی — خارج از محدودهٔ فرانت) و متغیرهای بی‌مصرف | diff تأیید شد |
| `src/app/admin/login/page.tsx` | — | ✅ جلوتر | **دست نزنید** — نسخهٔ repo دارای importهای `ADMIN_PASSWORD`/`IS_DEMO_MODE` و robots است که پچ ندارد | diff: ۸a9, ۹a11 |

### ۳.۲. چرا این گروه اولویت ۱ است (تأثیر/هزینه)

| مشکل | شدت | تأثیر | هزینه |
|---|:---:|---|:---:|
| صفر هدر امنیتی HTTP (بدون CSP/X-Frame-Options/Referrer-Policy) | 🔴 | XSS/clickjacking سطح باز | کم (کد آماده + تست) |
| نشست غیرقابل ابطال (عوض کردن رمز، کوکی قبلی را نمی‌بندد) | 🔴 | نشست دزدیده‌شده عمر نامحدود دارد | کم |
| مبلغ پرداخت از `localStorage` (`checkout-client.tsx:26,61` → `totalPrice()`) | 🔴 | دستکاری قیمت با DevTools | متوسط (اتصال به checkout) |
| rate limit فقط per-IP | 🟠 | حملهٔ توزیع‌شده | کم |
| CSRF لایهٔ دوم + کش‌پذیری پاسخ نشست | 🟠 | جعل درخواست/نشست کش‌شده | کم |

> ⚠️ `price-authority.ts` به `CartLine` از **نسخهٔ پچ cart-store** import می‌کند — این دو **باید با هم** منتقل شوند. چون `import 'server-only'` دارد، استاب vitest موجود (`tests/stubs/server-only.ts`) آن را در تست پوشش می‌دهد ✅

---

## ۴) گروه C — صفحات ادمین settings: بازنویسی، نه کپی

### ۴.۱. شکاف‌ها (شواهد)

| مشکل | شاهد |
|---|---|
| کل صفحه `'use client'` است — خلاف الگوی «Server Page + Client island» | `payment-settings-page.tsx:1` و `shipping-settings-page.tsx:1` |
| هدر اختصاصی دارد — پروژه `AdminPageHeader` دارد (الگوی `src/app/admin/(panel)/settings/page.tsx:14-20`) | هر دو فایل |
| داده‌ها دموی هاردکد — **به libهای خودشان وصل نیستند**: دکمهٔ «افزودن» هیچ‌کاره، `demo[]` ثابت، `quoteShipping`/`validateShippingMethod` هرگز صدا زده نمی‌شوند | `shipping-settings-page.tsx`: جدول `demo` + تابع `Badge` |
| در `src/lib/admin/nav.ts:309-331` فقط زیرمنوی «تنظیمات» با `planned: ['ارسال و درگاه پرداخت']` هست — لینک واقعی وجود ندارد | `nav.ts:326-331` |
| `metadata` بدون `robots: { index: false }` — الگوی admin این را دارد | `settings/page.tsx:7-10` |

### ۴.۲. شکل درست بعد از بازنویسی (بهترین عملکرد همگام‌سازی)

```
src/app/admin/(panel)/settings/shipping/page.tsx     ← Server Page: metadata(+robots) + <ShippingSettingsClient/>
src/app/admin/(panel)/settings/payments/page.tsx     ← Server Page: metadata(+robots) + <PaymentSettingsClient/>
src/components/admin/shipping/shipping-settings-page.tsx   ← 'use client' island (بدون هدر اختصاصی)
src/components/admin/payments/payment-settings-page.tsx
src/lib/shipping/mock-adapter.ts                     ← الگوی آماده: src/lib/product-editor/mock-adapter.ts (localStorage)
src/lib/payments/mock-adapter.ts
src/lib/admin/nav.ts                                 ← دو href جدید در گروه system + حذف از planned
tests/components/shipping-settings-page.test.tsx     ← تست رندر + اتصال به adapter
```

اتصال‌های منطقی که بازنویسی باید ایجاد کند:
- تب «روش‌های ارسال» → `isMethodEligible`/`quoteShipping` از `@/lib/shipping/eligibility`
- ذخیره/افزودن → `validateShippingMethod` از `@/lib/shipping/validation` + adapter
- تب «درگاه‌ها» → `validateProvider`/`chooseProvider` از `@/lib/payments/payment-rules`

سازگاری ظاهری تأیید شده: tokenهای `surface-3d`، `bg-surface-1`، `bg-stock-in/15`، `bg-stock-low/15` در `src/app/globals.css` موجودند ✅ و همهٔ آیکون‌های lucide استفاده‌شده (`Truck`, `MapPinned`, `ShieldCheck`, `Settings2`, `CreditCard`, `Activity`, `Plus`) در `node_modules/lucide-react` موجودند ✅

---

## ۵) گروه D — حذف/رد شدن (با دلیل)

| مورد | دلیل |
|---|---|
| `saite-product-editor/` (کل بسته) | **قدیمی‌تر از `src/`** — diff: نسخهٔ src دارای fallback به mock-adapter، import فایل CSS و z-index اصلاح‌شده است؛ یک فایل خراب هم دارد (`RichTextEditor.tsx:1` با `\'use client\'` → شکستن tsc) |
| `admin-login-hardening/files/src/app/admin/login/page.tsx` | repo جلوتر است (diff: ۸a9، ۹a11) |
| `order-fulfillment-package/` | **صفر کد سورس** — فقط SPEC + HTML preview |
| HTML previewهای همهٔ بسته‌ها | طبق `00-ARENA-INSTRUCTIONS/FINAL-NOTES.md` خود بسته: «فایل‌های HTML پیش‌نمایش reference هستند، نه جایگزین API» |
| `docs/ARCHITECTURE_REVIEW.md` (۱۳۶۲ خط) و `docs/UI_SHELL_AUDIT_AND_PLAN.md` | منقضی — وضعیت گذشته را توصیف می‌کنند (گارد ادمین، h1 محصولات، error.tsx همگی الان موجودند) |
| «New folder» پس از انتقال موارد A/B/C | نگه‌داشتن آن در ریپو = شکستن دائمی type-check/build (اثبات‌شده در گزارش قبلی) |

---

## ۶) تحلیل تداخل تایپ‌ها و یکپارچه‌سازی (مهم‌ترین بخش همگام‌سازی)

بررسی روی `src/` فعلی + ماژول‌های جدید — ۵ نقطهٔ تداخل/تکرار که هنگام ادغام باید یک‌جا حل شوند:

| # | تداخل | محل‌ها | راهکار |
|:-:|---|---|---|
| ۱ | `ShippingPaymentMode` سه‌بار تعریف شده (یک union) | `domain/commerce.ts` · `types/shipping.ts` · (ضمنی در `payment.ts` به‌صورت `PaymentMethodCode`) | **منبع واحد:** `src/domain/commerce.ts`؛ `types/shipping.ts` از آن import کند؛ در گروه C هم استفاده شود |
| ۲ | `OrderStatus` دو بار با اعضای متفاوت | `domain/commerce.ts` (چرخهٔ سفارش) · `types/order-fulfillment.ts` (وضعیت fulfillment) | هر دو لازم‌اند؛ مورد دوم را به `FulfillmentOrderStatus` تغییر نام بده تا سردرگمی پیش نیاید |
| ۳ | `ShippingMethod` دو شکل متفاوت | `types/checkout-order.ts` (union: `'post'\|'tipax'\|…`) · `types/shipping.ts` (interface کامل) | نسخهٔ `types/shipping.ts` نگه‌دارنده است؛ نسخهٔ checkout-order حذف شود (فعلاً هیچ مصرف‌کننده‌ای ندارد) |
| ۴ | `'cod'` (UI/schema) vs `'cash_on_delivery'` (دامنه) | `src/lib/schemas.ts:184` vs `types/payment.ts` + `types/shipping.ts` | enum دامنه منبع واحد + مپر در لایهٔ مرزی (فاز بک‌اند) — همین الان در `customerShippingMessage` (`commerce-rules.ts`) استفاده می‌شود |
| ۵ | `AuthUser` حداقلی vs `CustomerProfile` غنی | `src/types/user.ts:11-16` vs `customers-module-package/src/types/customer.ts` | **مکمل‌اند، نه رقیب** — `AuthUser` برای نشست، `CustomerProfile` برای CRM ادمین؛ بدون تغییر بمانند |

نقاط اتصال بدون تداخل (تأییدشده ✅): `repriceCart ↔ getProductsByIds (api.ts:185) ↔ priceType/price/stockStatus (product.ts:87-92)` · `checkoutSchema ↔ ShippingAddress` · `payment-rules ↔ types/payment` · استاب `server-only` در vitest · alias `@` در vitest.config.

---

## ۷) ترتیب بهینهٔ پیاده‌سازی (فازبندی پیشنهادی — برای بعد از تأیید شما)

> قانون هر فاز: `npm run type-check && npm run lint && npm test && npm run build` سبز + push روی `arena/019fdc47-saite`

| فاز | محتوا | خروجی قابل اندازه‌گیری | چرا این ترتیب |
|:---:|---|---|---|
| **۱** | گروه B: security-headers + next.config + session-token (ver) + admin-secret + rate-limit (username) + session route (Origin/cache) + cart-store پچ + price-authority + اتصال `checkout-client.tsx:61` به `repriceCart` + ۴ تست + eslint.config + .env.example | ۴ فایل جدید، ۵ فایل ارتقا، ۴ تست جدید؛ `totalPrice()` دیگر مرجع پرداخت نیست | امنیت و مرجع قیمت — بیشترین ریسک با کمترین وابستگی |
| **۲** | گروه A1: domain/commerce + commerce-rules + تست (با فیکسچر واقعی به‌جای `as never`) | ۲ فایل + ۶ تست | پایهٔ تایپی همهٔ فازهای بعد |
| **۳** | گروه A2+A3: shipping + payments (types/libs/tests) + حل تداخل ۱ و ۴ (بخش ۶) | ۶ فایل + ۸ تست | مغز منطقی checkout/ادمین |
| **۴** | گروه A4+A5+A6: orders + customers + checkout-order/address-label + حل تداخل ۲ و ۳ + نوشتن تست‌های جاافتاده | ۷ فایل + ~۵ تست جدید | آماده‌سازی فاز ادمین |
| **۵** | گروه C: صفحات settings با بازنویسی + mock-adapterها + لینک nav + تست رندر | ۲ صفحهٔ واقعی در پنل | UI فقط روی لایهٔ منطقیِ فاز ۲–۳ سوار شود |
| **۶** | گروه D: حذف «New folder» از git + آرشیو docs منقضی + به‌روزرسانی `docs/` | `verify` سبز بدون پوشه؛ درخت تمیز | آخرین قدم چون پوشه دیگر لازم نیست |

---

## ۸) ریسک‌ها و خطاهای رایج هنگام پیاده‌سازی

1. **کپی کورکورانهٔ فایل‌های «جایگزین» پچ** — `rate-limit-store.ts` و `rate-limit.ts` و `session/route.ts` خطوط repo-only دارند (۲۰/۱۱/۱۲ خط) که ممکن است اصلاحات بعدی باشند؛ **diff-merge دستی** لازم است، نه `cp`.
2. **جابه‌جایی تست‌ها به جای اشتباه** — اگر تست‌ها داخل بسته بمانند، `npm test` آن‌ها را نمی‌بیند (include فقط `tests/**`).
3. **آوردن `price-authority` بدون cart-store پچ** — import `CartLine` می‌شکند؛ حتماً با هم.
4. **آوردن صفحات settings بدون اتصال به lib** — UI بی‌ارزشی می‌سازد که «دکمه‌ای که کاری نمی‌کند» دارد؛ خلاف انتظار شما از کیفیت.
5. **حل نکردن تداخل‌های بخش ۶** — `OrderStatus`/`ShippingMethod` تکراری بعداً در فاز بک‌اند هزینهٔ سنگین می‌سازند.
6. **نگه‌داشتن «New folder»** — حتی بعد از انتقال، وجود آن در ریپو type-check/build را می‌شکند (فایل خراب RichTextEditor). باید از درخت خارج شود.
7. **پیاده‌سازی adapter پرداخت واقعی (زرین‌پال و…) ** — خارج از محدوده؛ فقط `provider-contract` قرارداد است و فعلاً باید همین‌طور بماند.

---

## ۹) جمع‌بندی — «به نفع ماست» به ترتیب اولویت

1. **پچ سخت‌سازی (گروه B)** — بالاترین ارزش به کمترین هزینه: هدرهای امنیتی، ابطال نشست، rate-limit هوشمند، و مهم‌تر از همه **`price-authority`** که تنها شکاف «مبلغ از localStorage» را می‌بندد.
2. **domain-foundation (A1)** — پایهٔ تایپی که همهٔ ماژول‌های بعدی (و فاز بک‌اند) روی آن می‌نشینند؛ کوچک، خالص، تست‌شده.
3. **shipping + payments rules (A2, A3)** — مغز منطقی checkout و ادمین؛ بدون UI، فقط قرارداد و قواعد با ۸ تست.
4. **orders + customers + address-label (A4–A6)** — آماده‌سازی فاز ادمین سفارش‌ها/مشتریان؛ نیاز به نوشتن چند تست جاافتاده.
5. **صفحات settings (C)** — فقط بعد از فازهای ۲–۳ و با بازنویسی طبق الگوی پروژه (Server Page + Client island + mock-adapter + لینک nav).
6. **حذف کامل**: saite-product-editor، admin-login-hardening، order-fulfillment، HTML previewها، و در نهایت خودِ «New folder» پس از انتقال.

**نتیجهٔ نهایی:** از ۱۰ زیربسته، **۴ بسته ارزش پیاده‌سازی دارند** (hardening، domain، shipping، payments)، **۲ بسته ارزش مشروط** دارند (orders/customers با نوشتن تست)، **۱ بسته ارزش مشروط با بازنویسی** دارد (settings UI)، و **۳ بسته باید حذف شوند** (product-editor، admin-login-hardening، order-fulfillment). مجموعاً حدود **۲۰ فایل سورس + ۱۲–۱۵ تست** به `src/` اضافه می‌شود — همه با الگوها و نقاط اتصال موجود پروژه سازگار.
