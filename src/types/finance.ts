/**
 * قراردادهای دامنهٔ مالی — منبع واحد حقیقت.
 *
 * ═══════════════════════════════════════════════════════════════
 *  چرا این فایل کوچک است و همه‌چیز اینجا جمع شده
 * ═══════════════════════════════════════════════════════════════
 * ماژول‌های زیر یک «واحد سازمانی» تشکیل می‌دهند:
 *   • Invoice        → صورت‌حساب صادره برای مشتری
 *   • Transaction    → ورود/خروج وجه (درگاه، کارت، نقدی…)
 *   • WalletEntry    → موجودی اعتباری هر مشتری
 *   • Subscription   → قرارداد دوره‌ای (سرویس/پشتیبانی)
 *   • InvoiceSettings → مشخصات حقوقی چاپ فاکتور
 *
 * تصمیم معماری: به‌جای پنج فایل، همه اینجا جمع‌اند تا وقتی
 * فیلدی به فاکتور اضافه می‌شود، بی‌درنگ ببینید تراکنش هم باید
 * همان reference را ذخیره کند. جدا بودن‌شان در libها همان
 * جداسازی لازم را می‌دهد.
 *
 * قیمت‌ها همه به «ریال» و «عدد صحیح» (بدون اعشار) — چون در
 * فارسی رقم اعشار پول رایج نیست و JavaScript float برای پول
 * ناامن است (`0.1 + 0.2 !== 0.3`).
 */

// ═══════════════════════════════════════════════════════════════
//  ۱) صورت‌حساب
// ═══════════════════════════════════════════════════════════════

export type InvoiceStatus =
  | 'draft' // پیش‌نویس، هنوز ارسال نشده
  | 'issued' // صادر شده، در انتظار پرداخت
  | 'paid' // پرداخت شده کامل
  | 'partial' // پرداخت جزئی
  | 'overdue' // سررسید گذشته
  | 'cancelled' // لغو شده

export type InvoiceType = 'sale' | 'proforma' | 'credit_note'

export interface InvoiceLine {
  id: string
  productSku?: string
  description: string
  quantity: number
  /** قیمت واحد به ریال — عدد صحیح */
  unitPrice: number
  /** درصد تخفیف روی این خط، ۰–۱۰۰ */
  discountPct?: number
  /** درصد مالیات بر ارزش افزوده روی این خط، معمولاً ۹ */
  taxPct?: number
}

export interface Invoice {
  id: string
  /** شمارهٔ فاکتور — کاربر‌محور، مثلاً INV-1404-000123 */
  number: string
  type: InvoiceType
  status: InvoiceStatus

  customerId: string
  customerName: string
  customerTaxId?: string
  customerEconomicCode?: string

  issuedAt: string // ISO
  dueAt?: string // ISO — سررسید پرداخت

  lines: InvoiceLine[]

  /** جمع سطرها قبل از تخفیف و مالیات (subtotal) */
  subtotal: number
  /** جمع تخفیف کل */
  discountTotal: number
  /** جمع مالیات کل */
  taxTotal: number
  /** مبلغ نهایی قابل پرداخت */
  total: number
  /** مقدار پرداخت‌شده تاکنون */
  paidAmount: number

  notes?: string
  relatedOrderId?: string
  /** ISO */
  updatedAt: string
}

// ═══════════════════════════════════════════════════════════════
//  ۲) تراکنش
// ═══════════════════════════════════════════════════════════════

export type TransactionKind = 'inflow' | 'outflow'
export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'reversed'
export type TransactionChannel =
  | 'gateway' // درگاه اینترنتی
  | 'pos' // کارتخوان حضوری
  | 'cash' // نقدی
  | 'transfer' // انتقال بانکی
  | 'wallet' // کیف پول داخلی

export interface Transaction {
  id: string
  /** شمارهٔ پیگیری داخلی */
  reference: string
  kind: TransactionKind
  channel: TransactionChannel
  status: TransactionStatus

  amount: number
  /** ISO */
  occurredAt: string

  customerId?: string
  customerName?: string

  invoiceId?: string
  orderId?: string

  /** نام درگاه/بانک — برای mock: 'zarinpal' | 'idpay' | 'saman' */
  providerName?: string
  /** شناسهٔ درگاه (authority/traceNo) */
  providerRef?: string

  description?: string
  updatedAt: string
}

// ═══════════════════════════════════════════════════════════════
//  ۳) کیف پول
// ═══════════════════════════════════════════════════════════════

export type WalletEntryType = 'topup' | 'purchase' | 'refund' | 'adjustment'

export interface WalletEntry {
  id: string
  customerId: string
  customerName: string
  type: WalletEntryType
  /** مبلغ + (ورود) یا − (خروج) — عدد صحیح، ریال */
  amount: number
  /** موجودی بعد از این تراکنش */
  balanceAfter: number
  description?: string
  /** ISO */
  occurredAt: string
  createdBy?: string
}

// ═══════════════════════════════════════════════════════════════
//  ۴) اشتراک
// ═══════════════════════════════════════════════════════════════

export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled'
export type SubscriptionInterval = 'monthly' | 'quarterly' | 'yearly'

export interface Subscription {
  id: string
  customerId: string
  customerName: string

  planName: string
  planDescription?: string

  amount: number
  interval: SubscriptionInterval
  status: SubscriptionStatus

  /** ISO — شروع دوره فعلی */
  startedAt: string
  /** ISO — سررسید تمدید بعدی */
  nextRenewalAt: string
  /** ISO — اگر لغو شده */
  cancelledAt?: string

  /** یادداشت داخلی برای پشتیبانی */
  notes?: string
  updatedAt: string
}

// ═══════════════════════════════════════════════════════════════
//  ۵) تنظیمات فاکتور
// ═══════════════════════════════════════════════════════════════

export interface InvoiceSettings {
  /** نام حقوقی صادرکنندهٔ فاکتور */
  legalName: string
  /** شناسهٔ ملی */
  nationalId: string
  /** شناسهٔ اقتصادی */
  economicCode: string
  /** کد پستی محل قانونی */
  postalCode: string
  /** آدرس قانونی */
  address: string
  /** تلفن */
  phone: string
  /** ایمیل رسمی */
  email?: string

  /** الگوی شمارهٔ فاکتور، مثلاً "INV-{YY}-{SEQ}" */
  numberPattern: string
  /** شمارهٔ سریال آغاز */
  nextSequence: number

  /** درصد مالیات بر ارزش افزوده پیش‌فرض */
  defaultTaxPct: number

  /** نمایش لوگو در چاپ */
  showLogo: boolean
  /** نمایش مهر و امضا */
  showStamp: boolean

  /** یادداشت پایین فاکتور (شرایط پرداخت، …) */
  footerNote?: string

  updatedAt: string
}
