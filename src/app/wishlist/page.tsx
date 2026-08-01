import type { Metadata } from 'next'
import { WishlistClient } from '@/components/wishlist/wishlist-client'

export const metadata: Metadata = {
  title: 'علاقه‌مندی‌ها',
  description: 'فهرست کالاهایی که برای بررسی بعدی ذخیره کرده‌اید.',
  robots: { index: false, follow: true },
}

export default function WishlistPage() {
  return <WishlistClient />
}
