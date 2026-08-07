import type { Inquiry, SmsLogEntry, SmsTemplate } from '@/types/communications'

const KEYS = {
  smsLogs: 'saite.comms.sms-logs',
  smsTemplates: 'saite.comms.sms-templates',
  inquiries: 'saite.comms.inquiries',
} as const

function safeRead<T>(key: string, fallbackValue: T): T {
  if (typeof window === 'undefined') return fallbackValue
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallbackValue
    return (JSON.parse(raw) as T) ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch { /* full */ }
}

const isoAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

function smsLogsFallback(): SmsLogEntry[] {
  return [
    { id: 's1', toPhone: '09124827301', toName: 'سارا احمدی', message: 'کد تایید شما: 837291', kind: 'otp', status: 'delivered', sentAt: isoAgo(2), deliveredAt: isoAgo(2), templateId: 't-otp' },
    { id: 's2', toPhone: '02188421900', toName: 'شرکت آریا چاپ', message: 'سفارش SA-10481 برای ارسال آماده شد.', kind: 'transactional', status: 'delivered', sentAt: isoAgo(8), deliveredAt: isoAgo(8), templateId: 't-order-ready' },
    { id: 's3', toPhone: '09123456789', message: 'کمپین جمعه سیاه — کد BF25', kind: 'campaign', status: 'sent', sentAt: isoAgo(24) },
    { id: 's4', toPhone: '09991112233', message: 'یادآوری فاکتور INV-1404-000124', kind: 'transactional', status: 'failed', sentAt: isoAgo(48), errorReason: 'شمارهٔ نامعتبر' },
  ]
}

function smsTemplatesFallback(): SmsTemplate[] {
  return [
    { id: 't-otp', name: 'کد تایید', content: 'کد تایید شما: {{code}}', variables: ['code'] },
    { id: 't-order-ready', name: 'آمادهٔ ارسال', content: 'سفارش {{orderId}} برای ارسال آماده شد.', variables: ['orderId'] },
    { id: 't-invoice-reminder', name: 'یادآوری فاکتور', content: 'یادآوری فاکتور {{invoiceNumber}} — مبلغ {{amount}} ریال.', variables: ['invoiceNumber', 'amount'] },
    { id: 't-welcome', name: 'خوش‌آمدگویی', content: 'به فروشگاه سایت خوش آمدید {{name}} عزیز!', variables: ['name'] },
  ]
}

function inquiriesFallback(): Inquiry[] {
  return [
    { id: 'inq-1', customerName: 'رضا کریمی', phone: '09121234567', channel: 'whatsapp', productInterest: 'پرینتر HP LaserJet M402dn', message: 'قیمت به‌روز و موجودی رنگی همین مدل رو می‌خوام.', status: 'new', receivedAt: isoAgo(3), updatedAt: isoAgo(3) },
    { id: 'inq-2', customerName: 'فاطمه حسینی', phone: '09199988877', email: 'f@example.com', channel: 'contact_form', productInterest: 'قرارداد پشتیبانی سالانه', message: 'یک قرارداد پشتیبانی برای ۱۲ پرینتر شرکت لازم داریم.', status: 'contacted', assignedTo: 'کارشناس فروش سازمانی', internalNote: 'مکالمهٔ اولیه انجام شد؛ منتظر ارسال RFP.', receivedAt: isoAgo(48), updatedAt: isoAgo(20) },
    { id: 'inq-3', customerName: 'آرش مرادی', phone: '09355555555', channel: 'phone', message: 'میخواستم بدونم قطعات یدکی برای کپی Sharp AR-5316 دارید؟', status: 'in_progress', assignedTo: 'کارشناس فنی', receivedAt: isoAgo(72), updatedAt: isoAgo(24) },
    { id: 'inq-4', customerName: 'شرکت سبز پارس', phone: '02177889900', email: 'info@sabzpars.example', channel: 'email', productInterest: 'اسکنر دو رو', message: 'استعلام قیمت ۵ عدد اسکنر دو رو.', status: 'converted', assignedTo: 'کارشناس فروش سازمانی', internalNote: 'فاکتور INV-1404-000123 صادر شد.', receivedAt: isoAgo(240), updatedAt: isoAgo(120) },
  ]
}

export function createMockCommunicationsAdapter() {
  return {
    listSmsLogs(): SmsLogEntry[] {
      return safeRead<SmsLogEntry[]>(KEYS.smsLogs, smsLogsFallback())
    },
    listSmsTemplates(): SmsTemplate[] {
      return safeRead<SmsTemplate[]>(KEYS.smsTemplates, smsTemplatesFallback())
    },
    saveSmsTemplate(t: SmsTemplate): SmsTemplate[] {
      const all = this.listSmsTemplates()
      const idx = all.findIndex((x) => x.id === t.id)
      const next = idx >= 0 ? [...all.slice(0, idx), t, ...all.slice(idx + 1)] : [...all, t]
      safeWrite(KEYS.smsTemplates, next)
      return next
    },
    removeSmsTemplate(id: string): SmsTemplate[] {
      const next = this.listSmsTemplates().filter((t) => t.id !== id)
      safeWrite(KEYS.smsTemplates, next)
      return next
    },

    listInquiries(): Inquiry[] {
      return safeRead<Inquiry[]>(KEYS.inquiries, inquiriesFallback())
    },
    saveInquiry(inq: Inquiry): Inquiry[] {
      const all = this.listInquiries()
      const updated = { ...inq, updatedAt: new Date().toISOString() }
      const idx = all.findIndex((x) => x.id === inq.id)
      const next = idx >= 0 ? [...all.slice(0, idx), updated, ...all.slice(idx + 1)] : [...all, updated]
      safeWrite(KEYS.inquiries, next)
      return next
    },
    removeInquiry(id: string): Inquiry[] {
      const next = this.listInquiries().filter((i) => i.id !== id)
      safeWrite(KEYS.inquiries, next)
      return next
    },
  }
}

export type CommunicationsMockAdapter = ReturnType<typeof createMockCommunicationsAdapter>

/** استخراج متغیرها از یک قالب — منبع واحد. */
export function extractTemplateVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1] ?? '')))
}
