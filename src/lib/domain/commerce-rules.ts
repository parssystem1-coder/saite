import type { Money, OrderSnapshot, ReservationStatus, ShippingPaymentMode } from '@/domain/commerce'

/**
 * مپر مرزی: 'cod' (schema/UI) ↔ 'cash_on_delivery' (دامنه)
 *
 * دامنه منبع حقیقت است ('cash_on_delivery')، اما فرم و API قرارداد قدیمی
 * از 'cod' استفاده می‌کنند. این مپر در لایهٔ مرزی تبدیل می‌کند تا دو
 * enum هم‌زمان معتبر بمانند بدون اینکه منطق دامنه آلوده شود.
 */
export function toShippingPaymentMode(paymentMethod: string): ShippingPaymentMode {
  if (paymentMethod === 'cod' || paymentMethod === 'cash_on_delivery') return 'cash_on_delivery'
  if (paymentMethod === 'free') return 'free'
  return 'prepaid'
}
export function toPaymentMethod(mode: ShippingPaymentMode): 'online' | 'cod' {
  if (mode === 'cash_on_delivery') return 'cod'
  return 'online'
}

export function addMoney(a:Money,b:Money):Money { if(a.currency!==b.currency) throw new Error('CURRENCY_MISMATCH'); return {amount:a.amount+b.amount,currency:a.currency} }
export function assertPositiveQuantity(quantity:number):void { if(!Number.isInteger(quantity)||quantity<=0) throw new Error('INVALID_QUANTITY') }
export function canTransitionReservation(from:ReservationStatus,to:ReservationStatus):boolean { return ({held:['confirmed','released','expired'],confirmed:['released'],released:[],expired:[]}[from] as ReservationStatus[]).includes(to) }
export function customerShippingMessage(mode:ShippingPaymentMode, label:string):string { if(mode==='cash_on_delivery') return `هزینه ارسال هنگام تحویل توسط گیرنده به ${label} پرداخت می‌شود.`; if(mode==='free') return 'هزینه ارسال توسط فروشگاه پرداخت می‌شود.'; return 'هزینه ارسال هنگام ثبت سفارش از مشتری دریافت می‌شود.' }
export function assertOrderTotals(order:Pick<OrderSnapshot,'lines'|'subtotal'|'discountTotal'|'shipping'|'grandTotal'>):void { const lineTotal=order.lines.reduce((n,l)=>n+l.lineTotal.amount,0); const expectedSubtotal=lineTotal; const expectedGrand=expectedSubtotal-order.discountTotal.amount+order.shipping.customerPayable.amount; if(order.subtotal.amount!==expectedSubtotal||order.grandTotal.amount!==expectedGrand) throw new Error('ORDER_TOTALS_MISMATCH') }
export function assertIdempotencyKey(key:string):void { if(!/^[A-Za-z0-9:_-]{16,100}$/.test(key)) throw new Error('INVALID_IDEMPOTENCY_KEY') }
