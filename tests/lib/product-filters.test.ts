import { describe, expect, it } from 'vitest'
import { applyFilters, countActiveFilters, filterProducts, sortProducts } from '@/lib/product-filters'
import type { Product } from '@/types/product'

const base: Omit<Product, 'id' | 'slug' | 'model'> = {
  brand: 'canon',
  name: 'دستگاه تست',
  sku: 'TST-001',
  category: 'printer',
  priceType: 'fixed',
  price: 1_000_000,
  stockStatus: 'in_stock',
  images: ['/products/printer.svg'],
  shortDescription: '',
  keyFeatures: [],
  specs: [],
  condition: 'new',
  createdAt: '2026-01-01',
}

const products: Product[] = [
  { ...base, id: '1', slug: 'a', model: 'LBP-2900', price: 5_000_000, createdAt: '2026-03-01' },
  {
    ...base,
    id: '2',
    slug: 'b',
    model: 'M404dn',
    brand: 'hp',
    price: 2_000_000,
    createdAt: '2026-05-01',
    isBestSeller: true,
  },
  {
    ...base,
    id: '3',
    slug: 'c',
    model: 'bizhub 266',
    brand: 'konica-minolta',
    category: 'copier',
    priceType: 'quote_only',
    price: undefined,
    stockStatus: 'on_request',
    createdAt: '2026-02-01',
  },
  {
    ...base,
    id: '4',
    slug: 'd',
    model: 'L3250',
    brand: 'epson',
    price: 9_000_000,
    stockStatus: 'out_of_stock',
    createdAt: '2026-04-01',
  },
]

describe('filterProducts', () => {
  it('بدون فیلتر، همهٔ محصولات را برمی‌گرداند', () => {
    expect(filterProducts(products, {})).toHaveLength(4)
  })

  it('بر اساس دسته فیلتر می‌کند', () => {
    const r = filterProducts(products, { category: 'copier' })
    expect(r).toHaveLength(1)
    expect(r[0].id).toBe('3')
  })

  it('بر اساس برند فیلتر می‌کند', () => {
    expect(filterProducts(products, { brand: 'hp' })).toHaveLength(1)
  })

  it('جستجو روی مدل کار می‌کند (حساس به حروف بزرگ/کوچک نیست)', () => {
    expect(filterProducts(products, { q: 'lbp-2900' })).toHaveLength(1)
  })

  it('جستجو روی SKU هم کار می‌کند', () => {
    expect(filterProducts(products, { q: 'TST' })).toHaveLength(4)
  })

  it('فیلتر «فقط موجود»، کالای ناموجود را حذف می‌کند', () => {
    const r = filterProducts(products, { inStock: true })
    expect(r.map((p) => p.id)).not.toContain('4')
    expect(r).toHaveLength(3)
  })

  it('کالای استعلامی با فیلتر موجودی حذف نمی‌شود', () => {
    const r = filterProducts(products, { inStock: true })
    expect(r.map((p) => p.id)).toContain('3')
  })

  it('مقدار all را به‌عنوان «بدون فیلتر» در نظر می‌گیرد', () => {
    expect(filterProducts(products, { category: 'all', brand: 'all' })).toHaveLength(4)
  })
})

describe('sortProducts', () => {
  it('ارزان‌ترین: کالای استعلامی به انتها می‌رود', () => {
    const r = sortProducts(products, 'price_asc')
    expect(r[0].id).toBe('2')
    expect(r[r.length - 1].id).toBe('3') // بدون قیمت
  })

  it('گران‌ترین: بیشترین قیمت اول', () => {
    expect(sortProducts(products, 'price_desc')[0].id).toBe('4')
  })

  it('جدیدترین بر اساس تاریخ', () => {
    expect(sortProducts(products, 'newest')[0].id).toBe('2')
  })

  it('پرفروش‌ترین، کالای پرفروش را اول می‌آورد', () => {
    expect(sortProducts(products, 'best_selling')[0].id).toBe('2')
  })

  it('آرایهٔ ورودی را تغییر نمی‌دهد', () => {
    const before = products.map((p) => p.id)
    sortProducts(products, 'price_desc')
    expect(products.map((p) => p.id)).toEqual(before)
  })
})

describe('applyFilters', () => {
  it('فیلتر و مرتب‌سازی را با هم اعمال می‌کند', () => {
    const r = applyFilters(products, { category: 'printer', sort: 'price_asc' })
    expect(r.map((p) => p.id)).toEqual(['2', '1', '4'])
  })
})

describe('countActiveFilters', () => {
  it('فیلترهای خنثی را نمی‌شمارد', () => {
    expect(countActiveFilters({ category: 'all', brand: 'all', q: '' })).toBe(0)
  })

  it('فیلترهای فعال را می‌شمارد', () => {
    expect(countActiveFilters({ q: 'canon', category: 'printer', inStock: true })).toBe(3)
  })
})
