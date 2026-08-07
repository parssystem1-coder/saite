import { test, expect, devices } from '@playwright/test'

/**
 * سناریو ۳: فیلتر محصولات — drawer با focus-trap و scroll-lock
 *
 * ── چرا viewport موبایل ──────────────────────────────────────
 * Drawer فیلتر فقط در viewport موبایل (lg breakpoint به پایین)
 * دیده می‌شود. در desktop، پنل فیلتر به‌عنوان sidebar در کنار
 * ثابت است و drawer وجود ندارد.
 *
 * قبلاً این تست‌ها با desktop viewport اجرا می‌شدند و به‌درستی
 * skip می‌کردند (چون دکمه فیلتر مخفی بود) — اما این یعنی هیچ‌وقت
 * واقعاً چیزی چک نمی‌کردیم. حالا با `test.use({ ...devices })`،
 * viewport برای این describe موبایل می‌شود.
 */

// همه تست‌های این describe در viewport موبایل اجرا می‌شوند
test.use({ ...devices['iPhone 13'] })

test.describe('فیلتر محصولات — drawer (موبایل)', () => {
  test('کشوی فیلتر باز و بسته می‌شود', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: /کاتالوگ محصولات/ })).toBeVisible()

    const filterBtn = page.getByRole('button', { name: /فیلتر/ }).first()
    await expect(filterBtn).toBeVisible()
    await filterBtn.click()

    await expect(page.getByRole('dialog', { name: /فیلتر محصولات/ })).toBeVisible()

    // Escape باید ببندد
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /فیلتر محصولات/ })).toBeHidden()
  })

  test('focus-trap داخل drawer', async ({ page }) => {
    await page.goto('/products')

    const filterBtn = page.getByRole('button', { name: /فیلتر/ }).first()
    await expect(filterBtn).toBeVisible()
    await filterBtn.click()

    const dialog = page.getByRole('dialog', { name: /فیلتر محصولات/ })
    await expect(dialog).toBeVisible()

    // پس از باز شدن dialog، فوکوس باید به داخل آن منتقل شود
    // (به دکمه بستن یا اولین عنصر focusable)
    await expect(page.getByRole('button', { name: 'بستن' })).toBeFocused()

    // Tab باید داخل dialog بماند — activeElement همچنان زیر dialog باشد
    await page.keyboard.press('Tab')
    const stillInsideDialog = await page.evaluate(() => {
      const active = document.activeElement
      const dialog = document.querySelector('[role="dialog"][aria-label*="فیلتر"]')
      return dialog?.contains(active) ?? false
    })
    expect(stillInsideDialog).toBe(true)
  })

  test('اسکرول قفل می‌شود هنگام باز بودن', async ({ page }) => {
    await page.goto('/products')

    const filterBtn = page.getByRole('button', { name: /فیلتر/ }).first()
    await expect(filterBtn).toBeVisible()
    await filterBtn.click()

    // پس از باز شدن، body.overflow باید hidden شود
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden')

    // بستن → قفل باید برداشته شود
    await page.keyboard.press('Escape')
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe('hidden')
  })
})

