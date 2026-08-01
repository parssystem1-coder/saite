import { Metadata } from 'next'
import { ProductsClient } from '@/components/products/products-client'

export const metadata: Metadata = {
  title: 'کاتالوگ محصولات',
  description: 'لیست کامل محصولات هوشمند و دیجیتال با بهترین قیمت و ضمانت اصالت کالا.',
}

export default function ProductsPage() {
  return <ProductsClient />
}
