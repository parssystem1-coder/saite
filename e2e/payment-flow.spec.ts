import { test, expect } from '@playwright/test'

/**
 * فاز ۶ — e2e پرداخت با درگاه mock در حالت توسعه.
 *
 * checkout → mock gateway → callback → داشبورد با payment=success
 *
 * ⚠️ فقط در dev-mode با provider mock اجرا می‌شود (PAYMENT_SANDBOX=true و
 * بدون credential واقعی) — در production درگاه‌های واقعی credential دارند
 * و این سناریو اجرا نمی‌شود.
 */
test.describe('پرداخت mock — سناریوی موفق', () => {
  test.skip(
    process.env.NODE_ENV === 'production' || !process.env.PAYMENT_SANDBOX,
    'فقط در dev-mode با درگاه mock'
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('cart-storage'))
  })

  test('checkout → callback mock → داشبورد با payment=success', async ({ page }) => {
    // افزودن کالا به سبد
    await page.goto('/products')
    await page.locator('[data-testid="add-to-cart"]').first().click()
    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout/)

    // شروع پرداخت — دکمهٔ «پرداخت» (بسته به UI)
    await page.getByRole('button', { name: /پرداخت/i }).first().click()

    // در dev-mode با mock، callback مستقیم موفق است و به داشبورد
    // با payment=success ریدایرکت می‌شود.
    await expect(page).toHaveURL(/\/dashboard\?.*payment=success/, { timeout: 15000 })
  })
})
