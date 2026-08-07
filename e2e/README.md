# E2E — Playwright (فاز ۶)

**۴ سناریو کلیدی** — پوشش مرزهای بحرانی که Vitest نمی‌بیند:

| سناریو | فایل | چه چیزی را می‌بندد |
|---|---|---|
| ورود ادمین | `admin-login.spec.ts` | گارد ۳ لایه (proxy→layout→handler)، کوکی httpOnly، rate-limit، emojis guard |
| سبد→تسویه | `cart-checkout.spec.ts` | `totalPrice()` نمایش زنده vs `repriceCart` سرور، rejected |
| فیلترها | `product-filters.spec.ts` | drawer focus-trap + scroll-lock + Escape (a11y فاز ۵) |
| ویرایشگر | `product-editor.spec.ts` | تب‌ها، ذخیره پیش‌نویس در localStorage، RichText lazy |

## اجرا

```bash
# نصب مرورگر (یک‌بار — نیاز به اینترنت)
npx playwright install chromium

# اجرای همه سناریوها (webServer خودکار npm run dev را بالا می‌آورد)
npm run e2e

# حالت تعاملی
npm run e2e:ui

# فقط یک فایل
npx playwright test e2e/admin-login.spec.ts --reporter=list
```

## پیکربندی

- `playwright.config.ts` → `baseURL http://localhost:3000`, `webServer: npm run dev`, `locale fa-IR`, `trace on-first-retry`
- در CI: `reuseExistingServer: false`, `workers: 1`, `retries: 2`

## نکات

- داده‌ها mock هستند — هیچ بک‌اند/DB لازم نیست
- برای تست‌های ادمین، ابتدا از طریق UI به `/admin/login` وارد می‌شویم تا کوکی `saite_admin_session` ست شود؛ سپس به `/admin/products/new` می‌رویم
- اگر شبکه برای دانلود مرورگر در دسترس نبود، تست‌ها با `npx playwright test --list` لااقل syntactically چک می‌شوند
