/**
 * مدل دادهٔ دامنهٔ «ماشین‌های اداری»
 *
 * این مدل جایگزین تایپ ۶ فیلدی قبلی است. فیلدهای اضافه‌شده مستقیماً
 * پیش‌نیاز قابلیت‌های زیر هستند:
 *   - brand/model  → فیلتر برند، نمایش صحیح شناسهٔ فنی
 *   - specs        → جدول مشخصات و مقایسهٔ محصولات
 *   - stockStatus  → بج موجودی و فیلتر «فقط موجودها»
 *   - priceType    → تفکیک کالای نقدی از کالای استعلامی (B2B)
 *   - compatibleWith / consumables → ابزار یافتن قطعهٔ سازگار
 */

export type CategorySlug =
  | 'printer'
  | 'scanner'
  | 'copier'
  | 'fax'
  | 'consumables'
  | 'spare-parts'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_request'

/** برخی دستگاه‌های سنگین قیمت ثابت ندارند و فقط استعلامی‌اند */
export type PriceType = 'fixed' | 'quote_only'

export type ProductCondition = 'new' | 'refurbished'

/** فناوری چاپ — مبنای یکی از مهم‌ترین فیلترهای این صنعت */
export type PrintTechnology = 'laser' | 'inkjet' | 'led' | 'thermal' | 'dot_matrix'

export type ColorSupport = 'mono' | 'color'

/** ردهٔ کاربری — تعیین‌کنندهٔ اینکه دستگاه به درد چه محیطی می‌خورد */
export type UsageClass = 'home' | 'office' | 'enterprise'

export interface Spec {
  /** برچسب فارسی، مثلاً «سرعت چاپ» */
  key: string
  /** مقدار؛ اگر فنی/لاتین است پرچم isTechnical را true بگذارید */
  value: string
  /** گروه‌بندی در جدول مشخصات، مثلاً «اتصالات» */
  group?: string
  /** اگر true باشد با dir="ltr" و font-mono رندر می‌شود */
  isTechnical?: boolean
}

export interface Category {
  slug: CategorySlug
  name: string
  description: string
  /** نام آیکون از lucide-react */
  icon: string
}

export interface Brand {
  slug: string
  name: string
  /** نام لاتین برای نمایش با dir="ltr" */
  displayName: string
}

export interface Product {
  id: string
  /** شناسهٔ URL سئوپسند: canon-i-sensys-lbp-2900 */
  slug: string

  // ── هویت ──────────────────────────────────────────────
  brand: string
  /** شمارهٔ مدل — همیشه لاتین، هرگز نباید فارسی‌سازی شود */
  model: string
  /** عنوان کامل فارسی برای نمایش */
  name: string
  sku: string

  // ── دسته‌بندی ─────────────────────────────────────────
  category: CategorySlug
  subCategory?: string

  // ── قیمت و موجودی ─────────────────────────────────────
  priceType: PriceType
  /** به تومان. در حالت quote_only تعریف نمی‌شود */
  price?: number
  /** قیمت پیش از تخفیف — فقط اگر تخفیف واقعی وجود دارد */
  compareAtPrice?: number
  stockStatus: StockStatus

  // ── رسانه ─────────────────────────────────────────────
  /** حداقل یک تصویر؛ اولی به‌عنوان تصویر شاخص استفاده می‌شود */
  images: string[]

  // ── محتوا ─────────────────────────────────────────────
  shortDescription: string
  description?: string
  keyFeatures: string[]
  specs: Spec[]

  // ── ویژگی‌های فیلترپذیر ───────────────────────────────
  technology?: PrintTechnology
  colorSupport?: ColorSupport
  usageClass?: UsageClass

  // ── تجاری ─────────────────────────────────────────────
  warrantyMonths?: number
  condition: ProductCondition
  datasheetUrl?: string

  // ── سازگاری (موتور فروش مکمل) ─────────────────────────
  /** برای مصرفی/قطعه: با کدام مدل دستگاه‌ها سازگار است */
  compatibleWith?: string[]
  /** برای دستگاه: شناسهٔ مصرفی‌های سازگار */
  consumables?: string[]

  // ── نظرات و پرسش‌های پرتکرار ──────────────────────────
  reviews?: Review[]
  faqs?: Faq[]

  // ── متادیتا ───────────────────────────────────────────
  isFeatured?: boolean
  isBestSeller?: boolean
  createdAt: string
}

export interface Review {
  id: string
  author: string
  /** امتیاز ۱ تا ۵ */
  rating: number
  title?: string
  body: string
  createdAt: string
  /** خرید تأییدشده — نشانگر اعتماد */
  verifiedPurchase?: boolean
}

export interface Faq {
  question: string
  answer: string
}

/** میانگین امتیاز و تعداد نظرات — برای نمایش در کارت و اسکیما */
export function getRatingSummary(product: Product): { average: number; count: number } | null {
  const reviews = product.reviews
  if (!reviews || reviews.length === 0) return null

  const total = reviews.reduce((sum, r) => sum + r.rating, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}

/** خروجی سبک‌شده برای کارت محصول — از ارسال specs سنگین جلوگیری می‌کند */
export type ProductCardData = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'brand'
  | 'model'
  | 'name'
  | 'category'
  | 'priceType'
  | 'price'
  | 'compareAtPrice'
  | 'stockStatus'
  | 'images'
  | 'keyFeatures'
  | 'condition'
>
