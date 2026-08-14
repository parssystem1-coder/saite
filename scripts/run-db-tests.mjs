#!/usr/bin/env node
/**
 * اجرای تست‌های db-integration روی Postgres واقعی.
 *
 * فقط وقتی DATABASE_URL_TEST ست باشد اجرا می‌شود؛ در غیر این صورت با
 * پیام واضح خارج می‌شود تا تصادفاً روی DB تولیدی یا بدون DB نرود.
 *
 * نکته: سرویس‌ها از @/server/shared/db (که DATABASE_URL را می‌خواند)
 * استفاده می‌کنند؛ برای اینکه روی دیتابیس تست اجرا شوند، DATABASE_URL را
 * از DATABASE_URL_TEST می‌گیریم.
 */
import { spawnSync } from 'node:child_process'

const testUrl = process.env.DATABASE_URL_TEST
if (!testUrl) {
  console.error(
    '[test:db] DATABASE_URL_TEST ست نشده است. تست‌های db-integration فقط روی دیتابیس تست اجرا می‌شوند.\n' +
      'مثال (bash):  DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/saite_test npm run test:db\n' +
      'مثال (cmd):   set DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/saite_test && npm run test:db'
  )
  process.exit(1)
}

// ابتدا migration ها را روی دیتابیس تست اعمال کن
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  env: { ...process.env, DATABASE_URL: testUrl },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (migrate.status !== 0) {
  console.error('[test:db] prisma migrate deploy شکست خورد.')
  process.exit(migrate.status ?? 1)
}

// سپس vitest با پروفایل integration
const vitest = spawnSync(
  'npx',
  ['vitest', 'run', '--config', 'vitest.config.integration.ts'],
  {
    env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
)
process.exit(vitest.status ?? 1)
