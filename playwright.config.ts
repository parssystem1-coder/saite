import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E — پیکربندی چندمحیطی.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا سه حالت اجرا داریم
 * ══════════════════════════════════════════════════════════════
 *   ۱. **CI (Docker image رسمی)** — `chromium` bundled از قبل
 *      نصب است. پیش‌فرض بدون تنظیم.
 *
 *   ۲. **توسعه‌دهندهٔ محلی با دسترسی آزاد** — یک بار
 *      `npx playwright install chromium` و بعد از bundle استفاده
 *      می‌شود.
 *
 *   ۳. 🆕 **کاربر ایران/مناطق تحریم CDN Playwright** — دانلود
 *      chromium bundled از cdn.playwright.dev بلاک است (403 از
 *      GCS). راه‌حل: با `PW_CHANNEL=chrome` یا `PW_CHANNEL=msedge`،
 *      از مرورگر سیستمی استفاده می‌شود که از قبل نصب است.
 *
 *      استفاده:
 *        PW_CHANNEL=msedge npm run e2e     # روی هر ویندوز کار می‌کند
 *        PW_CHANNEL=chrome npm run e2e     # اگر Chrome سیستمی دارید
 *
 *      Playwright برای channelها دانلودی انجام نمی‌دهد — فقط از
 *      بایناری سیستمی استفاده می‌کند.
 */

const systemChannel = process.env.PW_CHANNEL as 'chrome' | 'msedge' | undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /*
    یک بار retry حتی در محلی: dev server Next.js با Turbopack گاهی
    اولین request به یک route را ~۲ ثانیه compile می‌کند. اگر
    تست موازی همزمان چند مسیر جدید بزند، بعضی timeout می‌خورند.
    یک تلاش دوم آن‌ها را می‌گیرد بدون آنکه flake را قایم کند —
    اگر تست واقعاً شکسته باشد، هر دو تلاش fail می‌کنند.
  */
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'fa-IR',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /*
          اگر PW_CHANNEL ست باشد، از مرورگر سیستمی استفاده می‌شود
          (بدون دانلود). در غیر این صورت، از chromium bundled خود
          Playwright — که در CI موجود و در محلی با
          `npx playwright install chromium` دانلود می‌شود.
        */
        ...(systemChannel ? { channel: systemChannel } : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
