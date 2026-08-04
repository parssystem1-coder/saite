import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/schemas'

/**
 * آخرین سفارش ثبت‌شده در همین نشست مرورگر.
 *
 * چرا sessionStorage؟ تا وقتی سفارش واقعی در بک‌اند نداریم، صفحهٔ
 * موفقیت باید بتواند پس از رفرش هم اطلاعات را نشان دهد. با اتصال
 * بک‌اند، این ماژول جای خود را به `getOrder(orderRef)` می‌دهد و
 * امضای `LastOrder` تقریباً ثابت می‌ماند.
 *
 * ⚠️ هیچ داده‌ای که نباید در دستگاه کاربر بماند اینجا ذخیره نمی‌شود
 * (بدون نشانی کامل، بدون شمارهٔ تماس).
 */

const REF_KEY = 'saite:last-order-ref'
const META_KEY = 'saite:last-order-meta'

export interface LastOrder {
  ref: string
  receiverName: string
  itemCount: number
  total: number
  paymentMethod: PaymentMethod
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  online: 'پرداخت آنلاین',
  cod: 'پرداخت در محل',
}

/** شمارهٔ پیگیری معتبر: دقیقاً ۶ رقم */
export function isValidOrderRef(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{6}$/.test(value))
}

export function generateOrderRef(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function saveLastOrder(order: LastOrder): void {
  try {
    sessionStorage.setItem(REF_KEY, order.ref)
    sessionStorage.setItem(META_KEY, JSON.stringify(order))
  } catch {
    // در حالت private یا با storage غیرفعال، صفحهٔ موفقیت
    // فقط شمارهٔ پیگیری را از query نشان می‌دهد
  }
}

/** خواندن امن — هر داده‌ای که شکل درست ندارد نادیده گرفته می‌شود */
export function readLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(META_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const o = parsed as Record<string, unknown>
    if (!isValidOrderRef(typeof o.ref === 'string' ? o.ref : null)) return null
    if (typeof o.receiverName !== 'string') return null
    if (typeof o.itemCount !== 'number' || !Number.isFinite(o.itemCount)) return null
    if (typeof o.total !== 'number' || !Number.isFinite(o.total)) return null
    if (!PAYMENT_METHODS.includes(o.paymentMethod as PaymentMethod)) return null

    return {
      ref: o.ref as string,
      receiverName: o.receiverName,
      itemCount: o.itemCount,
      total: o.total,
      paymentMethod: o.paymentMethod as PaymentMethod,
    }
  } catch {
    return null
  }
}

export function readLastOrderRef(): string | null {
  try {
    return sessionStorage.getItem(REF_KEY)
  } catch {
    return null
  }
}
