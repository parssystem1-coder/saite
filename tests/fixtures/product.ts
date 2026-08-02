import type { ProductCardData } from '@/types/product'

/** محصول نمونهٔ خریدنی برای تست UI */
export const sampleProduct: ProductCardData = {
  id: 'p-test-1',
  slug: 'canon-i-sensys-lbp-2900',
  brand: 'canon',
  model: 'LBP-2900',
  name: 'پرینتر لیزری کانن LBP-2900',
  category: 'printer',
  priceType: 'fixed',
  price: 4_850_000,
  compareAtPrice: 5_300_000,
  stockStatus: 'in_stock',
  images: ['/products/printer.svg'],
  keyFeatures: ['۱۲ ppm', 'A4', 'USB'],
  condition: 'new',
}

/** کالای فقط‌استعلامی */
export const quoteOnlyProduct: ProductCardData = {
  ...sampleProduct,
  id: 'p-test-quote',
  slug: 'konica-minolta-bizhub-266',
  model: 'bizhub 266',
  name: 'دستگاه کپی کونیکا مینولتا',
  priceType: 'quote_only',
  price: undefined,
  compareAtPrice: undefined,
  stockStatus: 'on_request',
}
