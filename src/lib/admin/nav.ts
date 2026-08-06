/**
 * منبع واحد حقیقت منوی پنل مدیریت.
 * افزودن آیتم جدید = همین‌جا + یک page.tsx خالی/placeholder.
 */

export type AdminNavIcon =
  | 'dashboard'
  | 'store'
  | 'orders'
  | 'customers'
  | 'products'
  | 'finance'
  | 'invoices'
  | 'transactions'
  | 'wallet'
  | 'subscriptions'
  | 'invoiceSettings'
  | 'reports'
  | 'reportSales'
  | 'reportProducts'
  | 'reportCustomers'
  | 'reportInventory'
  | 'marketing'
  | 'coupons'
  | 'smsCampaigns'
  | 'communications'
  | 'sms'
  | 'inquiries'
  | 'content'
  | 'articles'
  | 'articleCategories'
  | 'pages'
  | 'help'
  | 'settings'

export interface AdminNavLeaf {
  id: string
  label: string
  href: string
  icon: AdminNavIcon
  /** توضیح کوتاه برای placeholder و metadata */
  description: string
  /** قابلیت‌های برنامه‌ریزی‌شده تا اتصال بک‌اند */
  planned: string[]
  /** اگر true در منو نشان داده نمی‌شود ولی route دارد */
  hidden?: boolean
}

export interface AdminNavGroup {
  id: string
  label: string
  icon: AdminNavIcon
  /** لینک مستقیم اگر گروه صفحهٔ خودش دارد */
  href?: string
  children?: AdminNavLeaf[]
  description?: string
  planned?: string[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'dashboard',
    label: 'داشبورد',
    icon: 'dashboard',
    href: '/admin',
    description: 'نمای کلی فروشگاه، شاخص‌ها و آخرین فعالیت‌ها',
    planned: ['کارت‌های KPI زنده', 'ویجت آخرین فعالیت‌ها', 'دسترسی سریع به عملیات پرتکرار'],
  },
  {
    id: 'store',
    label: 'فروشگاه',
    icon: 'store',
    children: [
      {
        id: 'orders',
        label: 'سفارش‌ها',
        href: '/admin/orders',
        icon: 'orders',
        description: 'پیگیری، تغییر وضعیت و صدور فاکتور سفارش‌ها',
        planned: [
          'فهرست سفارش با فیلتر وضعیت',
          'تغییر وضعیت و کد رهگیری',
          'صدور فاکتور از روی سفارش',
        ],
      },
      {
        id: 'customers',
        label: 'مشتریان',
        href: '/admin/customers',
        icon: 'customers',
        description: 'حساب‌های کاربری و مشتریان سازمانی',
        planned: [
          'فهرست مشتریان و تاریخچهٔ خرید',
          'تفکیک خرد و سازمانی',
          'اعتبار و سقف خرید B2B',
        ],
      },
      {
        id: 'products',
        label: 'محصولات',
        href: '/admin/products',
        icon: 'products',
        description: 'مدیریت کاتالوگ، موجودی و قیمت',
        planned: ['فهرست و جستجو', 'ویرایش موجودی و قیمت', 'سازگاری مصرفی با دستگاه'],
      },
      {
        id: 'products-new',
        label: 'افزودن محصول',
        href: '/admin/products/new',
        icon: 'products',
        description: 'ویرایشگر حرفه‌ای و ماژولار محصول (۷ تب تخصصی)',
        planned: ['تب پایه، مالی، فنی، گالری، محتوا، سئو و ارسال'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'مالی',
    icon: 'finance',
    children: [
      {
        id: 'invoices',
        label: 'صورت‌حساب‌ها',
        href: '/admin/finance/invoices',
        icon: 'invoices',
        description: 'صدور و پیگیری صورت‌حساب مشتریان',
        planned: ['لیست صورت‌حساب‌ها', 'صدور دستی/خودکار', 'وضعیت پرداخت'],
      },
      {
        id: 'transactions',
        label: 'تراکنش‌ها',
        href: '/admin/finance/transactions',
        icon: 'transactions',
        description: 'تاریخچهٔ ورود و خروج وجه',
        planned: ['فیلتر درگاه و وضعیت', 'مغایرت‌گیری', 'خروجی اکسل'],
      },
      {
        id: 'wallet',
        label: 'کیف پول',
        href: '/admin/finance/wallet',
        icon: 'wallet',
        description: 'موجودی اعتباری مشتریان و سازمان‌ها',
        planned: ['موجودی هر مشتری', 'شارژ و برداشت', 'سقف اعتبار سازمانی'],
      },
      {
        id: 'subscriptions',
        label: 'اشتراک‌ها',
        href: '/admin/finance/subscriptions',
        icon: 'subscriptions',
        description: 'قراردادهای دوره‌ای سرویس و پشتیبانی',
        planned: ['لیست اشتراک فعال', 'تمدید و لغو', 'یادآوری سررسید'],
      },
      {
        id: 'invoice-settings',
        label: 'فاکتور رسمی',
        href: '/admin/finance/invoice-settings',
        icon: 'invoiceSettings',
        description: 'مشخصات حقوقی و الگوی چاپ فاکتور',
        planned: ['شناسهٔ اقتصادی و سریال', 'لوگو و مهر', 'پیش‌نمایش چاپ'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'گزارش‌ها',
    icon: 'reports',
    children: [
      {
        id: 'report-sales',
        label: 'گزارش فروش',
        href: '/admin/reports/sales',
        icon: 'reportSales',
        description: 'تحلیل فروش دوره‌ای و کانال‌ها',
        planned: ['نمودار فروش', 'تفکیک وضعیت پرداخت', 'خروجی گزارش'],
      },
      {
        id: 'report-products',
        label: 'گزارش محصولات',
        href: '/admin/reports/products',
        icon: 'reportProducts',
        description: 'پرفروش‌ها، کم‌فروش‌ها و حاشیه',
        planned: ['رتبه‌بندی کالا', 'تحلیل دسته و برند', 'هشدار کالای راکد'],
      },
      {
        id: 'report-customers',
        label: 'گزارش مشتریان',
        href: '/admin/reports/customers',
        icon: 'reportCustomers',
        description: 'رفتار خرید خرد و سازمانی',
        planned: ['مشتریان برتر', 'نرخ بازگشت', 'تفکیک B2B/B2C'],
      },
      {
        id: 'report-inventory',
        label: 'موجودی و مصرفی',
        href: '/admin/reports/inventory',
        icon: 'reportInventory',
        description: 'موجودی انبار و فروش مواد مصرفی',
        planned: ['نقطهٔ سفارش', 'پرفروش‌ترین تونر/قطعه', 'سازگاری دستگاه–مصرفی'],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'افزایش فروش',
    icon: 'marketing',
    children: [
      {
        id: 'coupons',
        label: 'کد تخفیف',
        href: '/admin/marketing/coupons',
        icon: 'coupons',
        description: 'ساخت و مدیریت کوپن و تخفیف',
        planned: ['کد درصدی/مبلغی', 'سقف استفاده', 'محدودیت دسته/برند'],
      },
      {
        id: 'sms-campaigns',
        label: 'کمپین پیامکی',
        href: '/admin/marketing/sms-campaigns',
        icon: 'smsCampaigns',
        description: 'کمپین‌های انبوه پیامکی بازاریابی',
        planned: ['انتخاب مخاطب', 'زمان‌بندی ارسال', 'گزارش تحویل'],
      },
    ],
  },
  {
    id: 'communications',
    label: 'ارتباطات',
    icon: 'communications',
    children: [
      {
        id: 'sms',
        label: 'پیامک‌ها',
        href: '/admin/communications/sms',
        icon: 'sms',
        description: 'صندوق پیامک‌های سیستمی و الگوها',
        planned: ['لاگ ارسالی', 'الگوهای پیام', 'وضعیت تحویل'],
      },
      {
        id: 'inquiries',
        label: 'درخواست‌های استعلام',
        href: '/admin/communications/inquiries',
        icon: 'inquiries',
        description: 'لیدهای فرم تماس و استعلام واتساپ',
        planned: ['صندوق درخواست‌ها', 'وضعیت پیگیری', 'ارجاع به کارشناس'],
      },
    ],
  },
  {
    id: 'content',
    label: 'محتوا',
    icon: 'content',
    children: [
      {
        id: 'articles',
        label: 'مقالات',
        href: '/admin/content/articles',
        icon: 'articles',
        description: 'مدیریت مجله و مقالات آموزشی',
        planned: ['لیست و وضعیت انتشار', 'ویرایشگر محتوا', 'پیش‌نمایش سئو'],
      },
      {
        id: 'article-categories',
        label: 'دسته‌بندی مقالات',
        href: '/admin/content/article-categories',
        icon: 'articleCategories',
        description: 'دسته‌های مجلهٔ آموزشی',
        planned: ['افزودن/ویرایش دسته', 'slug و ترتیب', 'تعداد مقاله در هر دسته'],
      },
    ],
  },
  {
    id: 'pages',
    label: 'صفحات',
    icon: 'pages',
    children: [
      {
        id: 'pages-list',
        label: 'همهٔ صفحات',
        href: '/admin/pages',
        icon: 'pages',
        description: 'صفحات سفارشی لینک‌پذیر سایت',
        planned: ['فهرست صفحات', 'slug و وضعیت', 'لینک در فوتر/هدر'],
      },
      {
        id: 'pages-new',
        label: 'افزودن صفحه',
        href: '/admin/pages/new',
        icon: 'pages',
        description: 'ساخت صفحهٔ جدید (لندینگ، شرایط، …)',
        planned: ['عنوان و slug', 'ویرایشگر محتوا', 'SEO title/description'],
      },
    ],
  },
  {
    id: 'system',
    label: 'سیستم',
    icon: 'settings',
    children: [
      {
        id: 'help',
        label: 'راهنما',
        href: '/admin/help',
        icon: 'help',
        description: 'راهنمای کار با پنل مدیریت',
        planned: ['شروع سریع', 'راهنمای مالی و سفارش', 'پشتیبانی فنی پنل'],
      },
      {
        id: 'settings',
        label: 'تنظیمات',
        href: '/admin/settings',
        icon: 'settings',
        description: 'پیکربندی فروشگاه و کانال‌های تماس',
        planned: [
          'اطلاعات تماس و ساعات کاری',
          'نوار شناور واتساپ/اینستا/تلفن',
          'ارسال و درگاه پرداخت',
        ],
      },
    ],
  },
]

/** تخت کردن همهٔ برگ‌های منو (برای جستجو و sitemap داخلی) */
export function flattenAdminNav(nav: AdminNavGroup[] = ADMIN_NAV): AdminNavLeaf[] {
  const leaves: AdminNavLeaf[] = []
  for (const group of nav) {
    if (group.href && !group.children?.length) {
      leaves.push({
        id: group.id,
        label: group.label,
        href: group.href,
        icon: group.icon,
        description: group.description ?? '',
        planned: group.planned ?? [],
      })
    }
    for (const child of group.children ?? []) {
      if (!child.hidden) leaves.push(child)
    }
  }
  return leaves
}

export function findAdminNavByHref(href: string): AdminNavLeaf | undefined {
  const normalized = href.replace(/\/$/, '') || '/admin'
  return flattenAdminNav().find((item) => item.href === normalized)
}

/** آیا مسیر فعلی زیر این گروه است؟ */
export function isAdminGroupActive(group: AdminNavGroup, pathname: string): boolean {
  if (group.href && (pathname === group.href || pathname === `${group.href}/`)) return true
  return (group.children ?? []).some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
  )
}

export function isAdminLinkActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
