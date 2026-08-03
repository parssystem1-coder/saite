import { describe, expect, it } from 'vitest'
import { buildArticleLd } from '@/lib/seo/article-ld'
import { buildBreadcrumbLd } from '@/lib/seo/breadcrumb-ld'
import { buildFaqPageLd } from '@/lib/seo/faq-ld'
import { buildOrganizationLd, buildWebSiteLd } from '@/lib/seo/organization-ld'
import { buildProductLd } from '@/lib/seo/product-ld'
import { absoluteUrl } from '@/lib/seo/site-url'
import { makeProduct } from '../fixtures/product'

describe('buildProductLd', () => {
  it('فیلدهای پایه و brand را می‌سازد', () => {
    const ld = buildProductLd(makeProduct({ brand: 'canon', model: 'LBP-2900', sku: 'SKU-1' }))
    expect(ld['@type']).toBe('Product')
    expect(ld.sku).toBe('SKU-1')
    expect(ld.mpn).toBe('LBP-2900')
    // برند باید نام نمایشی لاتین باشد، نه slug
    expect(ld.brand).toEqual({ '@type': 'Brand', name: 'Canon' })
  })

  it('برای کالای دارای قیمت، offers می‌سازد', () => {
    const ld = buildProductLd(
      makeProduct({ priceType: 'fixed', price: 4_850_000, stockStatus: 'in_stock' })
    )
    const offers = ld.offers as Record<string, unknown>
    expect(offers).toBeDefined()
    expect(offers.price).toBe(4_850_000)
    expect(offers.availability).toBe('https://schema.org/InStock')
  })

  it('کالای استعلامی نباید offers داشته باشد', () => {
    // اگر offers با قیمت خالی ارسال شود، گوگل خطای structured data می‌دهد
    const ld = buildProductLd(makeProduct({ priceType: 'quote_only', price: undefined }))
    expect(ld.offers).toBeUndefined()
  })

  it('کالای ناموجود availability درست می‌گیرد', () => {
    const ld = buildProductLd(
      makeProduct({ priceType: 'fixed', price: 100, stockStatus: 'out_of_stock' })
    )
    const offers = ld.offers as Record<string, unknown>
    expect(offers.availability).toBe('https://schema.org/OutOfStock')
  })

  it('کالای بازسازی‌شده itemCondition درست می‌گیرد', () => {
    const ld = buildProductLd(
      makeProduct({ priceType: 'fixed', price: 100, condition: 'refurbished' })
    )
    const offers = ld.offers as Record<string, unknown>
    expect(offers.itemCondition).toBe('https://schema.org/RefurbishedCondition')
  })

  it('بدون نظر، aggregateRating تولید نمی‌شود', () => {
    const ld = buildProductLd(makeProduct({ reviews: [] }))
    expect(ld.aggregateRating).toBeUndefined()
    expect(ld.review).toBeUndefined()
  })

  it('با نظر، aggregateRating و review می‌سازد', () => {
    const ld = buildProductLd(
      makeProduct({
        reviews: [
          {
            id: 'r1',
            author: 'علی',
            rating: 4,
            body: 'خوب بود',
            createdAt: '2026-01-01',
          },
          {
            id: 'r2',
            author: 'سارا',
            rating: 5,
            body: 'عالی',
            createdAt: '2026-01-02',
          },
        ],
      })
    )
    const rating = ld.aggregateRating as Record<string, unknown>
    expect(rating.ratingValue).toBe(4.5)
    expect(rating.reviewCount).toBe(2)
    expect(ld.review).toHaveLength(2)
  })

  it('تصاویر به URL مطلق تبدیل می‌شوند', () => {
    const ld = buildProductLd(makeProduct({ images: ['/products/printer.svg'] }))
    expect(ld.image).toEqual([absoluteUrl('/products/printer.svg')])
  })
})

describe('buildBreadcrumbLd', () => {
  it('موقعیت‌ها از ۱ شروع و ترتیبی‌اند', () => {
    const ld = buildBreadcrumbLd([
      { name: 'خانه', path: '/' },
      { name: 'پرینتر', path: '/products?category=printer' },
      { name: 'کانن' },
    ])
    const items = ld.itemListElement as Record<string, unknown>[]
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.position)).toEqual([1, 2, 3])
  })

  it('آیتم بدون path فیلد item ندارد — آخرین حلقه لینک نمی‌شود', () => {
    const ld = buildBreadcrumbLd([{ name: 'خانه', path: '/' }, { name: 'صفحهٔ فعلی' }])
    const items = ld.itemListElement as Record<string, unknown>[]
    expect(items[0].item).toBe(absoluteUrl('/'))
    expect(items[1].item).toBeUndefined()
  })
})

describe('buildFaqPageLd', () => {
  it('هر پرسش به Question با acceptedAnswer تبدیل می‌شود', () => {
    const ld = buildFaqPageLd([{ question: 'گارانتی چند ماه است؟', answer: '۱۸ ماه' }])
    const entities = ld.mainEntity as Record<string, unknown>[]
    expect(entities).toHaveLength(1)
    expect(entities[0].name).toBe('گارانتی چند ماه است؟')
    expect(entities[0].acceptedAnswer).toEqual({ '@type': 'Answer', text: '۱۸ ماه' })
  })
})

describe('buildArticleLd', () => {
  it('mainEntityOfPage به URL مطلق مقاله اشاره می‌کند', () => {
    const ld = buildArticleLd({
      title: 'راهنمای خرید پرینتر',
      description: 'چگونه انتخاب کنیم',
      slug: 'printer-buying-guide',
      publishedAt: '2026-01-01',
      author: 'تیم فنی',
    })
    expect(ld.mainEntityOfPage).toBe(absoluteUrl('/blog/printer-buying-guide'))
    expect(ld['@type']).toBe('Article')
  })
})

describe('buildOrganizationLd', () => {
  it('نوع Store با نشانی و تلفن', () => {
    const ld = buildOrganizationLd()
    expect(ld['@type']).toBe('Store')
    expect(ld.telephone).toBeTruthy()
    expect((ld.address as Record<string, unknown>)['@type']).toBe('PostalAddress')
  })

  it('برندهای تأمین‌شده را فهرست می‌کند', () => {
    const brands = buildOrganizationLd().brand as Record<string, unknown>[]
    expect(brands.length).toBeGreaterThan(0)
    expect(brands.map((b) => b.name)).toContain('Canon')
  })
})

describe('buildWebSiteLd', () => {
  it('SearchAction به مسیر جستجوی واقعی اشاره می‌کند', () => {
    const ld = buildWebSiteLd()
    const action = ld.potentialAction as Record<string, unknown>
    const target = action.target as Record<string, unknown>
    expect(String(target.urlTemplate)).toContain('/products?q=')
    expect(action['query-input']).toBe('required name=search_term_string')
  })

  it('publisher به شناسهٔ سازمان ارجاع می‌دهد', () => {
    const website = buildWebSiteLd()
    const org = buildOrganizationLd()
    expect((website.publisher as Record<string, unknown>)['@id']).toBe(org['@id'])
  })
})
