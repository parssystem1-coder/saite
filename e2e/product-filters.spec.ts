import { test, expect } from '@playwright/test'

/**
 * سناریو ۳: فیلتر محصولات — drawer با focus-trap و scroll-lock
 *
 * ── چرا فقط viewport override و نه devices['iPhone 13'] ──────
 * spread کردن کل device (`...devices['iPhone 13']`) شامل
 * `defaultBrowserType: 'webkit'` است. این با `channel: 'msedge'`
 * یا `channel: 'chrome'` که کاربران بدون chromium-bundled
 * استفاده می‌کنند تضاد می‌سازد:
 *   Error: browserType.launch: Unsupported webkit channel "msedge"
 *
 * راه‌حل درست: فقط viewport را کوچک کنیم تا Tailwind breakpoint
 * `lg` (1024px) فعال شود و drawer به‌جای sidebar رندر شود.
 * browser type دست‌نخورده می‌ماند.
 */

// همه تست‌های این describe در viewport موبایل اجرا می‌شوند
test.use({
  viewport: { width: 390, height: 844 },
})

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

