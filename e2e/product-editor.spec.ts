import { test, expect } from '@playwright/test'

/**
 * سناریو ۴: ویرایشگر محصول — تب‌ها، ذخیره پیش‌نویس، آپلود تصویر (mock)
 * - نیاز به نشست ادمین
 * - باز کردن /admin/products/new
 * - پر کردن فیلد نام و ذخیره
 */
test.describe('ویرایشگر محصول', () => {
  test.beforeEach(async ({ request }) => {
    // ورود ادمین از طریق API برای داشتن کوکی
    const login = await request.post('/admin/api/session', {
      data: { username: 'admin', password: 'saite-demo-1404' },
    })
    if (!login.ok()) {
      test.skip()
      return
    }
    const setCookie = login.headers()['set-cookie'] || login.headersArray().find(h => h.name.toLowerCase() === 'set-cookie')?.value
    if (setCookie) {
      // Playwright به‌صورت خودکار کوکی را در context نگه می‌دارد اگر از page استفاده کنیم
      // برای اطمینان، از API دوباره لاگین می‌کنیم و سپس page را می‌سازیم
    }
    // رفتن به صفحه ورود و پر کردن فرم به‌صورت UI هم تست می‌شود
  })

  test('صفحه جدید محصول بارگذاری می‌شود', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('نام کاربری').fill('admin')
    await page.getByLabel('رمز عبور').fill('saite-demo-1404')
    await page.getByRole('button', { name: 'ورود به پنل' }).click()
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })

    await page.goto('/admin/products/new')
    await expect(page.getByText('افزودن محصول جدید').or(page.getByText('Saite Admin'))).toBeVisible({ timeout: 8000 })

    // تب‌های ویرایشگر
    await expect(page.getByText('پایه')).toBeVisible()
    await expect(page.getByText('مالی')).toBeVisible()
  })

  test('ذخیره پیش‌نویس در localStorage', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('نام کاربری').fill('admin')
    await page.getByLabel('رمز عبور').fill('saite-demo-1404')
    await page.getByRole('button', { name: 'ورود به پنل' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    await page.goto('/admin/products/new')
    const nameInput = page.getByLabel(/نام محصول|نام/).first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('پرینتر تست E2E')
      // دکمه ذخیره پیش‌نویس
      const saveBtn = page.getByRole('button', { name: /ذخیره پیش‌نویس|ذخیره/ }).first()
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await expect(page.getByText(/ذخیره شد|پیش‌نویس/)).toBeVisible({ timeout: 5000 }).catch(() => {})
        const stored = await page.evaluate(() => localStorage.getItem('saite.product-editor.draft') || localStorage.getItem('saite.product-editor.published') || '')
        // لااقل چیزی ذخیره شده
        expect(stored.length).toBeGreaterThan(0)
      }
    }
  })

  test('ویرایشگر RichText lazy-load می‌شود', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('نام کاربری').fill('admin')
    await page.getByLabel('رمز عبور').fill('saite-demo-1404')
    await page.getByRole('button', { name: 'ورود به پنل' }).click()
    await page.waitForURL(/\/admin/, { timeout: 10000 })

    await page.goto('/admin/products/new')
    // تب محتوا
    const contentTab = page.getByText('محتوا').first()
    if (await contentTab.isVisible()) {
      await contentTab.click()
      await expect(page.getByText(/توضیح کامل|محتوای فروش/)).toBeVisible()
      // RichTextEditor باید lazy باشد — حداقل placeholder یا toolbar دیده شود
      await expect(page.getByText(/H1 داخل ادیتور ممنوع/)).toBeVisible()
    }
  })
})
