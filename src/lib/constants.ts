import type {
  Brand,
  Category,
  ColorSupport,
  PrintTechnology,
  StockStatus,
  UsageClass,
} from '@/types/product'

export const CATEGORIES: Category[] = [
  {
    slug: 'printer',
    name: 'پرینتر',
    description: 'چاپگرهای لیزری و جوهرافشان برای مصارف خانگی، اداری و سازمانی',
    icon: 'Printer',
  },
  {
    slug: 'scanner',
    name: 'اسکنر',
    description: 'اسکنرهای رومیزی، اسناد و پرسرعت برای دیجیتال‌سازی بایگانی',
    icon: 'ScanLine',
  },
  {
    slug: 'copier',
    name: 'دستگاه کپی',
    description: 'دستگاه‌های کپی و کپی‌پرینتر چندکاره برای حجم بالای کاری',
    icon: 'Copy',
  },
  {
    slug: 'fax',
    name: 'فکس',
    description: 'دستگاه‌های فکس لیزری و حرارتی برای مکاتبات اداری',
    icon: 'Send',
  },
  {
    slug: 'consumables',
    name: 'مواد مصرفی',
    description: 'تونر، کارتریج، درام و جوهر اورجینال و باکیفیت',
    icon: 'Droplets',
  },
  {
    slug: 'spare-parts',
    name: 'قطعات یدکی',
    description: 'قطعات یدکی اصلی برای تعمیر و نگهداری ماشین‌های اداری',
    icon: 'Wrench',
  },
]

export const BRANDS: Brand[] = [
  { slug: 'canon', name: 'کانن', displayName: 'Canon' },
  { slug: 'hp', name: 'اچ‌پی', displayName: 'HP' },
  { slug: 'epson', name: 'اپسون', displayName: 'Epson' },
  { slug: 'ricoh', name: 'ریکو', displayName: 'Ricoh' },
  { slug: 'konica-minolta', name: 'کونیکا مینولتا', displayName: 'Konica Minolta' },
  { slug: 'brother', name: 'برادر', displayName: 'Brother' },
  { slug: 'panasonic', name: 'پاناسونیک', displayName: 'Panasonic' },
]

/** برچسب و رنگ هر وضعیت موجودی — منبع واحد حقیقت برای StockBadge */
export const STOCK_STATUS_MAP: Record<
  StockStatus,
  { label: string; tokenClass: string; dotClass: string }
> = {
  in_stock: {
    label: 'موجود در انبار',
    tokenClass: 'text-stock-in bg-stock-in/10 border-stock-in/25',
    dotClass: 'bg-stock-in',
  },
  low_stock: {
    label: 'موجودی محدود',
    tokenClass: 'text-stock-low bg-stock-low/10 border-stock-low/25',
    dotClass: 'bg-stock-low',
  },
  out_of_stock: {
    label: 'ناموجود',
    tokenClass: 'text-stock-out bg-stock-out/10 border-stock-out/25',
    dotClass: 'bg-stock-out',
  },
  on_request: {
    label: 'تماس بگیرید',
    tokenClass: 'text-stock-quote bg-stock-quote/10 border-stock-quote/25',
    dotClass: 'bg-stock-quote',
  },
}

export const TECHNOLOGY_LABELS: Record<PrintTechnology, string> = {
  laser: 'لیزری',
  inkjet: 'جوهرافشان',
  led: 'ال‌ای‌دی',
  thermal: 'حرارتی',
  dot_matrix: 'سوزنی',
}

export const COLOR_SUPPORT_LABELS: Record<ColorSupport, string> = {
  mono: 'تک‌رنگ',
  color: 'رنگی',
}

export const USAGE_CLASS_LABELS: Record<UsageClass, string> = {
  home: 'خانگی',
  office: 'اداری',
  enterprise: 'سازمانی',
}

export const CONDITION_LABELS = {
  new: 'نو',
  refurbished: 'بازسازی‌شده',
} as const

/** گزینه‌های مرتب‌سازی — در فاز ۳ به صفحهٔ فروشگاه وصل می‌شود */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'best_selling', label: 'پرفروش‌ترین' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

export const SITE = {
  name: 'سایت',
  fullName: 'فروشگاه ماشین‌های اداری سایت',
  phone: '۰۲۱-۹۱۰۰۲۰۳۰',
  phoneLtr: '+982191002030',
  /** نمایش فارسی */
  whatsapp: '۰۹۱۲۳۴۵۶۷۸۹',
  /** برای wa.me — فقط ارقام بین‌المللی بدون + */
  whatsappE164: '989123456789',
  /** یوزرنیم اینستاگرام بدون @ — در پنل تنظیمات قابل تغییر */
  instagram: 'saite.office',
  email: 'info@saite.example.com',
  workingHours: 'شنبه تا چهارشنبه ۹ تا ۱۸ — پنجشنبه ۹ تا ۱۳',
  address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳',
} as const

/** لینک واتساپ با متن ازپیش‌پر */
export function buildWhatsAppUrl(message: string): string {
  const text = encodeURIComponent(message)
  return `https://wa.me/${SITE.whatsappE164}?text=${text}`
}

/** URL پروفایل اینستاگرام از یوزرنیم یا لینک کامل */
export function buildInstagramUrl(usernameOrUrl: string = SITE.instagram): string {
  const v = usernameOrUrl.trim()
  if (!v) return 'https://instagram.com/'
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return `https://instagram.com/${v.replace(/^@/, '')}`
}
