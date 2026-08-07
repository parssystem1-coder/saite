/**
 * Mock adapter برای دامنهٔ مالی — localStorage-based.
 *
 * ═══════════════════════════════════════════════════════════════
 *  چرا یک آداپتر برای پنج ماژول
 * ═══════════════════════════════════════════════════════════════
 * Invoice/Transaction/Wallet/Subscription/InvoiceSettings همه در
 * یک دامنهٔ حسابداری‌اند. اگر هرکدام آداپتر جدا داشته باشد،
 * وقتی یک فاکتور پرداخت می‌شود، باید در دو جا آپدیت شود و
 * ناسازگاری‌ها کابوس دیباگ می‌سازند. اینجا همه با یک منبع
 * حقیقت هماهنگ می‌مانند.
 *
 * الگوی سبک قبلی: `src/lib/shipping/mock-adapter.ts`
 * فقط با یک لایهٔ گروه‌بندی روی storage keys.
 *
 * پس از اتصال بک‌اند، همین قرارداد را با
 * `createHttpFinanceAdapter(baseUrl)` جایگزین می‌کنید و صفحات
 * ادمین تغییری نمی‌خواهند.
 */

import type {
  Invoice,
  InvoiceSettings,
  Subscription,
  Transaction,
  WalletEntry,
} from '@/types/finance'

const KEYS = {
  invoices: 'saite.finance.invoices',
  transactions: 'saite.finance.transactions',
  wallet: 'saite.finance.wallet',
  subscriptions: 'saite.finance.subscriptions',
  settings: 'saite.finance.invoice-settings',
} as const

function safeRead<T>(key: string, fallbackValue: T): T {
  if (typeof window === 'undefined') return fallbackValue
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallbackValue
    const parsed = JSON.parse(raw) as unknown
    return (parsed as T) ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // فضای localStorage پر شده — بی‌صدا رد می‌شویم
  }
}

// ═══════════════════════════════════════════════════════════════
//  Fallback data — دادهٔ نمونهٔ اولیه
// ═══════════════════════════════════════════════════════════════

const now = () => new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

function invoiceFallback(): Invoice[] {
  return [
    {
      id: 'inv-1',
      number: 'INV-1404-000123',
      type: 'sale',
      status: 'paid',
      customerId: 'cust-1',
      customerName: 'سارا احمدی',
      issuedAt: daysAgo(30),
      dueAt: daysAgo(15),
      lines: [
        {
          id: 'l1',
          productSku: 'CAN-LBP2900',
          description: 'پرینتر لیزری کانن LBP-2900',
          quantity: 1,
          unitPrice: 42000000,
          taxPct: 9,
        },
      ],
      subtotal: 42000000,
      discountTotal: 0,
      taxTotal: 3780000,
      total: 45780000,
      paidAmount: 45780000,
      relatedOrderId: 'SA-10482',
      updatedAt: daysAgo(15),
    },
    {
      id: 'inv-2',
      number: 'INV-1404-000124',
      type: 'sale',
      status: 'overdue',
      customerId: 'cust-2',
      customerName: 'شرکت آریا چاپ',
      customerTaxId: '14001234567',
      customerEconomicCode: '411321456879',
      issuedAt: daysAgo(60),
      dueAt: daysAgo(30),
      lines: [
        {
          id: 'l1',
          productSku: 'HP-M402',
          description: 'پرینتر HP LaserJet M402dn',
          quantity: 3,
          unitPrice: 55000000,
          taxPct: 9,
        },
      ],
      subtotal: 165000000,
      discountTotal: 0,
      taxTotal: 14850000,
      total: 179850000,
      paidAmount: 80000000,
      updatedAt: daysAgo(30),
    },
    {
      id: 'inv-3',
      number: 'INV-1404-000125',
      type: 'proforma',
      status: 'issued',
      customerId: 'cust-3',
      customerName: 'محمد رضایی',
      issuedAt: daysAgo(5),
      dueAt: daysAgo(-10),
      lines: [
        {
          id: 'l1',
          description: 'قرارداد پشتیبانی سالانه',
          quantity: 1,
          unitPrice: 24000000,
          taxPct: 9,
        },
      ],
      subtotal: 24000000,
      discountTotal: 2000000,
      taxTotal: 1980000,
      total: 23980000,
      paidAmount: 0,
      updatedAt: daysAgo(5),
    },
  ]
}

function transactionFallback(): Transaction[] {
  return [
    {
      id: 'tx-1',
      reference: 'TRX-000456',
      kind: 'inflow',
      channel: 'gateway',
      status: 'succeeded',
      amount: 45780000,
      occurredAt: daysAgo(15),
      customerId: 'cust-1',
      customerName: 'سارا احمدی',
      invoiceId: 'inv-1',
      orderId: 'SA-10482',
      providerName: 'zarinpal',
      providerRef: 'A00010482',
      updatedAt: daysAgo(15),
    },
    {
      id: 'tx-2',
      reference: 'TRX-000457',
      kind: 'inflow',
      channel: 'transfer',
      status: 'succeeded',
      amount: 80000000,
      occurredAt: daysAgo(20),
      customerId: 'cust-2',
      customerName: 'شرکت آریا چاپ',
      invoiceId: 'inv-2',
      description: 'پرداخت جزئی — ۵۰٪ اول',
      updatedAt: daysAgo(20),
    },
    {
      id: 'tx-3',
      reference: 'TRX-000458',
      kind: 'outflow',
      channel: 'transfer',
      status: 'succeeded',
      amount: 12000000,
      occurredAt: daysAgo(7),
      description: 'بازپرداخت مرجوعی SA-10480',
      updatedAt: daysAgo(7),
    },
    {
      id: 'tx-4',
      reference: 'TRX-000459',
      kind: 'inflow',
      channel: 'pos',
      status: 'pending',
      amount: 5600000,
      occurredAt: daysAgo(1),
      customerId: 'cust-3',
      customerName: 'محمد رضایی',
      providerName: 'saman',
      updatedAt: daysAgo(1),
    },
  ]
}

function walletFallback(): WalletEntry[] {
  return [
    {
      id: 'w-1',
      customerId: 'cust-2',
      customerName: 'شرکت آریا چاپ',
      type: 'topup',
      amount: 100000000,
      balanceAfter: 100000000,
      description: 'شارژ اولیهٔ اعتبار سازمانی',
      occurredAt: daysAgo(40),
      createdBy: 'admin',
    },
    {
      id: 'w-2',
      customerId: 'cust-2',
      customerName: 'شرکت آریا چاپ',
      type: 'purchase',
      amount: -20150000,
      balanceAfter: 79850000,
      description: 'پرداخت فاکتور INV-1404-000124',
      occurredAt: daysAgo(20),
    },
    {
      id: 'w-3',
      customerId: 'cust-1',
      customerName: 'سارا احمدی',
      type: 'refund',
      amount: 3000000,
      balanceAfter: 3000000,
      description: 'بازپرداخت مرجوعی',
      occurredAt: daysAgo(7),
      createdBy: 'admin',
    },
  ]
}

function subscriptionFallback(): Subscription[] {
  return [
    {
      id: 'sub-1',
      customerId: 'cust-2',
      customerName: 'شرکت آریا چاپ',
      planName: 'قرارداد پشتیبانی طلایی',
      planDescription: 'سرویس دوره‌ای پرینترها + پاسخگویی ۲۴ ساعته',
      amount: 24000000,
      interval: 'yearly',
      status: 'active',
      startedAt: daysAgo(180),
      nextRenewalAt: daysAgo(-185),
      updatedAt: daysAgo(180),
    },
    {
      id: 'sub-2',
      customerId: 'cust-1',
      customerName: 'سارا احمدی',
      planName: 'اشتراک تونر ماهانه',
      amount: 3200000,
      interval: 'monthly',
      status: 'active',
      startedAt: daysAgo(90),
      nextRenewalAt: daysAgo(-15),
      updatedAt: daysAgo(30),
    },
    {
      id: 'sub-3',
      customerId: 'cust-3',
      customerName: 'محمد رضایی',
      planName: 'قرارداد پشتیبانی نقره‌ای',
      amount: 6000000,
      interval: 'quarterly',
      status: 'expired',
      startedAt: daysAgo(400),
      nextRenewalAt: daysAgo(20),
      updatedAt: daysAgo(20),
    },
  ]
}

function settingsFallback(): InvoiceSettings {
  return {
    legalName: 'شرکت سایت — تجارت الکترونیک',
    nationalId: '14001234567',
    economicCode: '411321456879',
    postalCode: '1968843111',
    address: 'تهران، بلوار مرزداران، خیابان اطاعتی، پلاک ۱۲',
    phone: '02188421900',
    email: 'invoices@saite.example',
    numberPattern: 'INV-{YY}-{SEQ}',
    nextSequence: 126,
    defaultTaxPct: 9,
    showLogo: true,
    showStamp: true,
    footerNote: 'مهلت پرداخت ۱۰ روز از تاریخ صدور. پس از سررسید ۲٪ جریمهٔ ماهانه.',
    updatedAt: now(),
  }
}

// ═══════════════════════════════════════════════════════════════
//  کمک‌کننده‌های محاسبه — تنها منبع حقیقت
// ═══════════════════════════════════════════════════════════════

/**
 * محاسبهٔ subtotal/discount/tax/total از خطوط فاکتور.
 *
 * چرا اینجاست و نه در UI: هر جای دیگری بنویسیم، یک روز مالیات
 * دو بار حساب می‌شود. تست همین یک تابع کافی‌ست.
 */
export function computeInvoiceTotals(lines: Invoice['lines']): {
  subtotal: number
  discountTotal: number
  taxTotal: number
  total: number
} {
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0
  for (const l of lines) {
    const lineSubtotal = l.unitPrice * l.quantity
    const lineDiscount = Math.round((lineSubtotal * (l.discountPct ?? 0)) / 100)
    const afterDiscount = lineSubtotal - lineDiscount
    const lineTax = Math.round((afterDiscount * (l.taxPct ?? 0)) / 100)
    subtotal += lineSubtotal
    discountTotal += lineDiscount
    taxTotal += lineTax
  }
  return {
    subtotal,
    discountTotal,
    taxTotal,
    total: subtotal - discountTotal + taxTotal,
  }
}

// ═══════════════════════════════════════════════════════════════
//  Adapter
// ═══════════════════════════════════════════════════════════════

export function createMockFinanceAdapter() {
  return {
    // ── فاکتورها ──────────────────────────────────────────────
    listInvoices(): Invoice[] {
      return safeRead<Invoice[]>(KEYS.invoices, invoiceFallback())
    },
    saveInvoice(inv: Invoice): Invoice[] {
      const all = this.listInvoices()
      const totals = computeInvoiceTotals(inv.lines)
      const withTotals: Invoice = { ...inv, ...totals, updatedAt: now() }
      const idx = all.findIndex((i) => i.id === inv.id)
      const next = idx >= 0
        ? [...all.slice(0, idx), withTotals, ...all.slice(idx + 1)]
        : [...all, withTotals]
      safeWrite(KEYS.invoices, next)
      return next
    },
    removeInvoice(id: string): Invoice[] {
      const next = this.listInvoices().filter((i) => i.id !== id)
      safeWrite(KEYS.invoices, next)
      return next
    },

    // ── تراکنش‌ها ─────────────────────────────────────────────
    listTransactions(): Transaction[] {
      return safeRead<Transaction[]>(KEYS.transactions, transactionFallback())
    },
    saveTransaction(tx: Transaction): Transaction[] {
      const all = this.listTransactions()
      const updated = { ...tx, updatedAt: now() }
      const idx = all.findIndex((t) => t.id === tx.id)
      const next = idx >= 0
        ? [...all.slice(0, idx), updated, ...all.slice(idx + 1)]
        : [...all, updated]
      safeWrite(KEYS.transactions, next)
      return next
    },
    removeTransaction(id: string): Transaction[] {
      const next = this.listTransactions().filter((t) => t.id !== id)
      safeWrite(KEYS.transactions, next)
      return next
    },

    // ── کیف پول ───────────────────────────────────────────────
    listWalletEntries(): WalletEntry[] {
      return safeRead<WalletEntry[]>(KEYS.wallet, walletFallback())
    },
    saveWalletEntry(entry: WalletEntry): WalletEntry[] {
      const all = this.listWalletEntries()
      const idx = all.findIndex((e) => e.id === entry.id)
      const next = idx >= 0
        ? [...all.slice(0, idx), entry, ...all.slice(idx + 1)]
        : [...all, entry]
      safeWrite(KEYS.wallet, next)
      return next
    },
    /** جمع مانده کیف پول یک مشتری از تاریخچه */
    walletBalance(customerId: string): number {
      return this.listWalletEntries()
        .filter((e) => e.customerId === customerId)
        .reduce((sum, e) => sum + e.amount, 0)
    },

    // ── اشتراک‌ها ─────────────────────────────────────────────
    listSubscriptions(): Subscription[] {
      return safeRead<Subscription[]>(KEYS.subscriptions, subscriptionFallback())
    },
    saveSubscription(sub: Subscription): Subscription[] {
      const all = this.listSubscriptions()
      const updated = { ...sub, updatedAt: now() }
      const idx = all.findIndex((s) => s.id === sub.id)
      const next = idx >= 0
        ? [...all.slice(0, idx), updated, ...all.slice(idx + 1)]
        : [...all, updated]
      safeWrite(KEYS.subscriptions, next)
      return next
    },
    removeSubscription(id: string): Subscription[] {
      const next = this.listSubscriptions().filter((s) => s.id !== id)
      safeWrite(KEYS.subscriptions, next)
      return next
    },

    // ── تنظیمات فاکتور ────────────────────────────────────────
    getInvoiceSettings(): InvoiceSettings {
      return safeRead<InvoiceSettings>(KEYS.settings, settingsFallback())
    },
    saveInvoiceSettings(settings: InvoiceSettings): InvoiceSettings {
      const updated = { ...settings, updatedAt: now() }
      safeWrite(KEYS.settings, updated)
      return updated
    },

    reset(): void {
      safeWrite(KEYS.invoices, invoiceFallback())
      safeWrite(KEYS.transactions, transactionFallback())
      safeWrite(KEYS.wallet, walletFallback())
      safeWrite(KEYS.subscriptions, subscriptionFallback())
      safeWrite(KEYS.settings, settingsFallback())
    },
  }
}

export type FinanceMockAdapter = ReturnType<typeof createMockFinanceAdapter>
