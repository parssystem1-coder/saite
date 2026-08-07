import { test, expect, type Page } from '@playwright/test'

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
 *
 * ── چرا CSS selector به‌جای getByRole برای dialog ────────────
 * `getByRole('dialog', { name: /فیلتر محصولات/ })` روی متن فارسی
 * RTL گاهی fail می‌شود چون ARIA accessible name توسط مرورگر
 * محاسبه می‌شود و ممکن است شامل کاراکترهای bidi (U+200E/U+200F)
 * یا نرمال‌سازی متفاوت باشد که با regex ما match نکند.
 *
 * اثبات: در تست 'اسکرول قفل' که سبز شد، از
 * `document.querySelector('[role="dialog"][aria-label*="فیلتر"]')`
 * مستقیم روی DOM استفاده کردیم و کار کرد. `page.locator` با CSS
 * attribute selector همان کار را می‌کند و RTL-agnostic است.
 */

// همه تست‌های این describe در viewport موبایل اجرا می‌شوند
test.use({
  viewport: { width: 390, height: 844 },
})

test.describe('فیلتر محصولات — drawer (موبایل)', () => {
  /** locator یکتای دکمهٔ toolbar که drawer را باز می‌کند */
  const openFilterButton = (page: Page) =>
    page.locator('button[aria-haspopup="dialog"]', { hasText: 'فیلترها' })

  /** locator dialog بر پایهٔ DOM attribute (نه ARIA computed name) */
  const filterDialog = (page: Page) =>
    page.locator('[role="dialog"][aria-label*="فیلتر"]')

  test('کشوی فیلتر باز و بسته می‌شود', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: /کاتالوگ محصولات/ })).toBeVisible()

    const filterBtn = openFilterButton(page)
    await expect(filterBtn).toBeVisible()
    await filterBtn.click()

    await expect(filterDialog(page)).toBeVisible()

    // Escape باید ببندد
    await page.keyboard.press('Escape')
    await expect(filterDialog(page)).toBeHidden()
  })

  test('focus-trap داخل drawer', async ({ page }) => {
    await page.goto('/products')

    const filterBtn = openFilterButton(page)
    await expect(filterBtn).toBeVisible()
    await filterBtn.click()

    const dialog = filterDialog(page)
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

    const filterBtn = openFilterButton(page)
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

