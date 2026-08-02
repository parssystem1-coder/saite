# قرارداد لایهٔ داده (Frontend ↔ API)

> **وضعیت:** فاز ۸ — mock کامل با امضای آمادهٔ HTTP  
> **تنها درگاه UI:** `src/lib/api.ts`

---

## اصول

1. **کامپوننت‌ها فقط از `@/lib/api` import می‌کنند.**  
   import مستقیم `@/lib/mock-data` بیرون از `src/lib/` ممنوع است.
2. **امضای توابع ثابت می‌ماند.** هنگام اتصال بک‌اند فقط بدنه عوض می‌شود.
3. **فیلتر و صفحه‌بندی سمت «لایهٔ داده» است** (`getProductList`) — نه داخل UI.

---

## سوییچ mock → HTTP

| متغیر محیطی | پیش‌فرض | معنی |
|-------------|---------|------|
| `NEXT_PUBLIC_USE_MOCK` | (خالی = mock) | با `false` درخواست‌ها به HTTP می‌روند |
| `NEXT_PUBLIC_API_BASE_URL` | خالی | پایهٔ URL مثل `https://api.example.com` |

```bash
# .env.local — فاز بک‌اند
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

اگر mock خاموش باشد و base URL نباشد، `ApiError` با کد `API_NOT_CONFIGURED` پرتاب می‌شود.

---

## توابع اصلی

| تابع | ورودی | خروجی |
|------|--------|--------|
| `getProductList(query)` | `ProductListQuery` | `ProductListResult` |
| `getProducts()` | — | `Product[]` (همه / سازگاری عقب‌رو) |
| `getProductBySlug` / `getProductById` | string | `Product \| undefined` |
| `getFeaturedProducts` / `getBestSellers` | — | `Product[]` |
| `getCompatibleItems(model)` | string | `Product[]` |
| `getSupportedDeviceModels` | — | `{ brand, model }[]` |
| `getRelatedProducts` / `getConsumablesForDevice` | Product | `Product[]` |
| `getProductsByIds` | string[] | `Product[]` |

### `ProductListQuery`

```ts
{
  q?, category?, brand?, technology?, usage?, color?,
  inStock?, minPrice?, maxPrice?, sort?,
  page?, perPage?
}
```

### `ProductListResult`

```ts
{
  items: Product[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
```

---

## نگاشت پیشنهادی HTTP (فاز بعد)

| تابع فرانت | HTTP پیشنهادی |
|------------|----------------|
| `getProductList` | `GET /api/products?...` |
| `getProductBySlug` | `GET /api/products/by-slug/:slug` |
| `getProductById` | `GET /api/products/:id` |
| `getCompatibleItems` | `GET /api/products/compatible?model=` |
| `getProductsByIds` | `GET /api/products/by-ids?ids=a,b` |

خطاها به‌صورت `ApiError(status, message, code?)` نرمال می‌شوند (`src/lib/api-types.ts`).

---

## کاتالوگ UI

```
useProductFilters()  →  filters + page از URL
        ↓
getProductList({ ...filters, page, perPage: 9 })
        ↓
ProductGrid(items) + Pagination(totalPages)
```

`applyFilters` فقط داخل `lib/` (و تست‌های واحد فیلتر) استفاده می‌شود.

---

## چک‌لیست اتصال بک‌اند

- [ ] Route Handler یا BFF برای `/api/products`
- [ ] همان query stringها را بپذیرید
- [ ] قیمت و موجودی را فقط از DB برگردانید
- [ ] `NEXT_PUBLIC_USE_MOCK=false`
- [ ] تست‌های `tests/lib/api-list.test.ts` را با mock HTTP گسترش دهید
