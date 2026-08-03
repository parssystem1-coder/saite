import type { Product, ProductCardData } from '@/types/product'

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

/** محصول کامل پایه — برای تست‌هایی که به specs/reviews/faqs نیاز دارند */
const baseFullProduct: Product = {
  ...sampleProduct,
  sku: 'CAN-LBP2900',
  shortDescription: 'پرینتر لیزری تک‌رنگ مناسب دفاتر کوچک.',
  description: 'توضیح کامل محصول برای تب توضیحات.',
  specs: [
    { key: 'سرعت چاپ', value: '12 ppm', isTechnical: true },
    { key: 'اندازهٔ کاغذ', value: 'A4' },
  ],
  technology: 'laser',
  colorSupport: 'mono',
  usageClass: 'office',
  warrantyMonths: 18,
  createdAt: '2026-01-01',
}

/**
 * سازندهٔ محصول کامل با امکان بازنویسی هر فیلد.
 * برای تست شاخه‌های شرطی مثل «کالای استعلامی» یا «بدون نظر».
 */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  return { ...baseFullProduct, ...overrides }
}
