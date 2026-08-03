import { describe, expect, it } from 'vitest'
import { getPaginationRange, PAGE_ELLIPSIS } from '@/lib/pagination-range'

const numbersOf = (slots: (number | typeof PAGE_ELLIPSIS)[]) =>
  slots.filter((s): s is number => s !== PAGE_ELLIPSIS)

describe('getPaginationRange', () => {
  it('با تعداد کم، همهٔ صفحات بدون «…»', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('ورودی نامعتبر آرایهٔ خالی می‌دهد', () => {
    expect(getPaginationRange(1, 0)).toEqual([])
    expect(getPaginationRange(1, -3)).toEqual([])
    expect(getPaginationRange(1, Number.NaN)).toEqual([])
  })

  it('نزدیک ابتدا: «…» فقط سمت راست', () => {
    expect(getPaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, PAGE_ELLIPSIS, 10])
    expect(getPaginationRange(3, 10)).toEqual([1, 2, 3, 4, 5, PAGE_ELLIPSIS, 10])
  })

  it('وسط: «…» در هر دو سمت', () => {
    expect(getPaginationRange(5, 10)).toEqual([
      1,
      PAGE_ELLIPSIS,
      4,
      5,
      6,
      PAGE_ELLIPSIS,
      10,
    ])
  })

  it('نزدیک انتها: «…» فقط سمت چپ', () => {
    expect(getPaginationRange(10, 10)).toEqual([1, PAGE_ELLIPSIS, 6, 7, 8, 9, 10])
    expect(getPaginationRange(9, 10)).toEqual([1, PAGE_ELLIPSIS, 6, 7, 8, 9, 10])
  })

  it('🔑 تعداد خانه‌ها ثابت می‌ماند — عرض نوار نمی‌پرد', () => {
    const lengths = new Set<number>()
    for (let page = 1; page <= 56; page++) {
      lengths.add(getPaginationRange(page, 56).length)
    }
    expect([...lengths]).toEqual([7])
  })

  it('🔑 با ۵۶ صفحه، به‌جای ۵۶ دکمه حداکثر ۷ خانه', () => {
    // مشکل اصلی: Array.from({length: totalPages}) روی موبایل سرریز می‌کرد
    expect(getPaginationRange(28, 56).length).toBeLessThanOrEqual(7)
  })

  it('صفحهٔ اول و آخر همیشه در دسترس‌اند', () => {
    for (const page of [1, 2, 15, 30, 55, 56]) {
      const nums = numbersOf(getPaginationRange(page, 56))
      expect(nums).toContain(1)
      expect(nums).toContain(56)
    }
  })

  it('صفحهٔ فعلی همیشه در خروجی هست', () => {
    for (const page of [1, 2, 3, 20, 40, 54, 55, 56]) {
      expect(numbersOf(getPaginationRange(page, 56))).toContain(page)
    }
  })

  it('صفحات همیشه صعودی و بدون تکرار', () => {
    for (const page of [1, 5, 28, 52, 56]) {
      const nums = numbersOf(getPaginationRange(page, 56))
      expect(nums).toEqual([...nums].sort((a, b) => a - b))
      expect(new Set(nums).size).toBe(nums.length)
    }
  })

  it('صفحهٔ خارج از بازه به نزدیک‌ترین حد محدود می‌شود', () => {
    expect(getPaginationRange(0, 10)).toEqual(getPaginationRange(1, 10))
    expect(getPaginationRange(999, 10)).toEqual(getPaginationRange(10, 10))
  })

  it('siblingCount بیشتر، پنجرهٔ عریض‌تر می‌دهد', () => {
    const narrow = getPaginationRange(20, 56, 1)
    const wide = getPaginationRange(20, 56, 2)
    expect(wide.length).toBeGreaterThan(narrow.length)
    expect(numbersOf(wide)).toContain(18)
  })
})
