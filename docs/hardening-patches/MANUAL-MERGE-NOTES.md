# یادداشت مرج دستی — پچ‌های سخت‌سازی با خطوط repo-only

> **تاریخ:** ۸ اوت ۲۰۲۶ · **مبنا:** `1f1d8dd` → فایل‌های مرجع در `New folder/saite-arena-final-complete-payment/saite-hardening-patch/files/`
> **چرا دستی؟** ۵ فایل زیر در `src` تغییراتی دارند که در نسخهٔ مرجع پچ هنوز نیستند (یا برعکس). کپی مستقیم (`cp`) این خطوط را پاک می‌کند و رگرسیون می‌سازد. هر مورد باید **diff-merge دستی** شود.

## خلاصه

| # | فایل | خطوط repo-only | راهکار | شدت |
|---|------|---------------|--------|------|
| ۱ | `src/lib/auth/server/rate-limit.ts` | ۱۱ خط (۳ کامنت persist/ری‌استارت + split `x-forwarded-for` + `TRUSTED_PROXY_HOPS` قدیمی) | مرج دستی: `getClientKey` جدید را بیاور ولی `maybeSweep` و `store` قدیمی را نگه دار | 🟠 |
| ۲ | `src/lib/auth/server/rate-limit-store.ts` | ۲۰ خط (مسیر `.next/cache` → `.data` + `resolveRateLimitPath()` + `mode 0o700/0o600` + کامنت `RATE_LIMIT_STORE_PATH`) | مرج دستی: منطق فایل جدید را بیاور ولی `persist` قدیمی که `join(process.cwd(), '.next/cache', ...)` داشت را با `resolveRateLimitPath()` جایگزین کن | 🔴 |
| ۳ | `src/app/admin/api/session/route.ts` | ۱۲ خط (importهای `getClientKey` قدیمی، `failure` بدون `noStore`, `isSameOrigin` نداشت, `consumeRateLimit` فقط IP, بدون `getUsernameKey`) | مرج دستی: `isSameOrigin` + `noStore` + سطل `getUsernameKey` را اضافه کن ولی `recordAuditEvent` و `ADMIN_PROFILE` موجود را نگه دار | 🟠 |
| ۴ | `src/lib/auth/server/admin-secret.ts` | ۱۰ خط (`safeCompare` + `DEFAULT_ADMIN_PASSWORD` کامنت + `IS_TOTP_ENABLED` import قدیمی) | مرج دستی: `assertSafeProductionCredentials()` + `MIN_PRODUCTION_PASSWORD_LENGTH=12` + `AdminConfigError` را اضافه کن، ولی `checkAdminCredentials` موجود که `safeCompare` دارد را بازنویسی نکن | 🟠 |
| ۵ | `src/store/cart-store.ts` | ۳ خط (`clearCart` بدون `lastSyncedAt`, `name: 'cart-storage'` بدون `version/migrate`, `partialize` نداشت) | مرج دستی: `pricedAt` + `CartLine/PriceSnapshot/PriceSyncReport` + `lastSyncedAt` + `toLines/syncPrices` + `version:2/migrate/partialize` را اضافه کن ولی `clearCart: () => set({ items: [] })` قدیمی را به `clearCart: () => set({ items: [], lastSyncedAt: null })` ارتقا بده و نام persist را نگه دار | 🔴 |

---

## جزئیات هر فایل

### ۱) `src/lib/auth/server/rate-limit.ts`

**خطوط repo-only که باید حفظ شوند:**
- `maybeSweep(now)` و `SWEEP_INTERVAL = 64` (در نسخهٔ مرجع جدید هست ولی در قدیمی هم بود؛ تفاوت در کامنت فارسی)
- `getClientKey` قدیمی فقط `split(',')[0]` می‌گیرد؛ نسخهٔ جدید `TRUSTED_PROXY_HOPS` دارد — **باید به نسخهٔ جدید مرج شود** وگرنه pII دور زدن `x-forwarded-for` می‌ماند
- `store: RateLimitStore = process.env.NODE_ENV === 'test' ? createMemoryStore() : createFileStore(...)` — این خط در هر دو یکسان است ولی `DEFAULT_RATE_LIMIT_PATH` به `resolveRateLimitPath()` تغییر کرده

**مرج:**
```ts
// قدیمی:
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown-client'
}

// جدید — جایگزین کامل:
export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const chain = forwarded.split(',').map(p=>p.trim()).filter(Boolean)
    if (chain.length>0) {
      const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '', 10)
      if (Number.isInteger(hops) && hops>0) {
        const index = chain.length - hops
        return chain[index>=0?index:0]!
      }
      return chain[0]!
    }
  }
  return headers.get('x-real-ip')?.trim() || 'unknown-client'
}
export function getUsernameKey(username: string): string {
  return `admin-login-user:${username.trim().toLowerCase()}`
}
export const USERNAME_RATE_LIMIT = { maxAttempts: 30, windowMs: 60*60_000 } as const
```

### ۲) `src/lib/auth/server/rate-limit-store.ts`

**خطوط repo-only:**
- `DEFAULT_RATE_LIMIT_PATH` قدیمی: `join(process.cwd(), '.next/cache', 'saite-rate-limit.json')`
- نسخهٔ جدید: `resolveRateLimitPath()` که اول `RATE_LIMIT_STORE_PATH` را چک می‌کند و بعد `join(process.cwd(), '.data', 'saite-rate-limit.json')`

**مرج:**
- تمام توضیحات فارسی بالای `DEFAULT_RATE_LIMIT_PATH` قدیمی را با نسخهٔ جدید جایگزین کن (بخش «چرا `.next/cache` بیرون آمد»)
- `mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 })` + `writeFileSync(tempPath, JSON.stringify(snapshot), { encoding:'utf8', mode:0o600 })` را اضافه کن
- `export function resolveRateLimitPath(): string { ... }` + `export const DEFAULT_RATE_LIMIT_PATH = resolveRateLimitPath()` را اضافه کن

**⚠️ `.data/` را به `.gitignore` اضافه کن** (پچ ۰۷ جداگانه)

### ۳) `src/app/admin/api/session/route.ts`

**خطوط repo-only:**
- `recordAuditEvent`, `ADMIN_PROFILE`, `checkAdminCredentials`, `IS_TOTP_ENABLED` از قبل وجود دارند — نباید حذف شوند
- `failure()` قدیمی بدون `noStore` و بدون `Cache-Control`

**مرج:**
- `import { AdminConfigError } from '@/lib/auth/server/admin-secret'` اضافه کن
- `import { getUsernameKey, USERNAME_RATE_LIMIT } from '@/lib/auth/server/rate-limit'` (افزودن ۲ import)
- تابع `noStore` و `isSameOrigin` جدید را کامل اضافه کن
- در `POST`: قبل از `consumeRateLimit` اول `isSameOrigin` چک شود → `403`؛ بعد `getUsernameKey(username)` + `consumeRateLimit(usernameKey, USERNAME_RATE_LIMIT...)` → اگر `!allowed` → `429` + `Retry-After`
- `try { result = await checkAdminCredentials(...) } catch (e) { if (e instanceof AdminConfigError) { console.error(...); return failure('ورود به پنل موقتاً غیرفعال است...',503) } throw e }`
- در `DELETE` و `GET` همهٔ `NextResponse.json(...)` را داخل `noStore(...)` بپیچ
- بعد از ورود موفق: `resetRateLimit(rateLimitKey); resetRateLimit(usernameKey);`

### ۴) `src/lib/auth/server/admin-secret.ts`

**خطوط repo-only:**
- `safeCompare` با حلقهٔ `diff |= a.charCodeAt(i) ^ b.charCodeAt(i)` — در نسخهٔ مرجع جدید هم هست ولی کامنتش کوتاه‌تر شده؛ نسخهٔ موجود را نگه دار
- `DEFAULT_ADMIN_USERNAME / DEFAULT_ADMIN_PASSWORD` و `ADMIN_USERNAME / ADMIN_PASSWORD` یکی‌اند

**مرج:**
- `const MIN_PRODUCTION_PASSWORD_LENGTH = 12` اضافه کن
- `export class AdminConfigError extends Error { ... }` کامل اضافه کن
- `export function assertSafeProductionCredentials(): void { if (NODE_ENV !== 'production') return; if (NEXT_PUBLIC_ADMIN_PASSWORD) throw ...; if (IS_USING_DEFAULT_CREDENTIALS) throw ...; if (!IS_PASSWORD_HASHED && ADMIN_PASSWORD.length < 12) throw ... }` کامل اضافه کن
- در `checkAdminCredentials` اول خط `assertSafeProductionCredentials()` را اضافه کن + `@throws {AdminConfigError}` در JSDoc
- کامنت بالای `ADMIN_PASSWORD` را به نسخهٔ جدید (بخش «چرا رمز پیش‌فرض حالا خطا می‌دهد») ارتقا بده

### ۵) `src/store/cart-store.ts`

**خطوط repo-only:**
- `clearCart: () => set({ items: [] })` قدیمی — باید با `lastSyncedAt: null` مرج شود
- `persist` قدیمی فقط `{ name: 'cart-storage' }` بود — نسخهٔ جدید `version:2, migrate, partialize` دارد
- `toCartItem` و `addItem` بدون `pricedAt`

**مرج کامل:**
```ts
export interface CartItem { id, slug, name, brand, model, price, image, quantity, pricedAt?: number }
export interface CartLine { id: string; quantity: number }
export interface PriceSnapshot { id: string; price?: number; priceType: 'fixed'|'quote_only'; stockStatus: string }
export interface PriceSyncReport { changed: {id,from,to}[]; removed: string[] }

interface CartState {
  items: CartItem[]
  lastSyncedAt: number | null
  addItem: ...
  removeItem: ...
  updateQuantity: ...
  clearCart: () => void
  totalPrice: () => number
  itemCount: () => number
  toLines: () => CartLine[]
  syncPrices: (snapshots: PriceSnapshot[]) => PriceSyncReport
}

// در toCartItem:
return { ..., pricedAt: Date.now() }

// در create:
persist((set,get)=>({
  items: [],
  lastSyncedAt: null,
  addItem: ...,
  removeItem: ...,
  updateQuantity: ...,
  clearCart: () => set({ items: [], lastSyncedAt: null }),
  totalPrice: () => ...,
  itemCount: () => ...,
  toLines: () => get().items.map(({id,quantity})=>({id,quantity})),
  syncPrices: (snapshots)=>{ ... }
}), {
  name: 'cart-storage',
  version: 2,
  migrate: (persisted, version)=>{ ... },
  partialize: (state)=>({ items: state.items, lastSyncedAt: state.lastSyncedAt }),
})
```

**⚠️ حفظ `name: 'cart-storage'` الزامی است** — تغییر آن سبد کاربران فعلی را پاک می‌کند.

---

## ترتیب اعمال

1. فاز ۰: این یادداشت را بساز + پچ‌های 01–10 را بساز
2. فاز ۱: پچ‌های 01–04 (next, eslint, env, session-token) را مستقیم `git apply` کن؛ ۵ مورد بالا را **دستی** مرج کن (کپی-پیست بخش‌های ذکرشده)
3. فاز ۲: `06-price-authority-new.patch` + `cart-store` دستی را با هم اعمال کن (وابستگی `CartLine`)
4. بعد از هر فاز: `npm run type-check && npm run lint && npm test && npm run build` سبز → `git commit`

## اعتبارسنجی پیشنهادی

```bash
git clone --local . /tmp/check-saite
cd /tmp/check-saite
git apply --check docs/hardening-patches/01-next-config-security-headers.patch
git apply --check docs/hardening-patches/02-eslint-restricted-imports.patch
git apply --check docs/hardening-patches/04-session-token-revocation.patch
# برای فایل‌های جدید:
git apply --check docs/hardening-patches/05-security-headers-new.patch
git apply --check docs/hardening-patches/06-price-authority-new.patch
```

> نکته: پچ‌های 03 (env) و 07–10 (تست‌ها) هم قابل `git apply --check` هستند ولی روی clone تمیز بدون تغییرات دیگر تست شوند.
