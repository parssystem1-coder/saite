/**
 * ابزارهای قالب‌بندی متن و عدد فارسی.
 *
 * ⚠️ قانون مهم دامنه:
 * قیمت و تعداد باید با ارقام فارسی نمایش داده شوند، اما شناسه‌های فنی
 * (شمارهٔ مدل، SKU، مقادیری مثل «12 ppm» یا «600 dpi») هرگز نباید
 * فارسی‌سازی شوند — وگرنه «LBP-2900» به «LBP-۲۹۰۰» تبدیل می‌شود
 * که هم غلط است و هم قابل جستجو نیست.
 */

const faFormatter = new Intl.NumberFormat('fa-IR')

/** قیمت با ارقام فارسی و جداکنندهٔ هزارگان */
export function formatPrice(value: number): string {
  return faFormatter.format(value)
}

/** قیمت همراه با واحد پول */
export function formatPriceWithUnit(value: number): string {
  return `${faFormatter.format(value)} تومان`
}

/** عدد ساده با ارقام فارسی (تعداد، امتیاز و ...) */
export function formatNumber(value: number): string {
  return faFormatter.format(value)
}

/** درصد تخفیف بر پایهٔ قیمت قبل و بعد */
export function calcDiscountPercent(price: number, compareAtPrice?: number): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

/** مدت ضمانت به شکل خوانا */
export function formatWarranty(months?: number): string | null {
  if (!months) return null
  if (months % 12 === 0) return `${faFormatter.format(months / 12)} سال ضمانت`
  return `${faFormatter.format(months)} ماه ضمانت`
}
