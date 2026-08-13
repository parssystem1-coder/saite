/** واحد نمایش فروشگاه تومان است؛ schema.org و درگاه‌ها ریال (IRR) می‌خواهند. */
export const RIALS_PER_TOMAN = 10

/** تومان → ریال. ورودی خالی یا نامعتبر صفر است. */
export function tomanToRial(value: number | ''): number {
  if (value === '' || !Number.isFinite(value)) return 0
  return Math.round(value * RIALS_PER_TOMAN)
}
