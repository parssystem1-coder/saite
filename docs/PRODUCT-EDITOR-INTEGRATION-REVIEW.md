# Product Editor Integration Review — Saite (parssystem1-coder/saite)

> 📌 **وضعیت:** این سند شواهد پشتیبان است. نسخهٔ نهایی تلفیقی (شامل مقایسه با نظر Copilot و نقشهٔ اجرا) → `docs/MASTER-REFERENCE-IMPLEMENTATION.md`
>
> **بررسی:** تحلیل عمیق `New folder/saite-product-editor` در برابر پیاده‌سازی `src/` + راستی‌آزمایی چک‌لیست Copilot
> **تاریخ:** ۷ اوت ۲۰۲۶ · **برنچ:** `arena/019fdc47-saite` · **وضعیت:** فقط تحلیل + patch پیشنهادی — هیچ تغییری روی کد اعمال نشده
> **شواهد:** diff دوجهتهٔ واقعی، اجرای `type-check/lint/test/build`، اعمال آزمایشی پچ‌ها در clone مجزا (apply ✓، type-check ✓، lint ✓)

---

## 1) Executive Summary

**نظر Copilot در یک جمله:** «بستهٔ New folder نسخهٔ اصلاح‌شدهٔ Product Editor است؛ آن را عمیقاً با src مقایسه کن، ریسک‌ها را شناسایی کن و با patch امن ادغامش کن.»

**حکم این بررسی (با شواهد):** **فرض اصلی Copilot وارونه است.** از ۱۲ فایلی که بین «New folder/saite-product-editor» و `src/` تفاوت دارند، **در هر ۱۲ نسخهٔ `src/` جدیدتر/درست‌تر است** و «New folder» یک **اسنپ‌شات قدیمی و خراب** از همان کد است:

- `src/` حاوی تمام «اصلاحات»ای است که README بسته ادعا می‌کند (fallback به mock-adapter، حذف props بی‌استفاده از SeoPanel، import صحیح تیپ‌تپ، `subCategory` در تایپ‌ها، metadata صفحه).
- «New folder» یک فایل **خراب** دارد (`RichTextEditor.tsx:1` با `\'use client\';`) که به‌تنهایی `type-check` را می‌شکند و در مسیر فعلی‌اش به‌خاطر alias `@/` اصلاً قابل compile نیست.

پس **ادغام «New folder → src» نه‌تنها لازم نیست، مضر است.** اما چک‌لیست Copilot ۷ مشکل واقعی را درست نشانه گرفته که **در هر دو نسخه وجود دارند** (یعنی در `src/` هم باید رفع شوند): فیلتر blob در JSON-LD، مقاوم‌سازی http-adapter، گارد احراز هویت روی `/api/admin/emojis`، revoke بلاب و دسترس‌پذیری مرتب‌سازی تصاویر، منبع واحد کلیدهای localStorage، و کمبود تست. این ۷ مورد را به‌صورت **۷ پچ آماده و قابل `git apply`** (در `docs/product-editor-patches/`) تحویل می‌دهم که همگی در clone آزمایشی اعمال، type-check و lint شده‌اند.

**نتیجه:** **REJECT بسته به‌صورت فعلی** + **ACCEPT انتخابی ۷ پچ روی `src/`** + **حذف «New folder» بعد از انتقال**. برآورد تلاش: **~۷ ساعت**.

---

## 2) Files audited

| بسته (New folder) | معادل در src | نتیجهٔ diff |
|---|---|---|
| `src/lib/product-editor/adapter.types.ts` | `src/lib/product-editor/adapter.types.ts` | src جلوتر (حذف import بی‌استفاده `ProductImage`) |
| `src/lib/product-editor/mock-adapter.ts` | همان | src جلوتر (همان حذف import) — رفتار یکسان |
| `src/lib/product-editor/http-adapter.ts` | همان | src جلوتر (همان حذف import) — helper در هر دو ضعیف است |
| `src/components/admin/products/ProductEditor.tsx` | همان | **src جلوتر**: fallback به mock-adapter، import CSS، z-index اصلاح‌شده |
| `…/components/ProductImages.tsx` | همان | یکسان به‌جز کامنت eslint در src — **هر دو بدون revoke/a11y** |
| `…/components/RichTextEditor.tsx` | همان | **«New folder» خراب** (`\'use client\'`) + import قدیمی؛ src منوی راست‌کلیک جدول دارد |
| `…/panels/BasePanel.tsx` | همان | **src جلوتر**: دسته‌ها از `CATEGORIES` با auto-subCategory |
| `…/panels/ContentPanel.tsx` | همان | **src جلوتر**: تیپ‌تپ + uploadImage/emojis |
| `…/panels/SeoPanel.tsx` | همان | **src جلوتر**: props بی‌استفاده حذف شده |
| `…/product-editor.constants.ts` | همان | **src جلوتر**: `INITIAL_DRAFT.category='printer'` + `subCategory:'laser-mono'` |
| `…/product-editor.types.ts` | همان | **src جلوتر**: `subCategory: string` در ProductDraft |
| `…/product-editor.utils.ts` | همان | **یکسان** — `buildProductSchema` در هر دو بدون فیلتر blob |
| `src/app/admin/(panel)/products/new/page.tsx` | همان | **src جلوتر**: metadata + robots |
| `src/app/api/admin/emojis/route.ts` | همان | **یکسان — در هر دو بدون گارد احراز هویت** |
| فایل‌های یکسان (AttributeTable, EditorField, EditorSection, EditorToggle, FaqEditor, JsonLdPreview, ProductSidebar, ProductTabs, SeoScore, CommercePanel, LogisticsPanel, MediaPanel, SpecsPanel, css) | همان | ✅ یکسان — بدون ریسک |
| `README.md`، `MOCK-ADAPTER-GUIDE.txt`، `FILES.txt`، `DEPENDENCIES.txt` | — | مستندات بسته؛ دو ادعای README **نادرست** است (بند ۳) |

---

## 3) Key findings

### ۳.۱. تحلیل نظر Copilot — بندبه‌بند (راستی‌آزمایی چک‌لیست)

| # | بند چک‌لیست Copilot | حکم | شواهد |
|:-:|---|---|---|
| ۱ | Duplicate types / single source of truth | 🟢 درست، ولی **معکوس**: src نسخهٔ تمیز است؛ diff فقط یک import بی‌استفاده در New folder است | `diff adapter.types.ts` → خط ۱ |
| ۲ | Mock adapter behavior (lazy, SSR, revoke) | 🟡 نیمه‌درست: lazy و SSR-safe **از قبل در src هست** (randomUUID داخل تابع + گارد window)؛ ولی revoke و کلیدهای مرکزی **در هر دو غایب است** | `mock-adapter.ts:4-6,11-13` |
| ۳ | HTTP adapter robustness | 🟢 **درست و واقعی**: json helper در هر دو نسخه بدون timeout/AbortController/بدنهٔ خطاست | `http-adapter.ts` (کامل) |
| ۴ | buildProductSchema / JSON-LD blob | 🟢 **درست و واقعی**: هیچ فیلتر blob در هیچ‌کدام نیست — ادعای README بسته («فیلتر کردن blob URL از JSON-LD») **کذب است** | `product-editor.utils.ts:44` → `image: images.map(i => i.preview)` |
| ۵ | INITIAL_DRAFT / subCategory | 🟢 مشاهده‌اش درست: src=`printer`+`laser-mono`، New folder=`printer-laser-hp` بدون subCategory؛ اما **راه‌حلش وارونه است**: `subCategory` در ۵+ نقطهٔ src مصرف دارد (فیلترها، چیپ‌ها، BasePanel) و مقدار `printer-laser-hp` در `CATEGORIES` وجود ندارد؛ باید نسخهٔ **src** بماند و New folder رد شود — نه mapper | `constants.ts:21-22`، `product-filters.ts:14-15,37-38`، `product-active-chips.tsx:55-60`، `BasePanel.tsx:26` |
| ۶ | ProductImages drag/drop | 🟡 نیمه‌درست: drag/drop و reorder **در هر دو هست** (یکسان)؛ ولی revoke، بررسی حجم، خطای آپلود و دسترس‌پذیری کیبورد **در هر دو غایب** است | `ProductImages.tsx:14-16,25` |
| ۷ | Imports & alias | 🟢 درست: `tsconfig.json` → `@/* → ./src/*` ✅؛ فایل‌های بسته با `@/` کار می‌کنند **فقط اگر به src منتقل شوند** — در مسیر فعلی compile نمی‌شوند (به‌علاوه فایل خراب) | `tsconfig.json` paths |
| ۸ | امنیت route ایموجی‌ها | 🟢 **درست و بحرانی**: route در هر دو نسخه **بدون هیچ گاردی** است؛ `proxy.ts` matcher فقط `/admin/:path*` است و `/api/admin/emojis` را نمی‌پوشاند → هر ناشناسی می‌تواند POST بزند و روی دیسک سرور بنویسد | `emojis/route.ts` (کامل)، `proxy.ts:config.matcher` |
| ۹ | CI / verify | 🟢 درست: در حضور New folder، type-check و build **شکسته‌اند** (خروجی خام در بند ۶) | این بررسی |
| ۱۰ | Tests coverage gap | 🟢 درست: فقط ۱ تست smoke برای ProductEditor هست؛ adapters/schema/ProductImages صفر تست | `tests/components/product-editor.test.tsx` |
| ۱۱ | localStorage keys & migration | 🟢 درست: کلیدها (`product-id`, `draft`, `published`, `duplicate-*`) پراکنده‌اند و مستند نیستند | `mock-adapter.ts:4-18` |

**جمع‌بندی نظر Copilot:** چک‌لیست از نظر مهندسی خوب است و ۷ شکاف واقعی را پیدا کرده؛ اما **نتیجه‌گیری «ادغام New folder در src» بر پایهٔ فرض غلط «New folder = نسخهٔ اصلاح‌شده» است** و اگر کورکورانه اجرا شود، کد src را به نسخهٔ قدیمی‌تر و خراب برمی‌گرداند (regression). مسیر درست: پچ‌های Copilot را مستقیماً روی `src/` اعمال کن (نه از طریق بسته).

### ۳.۲. یافته‌های مثبت (در src)

- لایهٔ adapter تمیز است: `ProductEditorAdapter` قرارداد ثابت، mock/http جدا، `'use client'` فقط در کامپوننت‌ها.
- `mock-adapter` از قبل SSR-safe است (`read()` گارد `typeof window` دارد؛ `crypto.randomUUID()` و `URL.createObjectURL` فقط داخل توابع async اجرا می‌شوند — lazy).
- تمام ۱۴ فایل یکسان بین دو نسخه، یعنی هستهٔ ویرایشگر پایدار است.
- `ProductEditor.tsx` در src از `createMockProductEditorAdapter()` به‌صورت fallback استفاده می‌کند — یعنی بدون بک‌اند هم کار می‌کند.

### ۳.۳. یافته‌های منفی (شکاف‌های واقعی — در هر دو نسخه)

1. 🔴 `/api/admin/emojis` بدون احراز هویت — نوشتن روی دیسک سرور (`.data/custom-emojis.json`).
2. 🟠 `buildProductSchema` بلاب‌ها را در `image[]` می‌فرستد.
3. 🟠 `http-adapter` بدون timeout/AbortController/جزئیات خطا.
4. 🟠 `ProductImages`: بدون `revokeObjectURL` (نشت حافظه)، بدون سقف حجم، بدون خطای آپلود، مرتب‌سازی فقط drag (بدون کیبورد).
5. 🟡 کلیدهای localStorage پراکنده و بی‌سند.
6. 🟡 تست: فقط ۱ تست smoke؛ صفر تست برای adapters/schema/emojis route.
7. 🟡 `.data/` در `.gitignore` نیست — فایل‌های runtime ممکن است commit شوند.
8. 🟡 README بسته حاوی ۲ ادعای نادرست («فیلتر blob در JSON-LD»، «فعال شدن مرتب‌سازی واقعی تصاویر») — سند نباید مرجع تصمیم باشد.

---

## 4) Critical fixes required (با patch آماده)

همهٔ پچ‌ها در `docs/product-editor-patches/` هستند، روی clone آزمایشی `git apply` شده و **type-check + lint سبز** شده‌اند (شواهد بند ۶).

| پچ | فایل | خلاصه |
|---:|---|---|
| `01-jsonld-blob-filter.patch` | `src/components/admin/products/product-editor.utils.ts` | فیلتر `blob:` از آرایهٔ `image` در `buildProductSchema` |
| `02-http-adapter-robustness.patch` | `src/lib/product-editor/http-adapter.ts` | json helper با `AbortController` (timeout ۱۵s)، خطای دارای `status` + `detail` (body پارس‌شده)، خطای اختصاصی timeout |
| `03-emojis-route-auth-guard.patch` | `src/app/api/admin/emojis/route.ts` | گارد `getAdminSession()` روی GET و POST → 401 |
| `04-product-images-revoke-a11y.patch` | `.../components/ProductImages.tsx` | `revokeObjectURL` در remove + پاک‌سازی unmount، سقف ۲MB با پیام خطا، دکمه‌های ↑↓ با `aria-label` و `disabled`، `onKeyDown` روی dropzone |
| `05-storage-keys-constants.patch` | `src/lib/product-editor/constants.ts` (جدید) | `PRODUCT_EDITOR_STORAGE` — منبع واحد کلیدها |
| `06-mock-adapter-storage-keys.patch` | `src/lib/product-editor/mock-adapter.ts` | استفاده از ثابت‌های بند ۵ به‌جای رشته‌های پراکنده |
| `07-gitignore-data.patch` | `.gitignore` | افزودن `.data/` |

نمونهٔ کلیدی (کامل پچ‌ها در فایل‌ها):

```ts
// 01 — utils.ts
image: images.map(image => image.preview).filter(url => !url.startsWith('blob:')),

// 02 — http-adapter.ts
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), timeoutMs)
// ... fetch با signal؛ روی !ok: error.status = response.status؛ error.detail = await response.json()
// روی AbortError: throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`)

// 03 — emojis/route.ts
import { getAdminSession } from '@/lib/auth/server/admin-session'
// در ابتدای GET و POST:
const admin = await getAdminSession()
if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

// 04 — ProductImages.tsx (خلاصه)
const remove = (id) => { const t = images.find(i => i.id === id)
  if (t?.preview.startsWith('blob:')) { URL.revokeObjectURL(t.preview); blobUrls.current = ... } ... }
// + useEffect cleanup در unmount + سقف 2MB + دکمه‌های ↑↓ با aria-label + onKeyDown dropzone
```

> ⚠️ پچ‌ها عمداً روی `src/` نوشته شده‌اند، نه روی «New folder». **هرگز از روی بسته کپی نکنید** — بند ۲ نشان می‌دهد نسخهٔ بسته قدیمی‌تر است.

---

## 5) Tests to add (فایل‌ها + سناریوها)

| فایل پیشنهادی | سناریوها (assertionهای کلیدی) |
|---|---|
| `tests/lib/product-editor-mock-adapter.test.ts` | saveDraft → کلید `saite.product-editor.draft` در localStorage با `savedAt`؛ publish → `published`؛ `uploadImage` → URL با پیشوند `blob:`؛ `duplicate` → کلید `duplicate-*`؛ مقدار پیش‌فرض هنگام نبود داده |
| `tests/lib/product-editor-http-adapter.test.ts` | mock `fetch`: 200 → پارس JSON؛ 500 با body → `error.status===500` و `error.detail` برابر body؛ reject شبکه → propagate؛ abort (شبیه‌سازی با `vi.useFakeTimers` یا signal) → پیام timeout |
| `tests/lib/product-editor-schema.test.ts` | `buildProductSchema` با تصاویر `blob:...` و `https://...` → خروجی `image` فقط URLهای stable؛ بدون تصویر → آرایهٔ خالی |
| `tests/components/product-images.test.tsx` | add از input (File با type/size) → آیتم جدید با `sortOrder` درست؛ فایل >۲MB → پیام خطا و بدون تغییر؛ remove → حذف + فراخوانی `URL.revokeObjectURL` (spy)؛ drag reorder → ترتیب و sortOrder؛ دکمهٔ ↑↓ → جابه‌جایی و `disabled` در لبه‌ها |
| `tests/lib/emojis-route-auth.test.ts` | بدون کوکی نشست → 401؛ با نشست معتبر (mock `getAdminSession`) → 200؛ POST با ایموجی >۸ کاراکتر → 422 |

+ گسترش `tests/components/product-editor.test.tsx` (۱ تست فعلی) با: رندر شدن تب‌ها با `aria-selected`، ذخیرهٔ پیش‌نویس با کلیک و تأثیر بر localStorage.

---

## 6) CI & verify report (خروجی خام + تحلیل)

**اجرای واقعی روی برنچ فعلی (با حضور «New folder»):**

```
$ npm run type-check
New folder/saite-product-editor/src/components/admin/products/components/RichTextEditor.tsx(1,1): error TS1127: Invalid character.
New folder/saite-product-editor/src/components/admin/products/components/RichTextEditor.tsx(1,16): error TS1002: Unterminated string literal.
→ EXIT=1   (علت: خط اول فایل «\'use client\';» — کوئوت escape‌شده)

$ npm run lint
eslint src --max-warnings=0  → EXIT=0 (صفر خطا — lint فقط src را می‌بیند)

$ npm test
Test Files  52 passed (52)
Tests       496 passed (496)
→ EXIT=0

$ npm run build
./New folder/saite-arena-final-complete-payment/07-shipping-settings/src/app/admin/(panel)/settings/shipping/page.tsx:2:38
Type error: Cannot find module '@/components/admin/shipping/shipping-settings-page'
→ EXIT=1   (علت دوم: alias @/ در فایل‌های خارج از src)
```

**تحلیل:** هر دو خطا **ناشی از خود پوشهٔ «New folder»** است، نه کد src. اثبات: با کنار گذاشتن موقت پوشه، `type-check → EXIT=0` و `build → EXIT=0` (۶۰ route) — و بعد از اعمال ۷ پچ در clone آزمایشی، type-check روی `src/` بدون خطای جدید و lint روی همهٔ فایل‌های پچ‌شده سبز شد. یعنی: `verify` فقط پس از حذف/انتقال «New folder» سبز می‌شود.

---

## 7) Security notes

1. 🔴 **`/api/admin/emojis` بدون گارد** — matcher پروکسی فقط `/admin/:path*` است (شواهد: `proxy.ts` انتهای فایل) و route زیر `/api/admin/` می‌نشیند؛ هر بازدیدکننده‌ای می‌تواند POST کند و `.data/custom-emojis.json` را روی دیسک سرور بنویسد (همچنین بدون rate limit). **پچ ۰۳** این را با `getAdminSession()` (کوکی `httpOnly` + `sameSite=strict` موجود در `session-token.ts:37`) می‌بندد.
2. `.data/` خارج از gitignore است (پچ ۰۷) — فایل‌های runtime ممکن است سهواً commit شوند.
3. هیچ `import 'server-only'` در بسته نیست و کامپوننت‌ها `'use client'` هستند → **هیچ کد سرور در باندل کلاینت نیست** ✅ (در پچ‌ها هم اضافه نمی‌شود).
4. توصیهٔ Copilot دربارهٔ `NEXT_PUBLIC_ENABLE_MOCK_EDITOR`: لازم نیست — mock/http از قبل با `createMock...`/`createHttp...` انتخاب می‌شوند و route ادمین با نشست محافظت می‌شود. اگر روزی routeهای `/api/admin/*` بیشتری اضافه شد، matcher پروکسی را به‌روز کن (کامنت خود پروکسی همین را می‌گوید).
5. `crypto.randomUUID()` در `mock-adapter` فقط در مرورگر (context امن) اجرا می‌شود؛ روی HTTP غیرمحلی ممکن است undefined باشد — ریسک Low؛ در صورت نیاز یک fallback `Date.now()+random` اضافه شود (الزامی نیست).

---

## 8) Merge plan (قدم‌به‌قدم)

```bash
# ۰) شاخهٔ کاری از همین برنچ سشن
cd /d/saite
git fetch origin
git checkout arena/019fdc47-saite
git pull origin arena/019fdc47-saite
git checkout -b review/product-editor-fixes

# ۱) اعمال ۷ پچ (روی src — نه روی New folder)
git apply docs/product-editor-patches/*.patch

# ۲) افزودن تست‌های بند ۵ (فایل‌ها را بنویس و در tests/ بگذار)

# ۳) حذف بستهٔ قدیمی از درخت git (بعد از اطمینان از انتقال همهٔ چیزهای لازم)
git rm -r "New folder"

# ۴) دروازه‌های کیفیت — باید همه سبز شوند
npm run type-check && npm run lint && npm test && npm run build

# ۵) commit + PR
git add -A
git commit -m "fix(product-editor): apply hardening patches; drop stale New folder"
git push origin review/product-editor-fixes
# PR: از review/product-editor-fixes به arena/019fdc47-saite (یا main طبق جریان شما)
```

> چک‌لیست PR: ۷ پچ اعمال‌شده ✓ · تست‌های جدید سبز ✓ · `verify` سبز بدون New folder ✓ · `docs/product-editor-patches/` در PR هست ✓ · هیچ تغییری در `docs/` منقضی خارج از این گزارش نیست ✓

---

## 9) Final recommendation

**حکم: REJECT (بسته به‌صورت فعلی) + ACCEPT انتخابی (۷ پچ روی src) + DELETE (بعد از اعمال).**

- **رد می‌شود:** کل `New folder/saite-product-editor` — چون اسنپ‌شات قدیمی‌تر از src است، یک فایل خراب دارد که دروازه‌ها را می‌شکند، و هیچ قابلیتی در آن نیست که src نداشته باشد.
- **پذیرفته می‌شود:** ۷ پچ بند ۴ (همه روی `src/`)، که شکاف‌های واقعی مشترک هر دو نسخه را می‌بندند + تست‌های بند ۵.
- **قدم بعدی:** اعمال پچ‌ها → تست‌ها → حذف «New folder» → `verify` → PR. (با تأیید شما؛ الان فقط تحلیل است.)

**حذف کنیم یا نگه داریم (پاسخ یک‌پاراگرافی):** **حذف کنید.** این بسته یک «پکیج مستقل» نیست (هیچ package.json، هیچ مرز باندل و هیچ نسخه‌بندی خودش را ندارد؛ صرفاً snapshot از `src/` است)، در ریشهٔ ریپو قرار گرفتنش type-check و build را برای همیشه می‌شکند (فایل خراب + alias)، و نگه‌داشتنش به‌عنوان `contrib/` هم فقط دو نسخهٔ واگرا از یک کد می‌سازد که منبع خطای بعدی است — قانون «یک منبع حقیقت» همین‌جا تصمیم را می‌گیرد: بعد از اعمال پچ‌ها، بسته حذف شود و در صورت نیاز نسخهٔ سورس‌اش خارج از ریپو (مثلاً در نسخه‌پشتیبان شخصی شما) بماند.

---

## 10) Estimated effort (hours) & PR checklist

| بخش | تلاش (ساعت) |
|---|:---:|
| تشخیص و diff دوجهته (انجام شد) | ۰ |
| پچ ۰۱ (blob filter) + تست | ۰٫۵ |
| پچ ۰۲ (http-adapter) + تست‌های خطا | ۱ |
| پچ ۰۳ (گارد route) + تست | ۰٫۵ |
| پچ ۰۴ (ProductImages: revoke/a11y/حجم) + تست | ۱٫۵ |
| پچ ۰۵–۰۶ (کلیدهای ذخیره‌سازی) + تست | ۰٫۷۵ |
| پچ ۰۷ (gitignore) | ۰٫۱ |
| تست‌های بند ۵ (۵ فایل + گسترش smoke) | ۱٫۵ |
| حذف New folder + verify + commit/PR + به‌روزرسانی docs | ۰٫۷۵ |
| **جمع (با احتیاط ~۱۵٪)** | **≈ ۷ ساعت** |

**PR checklist:** `verify` سبز ✓ · تست‌های جدید ≥ ۲۰ مورد ✓ · lint صفر هشدار ✓ · هیچ فایلی از «New folder» کپی نشده ✓ · `docs/product-editor-patches/` همراه PR ✓ · خروجی build شامل ۶۰ route (بدون تغییر) ✓
