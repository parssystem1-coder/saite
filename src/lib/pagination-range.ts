/** جداکنندهٔ «…» بین بازه‌های غیرپیوسته */
export const PAGE_ELLIPSIS = 'ellipsis' as const

export type PageSlot = number | typeof PAGE_ELLIPSIS

/**
 * پنجرهٔ لغزان صفحه‌بندی.
 *
 * چرا لازم است؟ پیاده‌سازی قبلی `Array.from({ length: totalPages })`
 * بود؛ با رشد کاتالوگ به ۵۰۰ کالا و ۹ کالا در هر صفحه، ۵۶ دکمه
 * رندر می‌شد که روی موبایل از عرض صفحه بیرون می‌زند.
 *
 * تعداد خانه‌ها همیشه ثابت می‌ماند (siblingCount*2 + 5) تا با
 * جابه‌جایی بین صفحات، عرض نوار نپرد. صفحهٔ اول و آخر همیشه
 * دیده می‌شوند تا پرش مستقیم به ابتدا/انتها ممکن باشد.
 *
 * نمونه با siblingCount=1 و totalPages=10:
 *   page=1  → [1, 2, 3, 4, 5, …, 10]
 *   page=5  → [1, …, 4, 5, 6, …, 10]
 *   page=10 → [1, …, 6, 7, 8, 9, 10]
 *   total=7 → [1, 2, 3, 4, 5, 6, 7]   (بدون «…»)
 *
 * @param siblingCount تعداد صفحات مجاور صفحهٔ فعلی در هر سمت
 */
export function getPaginationRange(
  page: number,
  totalPages: number,
  siblingCount = 1
): PageSlot[] {
  if (!Number.isFinite(totalPages) || totalPages <= 0) return []

  const current = Math.min(Math.max(1, Math.floor(page)), totalPages)

  /** اول + آخر + فعلی + مجاورها + دو «…» */
  const maxSlots = siblingCount * 2 + 5

  if (totalPages <= maxSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(current - siblingCount, 1)
  const rightSibling = Math.min(current + siblingCount, totalPages)

  // «…» فقط وقتی ارزش دارد که بیش از یک صفحه را پنهان کند
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  /** طول بلوک پیوسته در حالت لبه — تا عرض نوار ثابت بماند */
  const edgeBlockLength = siblingCount * 2 + 3

  // نزدیک ابتدا: [1..5, …, last]
  if (!showLeftEllipsis && showRightEllipsis) {
    return [
      ...Array.from({ length: edgeBlockLength }, (_, i) => i + 1),
      PAGE_ELLIPSIS,
      totalPages,
    ]
  }

  // نزدیک انتها: [1, …, last-4..last]
  if (showLeftEllipsis && !showRightEllipsis) {
    return [
      1,
      PAGE_ELLIPSIS,
      ...Array.from(
        { length: edgeBlockLength },
        (_, i) => totalPages - edgeBlockLength + 1 + i
      ),
    ]
  }

  // وسط: [1, …, current±sibling, …, last]
  return [
    1,
    PAGE_ELLIPSIS,
    ...Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i),
    PAGE_ELLIPSIS,
    totalPages,
  ]
}
