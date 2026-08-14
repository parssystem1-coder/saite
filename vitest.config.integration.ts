import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * پروفایل تست‌های integration واقعی — روی Postgres واقعی.
 *
 * فقط زمانی اجرا می‌شود که DATABASE_URL_TEST ست باشد (در CI با service
 * container postgres:17 یا روی ماشین توسعه با دیتابیس محلی). در غیر این
 * صورت با پیام واضح خارج می‌شود تا تصادفاً با DB تولیدی کار نکند.
 *
 * برخلاف vitest.config.ts اینجا include فقط tests/db-integration است.
 * تست‌های موجود (mock) دست نمی‌خورند.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // فقط سناریوهای DB-دار اجرا می‌شوند — هر فایل در محیط خودش serial
    include: ['tests/db-integration/**/*.{test,spec}.{ts,tsx}'],
    // serial: تسک‌های race یکدست روی همان دیتابیس اجرا شوند
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
    },
  },
})
