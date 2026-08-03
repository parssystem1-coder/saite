import { describe, expect, it } from 'vitest'
import { CATEGORY_ICONS, getCategoryIcon } from '@/lib/category-icons'
import { CATEGORIES } from '@/lib/constants'
import { SERVICE_DETAILS, SERVICE_SUMMARIES } from '@/lib/services-data'

describe('getCategoryIcon', () => {
  it('🔑 هر دستهٔ تعریف‌شده آیکون دارد — آیکون گمشده رخ نمی‌دهد', () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_ICONS, `آیکون «${category.icon}» تعریف نشده`).toHaveProperty(
        category.icon
      )
      expect(getCategoryIcon(category.icon)).toBeDefined()
    }
  })

  it('نام ناشناخته به آیکون پیش‌فرض برمی‌گردد نه undefined', () => {
    expect(getCategoryIcon('DoesNotExist')).toBeDefined()
    expect(getCategoryIcon('')).toBeDefined()
  })
})

describe('SERVICE_SUMMARIES', () => {
  it('از SERVICE_DETAILS مشتق می‌شود — بدون تعریف موازی', () => {
    expect(SERVICE_SUMMARIES).toHaveLength(SERVICE_DETAILS.length)
    expect(SERVICE_SUMMARIES.map((s) => s.slug)).toEqual(SERVICE_DETAILS.map((s) => s.slug))
  })

  it('href هر خدمت به صفحهٔ جزئیات همان خدمت اشاره می‌کند', () => {
    for (const summary of SERVICE_SUMMARIES) {
      expect(summary.href).toBe(`/services/${summary.slug}`)
    }
  })

  it('عنوان و توضیح با منبع اصلی یکی است', () => {
    for (const summary of SERVICE_SUMMARIES) {
      const detail = SERVICE_DETAILS.find((d) => d.slug === summary.slug)
      expect(summary.title).toBe(detail?.title)
      expect(summary.description).toBe(detail?.description)
    }
  })
})
