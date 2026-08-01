import type { Metadata } from 'next'
import { CompareClient } from '@/components/compare/compare-client'

export const metadata: Metadata = {
  title: 'مقایسهٔ محصولات',
  description: 'مقایسهٔ مشخصات فنی، قیمت و موجودی چند دستگاه در کنار یکدیگر.',
  robots: { index: false, follow: true },
}

export default function ComparePage() {
  return <CompareClient />
}
