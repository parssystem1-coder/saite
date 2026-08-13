import 'server-only'
import { CATEGORIES, SITE, STOCK_STATUS_MAP } from '@/lib/constants'
import { SUGGESTION_BLOCK_CLOSE, SUGGESTION_BLOCK_OPEN } from './output'
import type { AdvisorCatalogProduct } from './retrieval'

/**
 * پرامپت سیستم «مشاور فروش هوشمند سایته».
 *
 * ── اصول طراحی (امنیت) ────────────────────────────────────────
 * ۱. مدل هیچ ابزاری (function/tool) ندارد — فقط متن تولید می‌کند؛
 *    بنابراین از نظر تعریفی نمی‌تواند روی سبد/سفارش/پرداخت بنویسد.
 * ۲. مدل اجازه ندارد قیمت، تخفیف یا وعدهٔ لجستیکی از خود بسازد —
 *    دادهٔ قیمت فقط از همان کانتکست کاتالوگ زیر می‌آید.
 * ۳. ارجاع به محصول فقط از طریق بلاک ساخت‌یافتهٔ پیشنهادها انجام
 *    می‌شود که سمت سرور با دیتابیس اعتبارسنجی می‌شود. متن آزادِ
 *    خروجی هیچ اثر واقعی ندارد.
 * ۴. کانتکست کاتالوگ دادهٔ عمومی فروشگاه است (بدون PII مشتری).
 */

export const ADVISOR_FEATURE = 'sales-advisor'
export const ADVISOR_PROMPT_VERSION = 'advisor-v1'

/** سقف توکن پاسخ — مشاور باید مختصر و کاربردی باشد */
export const ADVISOR_MAX_TOKENS = 900

const CATEGORY_NAME_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c.name]))

function formatPriceLine(product: AdvisorCatalogProduct): string {
  if (product.priceType === 'fixed' && product.price !== null) {
    return `${product.price.toLocaleString('en-US')} تومان`
  }
  return 'استعلام قیمت (باید تماس/واتساپ گرفته شود)'
}

/** هر محصول یک خط فشرده برای قرارگیری در پرامپت */
function formatCatalogLine(product: AdvisorCatalogProduct): string {
  const parts = [
    `نام: ${product.name}`,
    `برند: ${product.brand}`,
    `مدل: ${product.model}`,
    `دسته: ${CATEGORY_NAME_BY_SLUG.get(product.category) ?? product.category}`,
    `قیمت: ${formatPriceLine(product)}`,
    `موجودی: ${STOCK_STATUS_MAP[product.stockStatus].label}`,
  ]
  if (product.keyFeatures.length > 0) {
    parts.push(`ویژگی‌ها: ${product.keyFeatures.slice(0, 4).join('، ')}`)
  }
  return `[ID: ${product.id}] ${parts.join(' | ')}`
}

export function buildAdvisorSystemPrompt(catalog: AdvisorCatalogProduct[]): string {
  const catalogSection =
    catalog.length > 0
      ? catalog.map(formatCatalogLine).join('\n')
      : '«در حال حاضر محصول مرتبطی در انبار پیدا نشد.»'

  return `تو «مشاور فروش هوشمند ${SITE.name}» هستی — فروشگاه تخصصی ماشین‌های اداری (پرینتر، اسکنر، دستگاه کپی، مصرفی و قطعات) در ایران.

قواعد غیرقابل تخطی:
۱. فقط دربارهٔ خرید، انتخاب و مقایسهٔ محصولات ماشین‌های اداری و سوالات مرتبط با فروشگاه پاسخ بده. به موضوعات نامرتبط (سیاست، کدنویسی، پزشکی و...) پاسخ نده و مؤدبانه به موضوع فروشگاه برگرد.
۲. توصیهٔ محصول فقط می‌تواند بر اساس «فهرست محصولات» پایین باشد. اگر محصول مناسبی در فهرست نبود، صادقانه بگو و راهنمایی عمومی بده یا کاربر را به تماس با فروشگاه ارجاع بده.
۳. هرگز قیمت، تخفیف، موجودی یا شرایط گارانتی/ارسال از خود نساز. فقط داده‌های فهرست را نقل کن؛ برای موارد نامشخص (مثل شرایط اقساط یا قیمت به‌روز) کاربر را به تماس با پشتیبانی (${SITE.phoneLtr}) یا واتساپ فروشگاه راهنمایی کن.
۴. هرگز وعدهٔ ثبت سفارش، پرداخت یا تغییر سبد خرید نده — تو فقط مشاور هستی. افزودن به سبد و خرید را خود کاربر در سایت انجام می‌دهد.
۵. اطلاعات شخصی کاربر (شماره تماس، کد ملی و...) را ذخیره یا تکرار نکن و درخواست نکن.
۶. پاسخ‌ها فارسی، دوستانه، کاملاً مختصر (حداکثر ۱۲-۱۵ خط) و هدف‌محور باشد؛ تا حد امکان با جمع‌بندی مشخص: چه محصولی، چرا، و قدم بعدی چیست.
۷. اگر سوال کاربر به صدور فاکتور/قیمت گروهی B2B مرتبط بود، گزینهٔ «استعلام قیمت» را گوشزد کن.

قرارداد پیشنهاد محصول (الزامی):
اگر قصد پیشنهاد محصول خاصی داری، در «کادر متن» خود به آن اشاره کن و سپس در انتهای پاسخ — بدون هیچ متن اضافه بعدش — دقیقاً این بلاک را بگذار:
${SUGGESTION_BLOCK_OPEN}
[{"id":"<ID محصول از فهرست>"}]
${SUGGESTION_BLOCK_CLOSE}
فقط IDهایی که در فهرست محصولات پایین هستند مجازند. حداکثر ۳ محصول. این بلاک در چت کاربر نمایش داده نمی‌شود و فقط برای ساخت کارت محصول استفاده می‌شود. اگر پیشنهادی نداری، هیچ بلاکی ننویس.

فهرست محصولات مرتبط با سوال فعلی کاربر:
${catalogSection}`
}
