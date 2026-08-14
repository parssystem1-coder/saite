import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    // تست‌های db-integration فقط با `npm run test:db` (روی Postgres واقعی)
    // اجرا می‌شوند — در `npm run test` (با mock) نباید لود شوند.
    exclude: [
      'tests/db-integration/**',
      'node_modules/**',
      'dist/**',
      '.next/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      /*
        `server-only` یک بستهٔ نشانه‌گذار است که هنگام ایمپورت از
        کلاینت عمداً throw می‌کند. Next.js با شرط `react-server`
        نسخهٔ خالی را می‌دهد، اما Vitest آن شرط را ندارد و نسخهٔ
        throw کننده را برمی‌دارد.

        این alias همان کاری را می‌کند که Next روی سرور می‌کند:
        ماژول خالی. بدون این، هر تستی که به لایهٔ سرور برسد
        می‌شکند — و آن لایه دقیقاً همان جایی است که رمز در آن است
        و بیشترین نیاز به تست دارد.
      */
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
    },
  },
})
