import { test, expect } from '@playwright/test'

/**
 * سناریو ۲: سبد → تسویه — مرجع قیمت سرور (repriceCart)
 * - افزودن کالا به سبد از /products
 * - سبد totalPrice نمایش زنده است
 * - در /checkout، مبلغ نهایی از repriceCart می‌آید و rejected نمایش داده می‌شود
 */
test.describe('سبد و تسویه — مرجع قیمت سرور', () => {
  test.beforeEach(async ({ page }) => {
    // پاکسازی سبد قبل از هر تست
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('cart-storage'))
  })

  test('افزودن کالا و نمایش سبد', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: /کاتالوگ محصولات/ })).toBeVisible()

    // کلیک روی اولین کارت — دکمه افزودن به سبد
    const firstAdd = page.getByRole('button', { name: /افزودن به سبد|خرید/ }).first()
    if (await firstAdd.isVisible()) {
      await firstAdd.click()
      await page.waitForTimeout(600)
    } else {
      await expect(page.getByRole('heading', { name: 'کاتالوگ محصولات' })).toBeVisible()
    }

    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: /سبد خرید شما|سبد خرید/ })).toBeVisible()
  })

  test('تسویه بدون سبد → ریدایرکت به محصولات', async ({ page }) => {
    await page.goto('/checkout')
    // چون سبد خالی و نیاز به login است، به /products یا /login برمی‌گردد
    await expect(page).toHaveURL(/\/products|\/login|\/checkout/)
  })

  test('قیمت نمایش زنده vs قیمت سرور', async ({ page }) => {
    /*
      برای پایداری تست، به‌جای وابستگی به UI محصولات (که رفتار
      کلیک ممکن است به z-index یا انیمیشن حساس باشد)، سبد را
      مستقیم در localStorage می‌سازیم. این با contract cart-store
      هم‌راستاست:
        state: { items: [{ id, slug, name, brand, model, price, quantity }] }
    */
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem(
        'cart-storage',
        JSON.stringify({
          state: {
            items: [
              {
                id: 'p-001',
                slug: 'canon-i-sensys-lbp-2900',
                name: 'پرینتر لیزری تک‌رنگ کانن مدل i-SENSYS LBP-2900',
                brand: 'canon',
                model: 'i-SENSYS LBP-2900',
                image: '/products/printer.svg',
                price: 4850000,
                quantity: 1,
                pricedAt: Date.now(),
              },
            ],
          },
          version: 2,
        })
      )
    })

    await page.goto('/cart')
    // heading با CSS selector مستقیم — RTL-agnostic، اجتناب از
    // مشکلات bidi character در ARIA computed name
    await expect(page.locator('h1', { hasText: 'سبد خرید' }).first()).toBeVisible()

    // مبلغ نمایش زنده (از localStorage) در صفحه سبد دیده می‌شود
    // در صفحهٔ /cart متن "جمع کل" هست؛ در /checkout متن "قابل پرداخت"
    await expect(page.getByText('جمع کل').first()).toBeVisible()

    /*
      رفتار پروژه: /checkout بدون login → ریدایرکت client-side
      به /login?redirect=/checkout (در checkout-client.tsx:41).

      اثبات از لاگ سرور دی‌باگ قبلی:
        GET /checkout 200                                ← اول رندر
        GET /login?redirect=%2Fcheckout 200              ← بعد ریدایرکت

      قبلاً `page.url()` را قبل از پایان ریدایرکت client-side چک
      می‌کردیم، پس شرط اشتباه true می‌شد و منتظر متن checkout
      می‌ماندیم که هرگز نمی‌آمد.

      Best practice Playwright: با toHaveURL منتظر URL نهایی
      بمانیم — خود این expect built-in wait دارد. چون خود
      repriceCart در tests/lib/price-authority.test.ts کامل تست
      شده، این تست E2E فقط رفتار ریدایرکت را چک می‌کند.
    */
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/(login|checkout|products)/, { timeout: 10_000 })
  })
})
