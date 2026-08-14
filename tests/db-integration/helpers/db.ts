import { prisma } from '@/server/shared/db'
import { execSync } from 'node:child_process'

/**
 * تست‌های integration همیشه روی DATABASE_URL_TEST اجرا می‌شوند (که
 * توسط scripts/run-db-tests.mjs به DATABASE_URL منتقل شده تا سرویس‌هایی
 * که @/server/shared/db را import می‌کنند هم روی همان DB تست بروند).
 * اینجا فقط fail-fast روی ست‌نبودن TEST انجام می‌شود.
 */
export function requireTestDbUrl(): string {
  const url = process.env.DATABASE_URL_TEST
  if (!url) {
    throw new Error(
      'DATABASE_URL_TEST ست نشده است. از `npm run test:db` استفاده کنید (فقط با DATABASE_URL_TEST).'
    )
  }
  return url
}

export const testDbUrl = requireTestDbUrl()

export { prisma }

/** آیا DATABASE_URL_TEST در محیط است؟ */
export function isDbTestEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL_TEST)
}

/**
 * اعمال migrationها روی دیتابیس تست.
 */
export function deployTestDbMigrations(): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  })
}

/**
 * پاک‌سازی کامل جداول بین تست‌ها — فرزندان قبل از والدها (ترتیب FK مهم است).
 */
export async function truncateAllTables(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "outbox_events",
      "inventory_reservations",
      "inventory_adjustments",
      "order_items",
      "orders",
      "coupon_redemptions",
      "coupons",
      "campaigns",
      "payment_intents",
      "invoices",
      "transactions",
      "shipments",
      "customers",
      "inventory_items",
      "products"
    RESTART IDENTITY CASCADE
  `)
}
