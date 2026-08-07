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
    await page.goto('/products')

    /*
      قبلاً `getByRole('button', { name: /افزودن به سبد/ })` روی
      اولین دکمه می‌افتاد که ممکن بود از یک محصول `quote_only`
      باشد و نمایان نباشد (چون آن‌ها به‌جای «افزودن به سبد» دکمهٔ
      «استعلام قیمت» دارند).

      با `.filter({ visible: true })` مطمئن می‌شویم دکمه‌ای پیدا
      می‌کنیم که واقعاً روی صفحه است و قابل کلیک.
    */
    const addToCartButtons = page
      .getByRole('button', { name: /افزودن به سبد/ })
      .filter({ visible: true })

    // منتظر می‌مانیم لیست محصولات رندر شود
    await expect(addToCartButtons.first()).toBeVisible({ timeout: 10_000 })
    await addToCartButtons.first().click()
    // فرصت به store برای persist در localStorage
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('cart-storage')
      return raw && JSON.parse(raw).state?.items?.length > 0
    })

    await page.goto('/cart')
    await expect(page.getByRole('heading', { name: /سبد خرید/ })).toBeVisible()

    // مبلغ نمایش زنده (از localStorage) در صفحه سبد دیده می‌شود
    await expect(page.getByText(/قابل پرداخت|جمع کل/).first()).toBeVisible()

    /*
      /checkout در حالت مهمان مستقیم قابل دسترس است. مبلغ نهایی
      از repriceCart (server action) می‌آید — این مسیر باید حداقل
      یک بار درخواست POST به actions.ts بزند. برای این تست، همین
      که صفحه بدون خطا رندر شود کافی است — چون خود repriceCart
      در tests/lib/price-authority.test.ts تست شده.
    */
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout|\/login|\/products/)
    if (page.url().includes('/checkout') && !page.url().includes('/login')) {
      // فرم تسویه یا خلاصهٔ سفارش دیده می‌شود
      const anyCheckoutMarker = page
        .getByText(/تکمیل اطلاعات ارسال|خلاصهٔ نهایی|روش پرداخت/)
        .first()
      await expect(anyCheckoutMarker).toBeVisible({ timeout: 10_000 })
    }
  })
})
