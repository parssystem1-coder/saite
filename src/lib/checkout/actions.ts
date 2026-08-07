'use server'

import { repriceCart as serverRepriceCart } from './price-authority'
import type { RepricedCart } from './price-authority'
import type { CartLine } from '@/store/cart-store'

/**
 * Server Action wrapper for price-authority.
 *
 * چرا جدا از price-authority؟
 * `price-authority.ts` دارای `import 'server-only'` است و نمی‌تواند مستقیماً از
 * یک Client Component ایمپورت شود (build error). این wrapper با `use server`
 * مرز را رعایت می‌کند: Client فقط به یک اکشن اشاره می‌کند، منطق قیمت‌گذاری
 * فقط روی سرور اجرا می‌شود.
 */
export async function repriceCart(lines: CartLine[]): Promise<RepricedCart> {
  return serverRepriceCart(lines)
}
