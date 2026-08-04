import { describe, expect, it } from 'vitest'
import { firstParam, resolveCatalogHeading } from '@/lib/catalog-heading'

describe('firstParam', () => {
  it('مقدار رشته‌ای را مستقیم برمی‌گرداند', () => {
    expect(firstParam('printer')).toBe('printer')
  })

  it('از آرایه اولین عضو را می‌گیرد', () => {
    expect(firstParam(['printer', 'scanner'])).toBe('printer')
  })

  it('برای undefined مقدار undefined می‌دهد', () => {
    expect(firstParam(undefined)).toBeUndefined()
    expect(firstParam([])).toBeUndefined()
  })
})

describe('resolveCatalogHeading', () => {
  it('بدون فیلتر، عنوان پیش‌فرض کاتالوگ', () => {
    const h = resolveCatalogHeading()
    expect(h.title).toBe('کاتالوگ محصولات')
    expect(h.description.length).toBeGreaterThan(20)
  })

  it('با دسته، نام و توضیح همان دسته را می‌دهد', () => {
    const h = resolveCatalogHeading({ category: 'printer' })
    expect(h.title).toBe('پرینتر')
    expect(h.description).toContain('چاپگر')
  })

  it('با برند، عنوان برند لاتین می‌سازد', () => {
    const h = resolveCatalogHeading({ brand: 'canon' })
    expect(h.title).toBe('محصولات Canon')
    expect(h.description).toContain('کانن')
  })

  it('ترکیب دسته و برند هر دو را در عنوان می‌آورد', () => {
    const h = resolveCatalogHeading({ category: 'printer', brand: 'hp' })
    expect(h.title).toBe('پرینتر HP')
    expect(h.description).toContain('HP')
  })

  it('جستجو بر دسته و برند اولویت دارد', () => {
    const h = resolveCatalogHeading({ q: 'تونر', category: 'printer' })
    expect(h.title).toBe('جستجو: تونر')
  })

  it('دسته یا برند ناشناخته به پیش‌فرض برمی‌گردد', () => {
    const h = resolveCatalogHeading({ category: 'does-not-exist', brand: 'nope' })
    expect(h.title).toBe('کاتالوگ محصولات')
  })

  it('عنوان هر دستهٔ شناخته‌شده یکتاست — بدون عنوان تکراری در sitemap', () => {
    const slugs = ['printer', 'scanner', 'copier', 'fax', 'consumables', 'spare-parts']
    const titles = slugs.map((category) => resolveCatalogHeading({ category }).title)
    expect(new Set(titles).size).toBe(slugs.length)
    expect(titles).not.toContain('کاتالوگ محصولات')
  })
})
