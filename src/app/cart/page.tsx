import type { Metadata } from 'next'
import { CartClient } from '@/components/cart/cart-client'

export const metadata: Metadata = {
  title: 'سبد خرید',
  description: 'بررسی اقلام سبد خرید و ادامهٔ فرایند سفارش.',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return <CartClient />
}
