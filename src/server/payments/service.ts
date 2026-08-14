import 'server-only'
import { prisma } from '@/server/shared/db'
import { resolvePaymentProviderForCreate } from './gateway'
import { NotFoundError, ValidationError } from '@/server/shared/errors'
import { PAYMENT_INTENT_TTL_MS, PAYMENT_MIN_AMOUNT } from '@/server/shared/constants'
import { getSiteUrl } from '@/server/shared/site-url'
import { canTransitionPayment } from '@/lib/payments/payment-rules'

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  )
}

/**
 * سرویس پرداخت — تنها نقطهٔ ورود برای آغاز پرداخت.
 *
 * idempotent: برای هر (orderId, providerCode) یک PaymentIntent ساخته
 * می‌شود و درخواست‌های تکراری همان intent (و redirectUrl آن) را
 * برمی‌گردانند.
 */
export const paymentsService = {
  /**
   * شروع پرداخت برای یک سفارش پرداخت‌نشدهٔ متعلق به customer.
   *
   * @param orderId   شناسهٔ سفارش
   * @param customerId مالک سفارش (از session)
   * @returns { redirectUrl, intentId } — آدرس هدایت به درگاه
   */
  async initialize(orderId: string, customerId: string): Promise<{ redirectUrl: string; intentId: string }> {
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundError('سفارش یافت نشد')
    if (order.customerId !== customerId) {
      throw new ValidationError({ orderId: 'دسترسی به این سفارش مجاز نیست' })
    }
    if (order.status !== 'pending') {
      throw new ValidationError({ orderId: `پرداخت برای سفارش با وضعیت «${order.status}» مجاز نیست` })
    }
    if (order.totalAmount < PAYMENT_MIN_AMOUNT) {
      throw new ValidationError({ orderId: 'مبلغ سفارش کمتر از حداقل پرداخت است' })
    }

    const { adapter, provider } = resolvePaymentProviderForCreate()
    const idempotencyKey = `order:${order.id}:${provider.code}`
    const callbackUrl = `${getSiteUrl()}/api/payments/webhook/${provider.code}`

    // idempotency: intent موجود برای همین (order, provider)
    // فقط اگر هنوز منقضی نشده باشد برگردانده می‌شود — intent منقضی‌شده
    // نباید کاربر را به درگاه بی‌اعتبار هدایت کند (درگاه جدید ساخته می‌شود).
    const existing = await prisma.paymentIntent.findUnique({ where: { idempotencyKey } })
    if (existing?.authority && existing.redirectUrl && existing.expiresAt > new Date()) {
      return { redirectUrl: existing.redirectUrl, intentId: existing.id }
    }

    const result = await adapter.createPayment(provider, {
      orderId: order.id,
      amount: order.totalAmount,
      currency: 'IRR',
      callbackUrl,
      idempotencyKey,
    })

    const status = canTransitionPayment('created', 'redirect_required')
      ? 'redirect_required'
      : 'pending'

    try {
      const intent = await prisma.paymentIntent.create({
        data: {
          orderId: order.id,
          providerCode: provider.code,
          amount: order.totalAmount,
          currency: 'IRR',
          status,
          idempotencyKey,
          authority: result.authority,
          redirectUrl: result.redirectUrl,
          expiresAt: new Date(Date.now() + PAYMENT_INTENT_TTL_MS),
        },
      })
      return { redirectUrl: result.redirectUrl, intentId: intent.id }
    } catch (err) {
      // race: intent هم‌زمان توسط درخواست دیگر ساخته شده — به intent موجود هدایت کن
      if (isUniqueViolation(err)) {
        const dup = await prisma.paymentIntent.findUnique({ where: { idempotencyKey } })
        if (dup?.redirectUrl) return { redirectUrl: dup.redirectUrl, intentId: dup.id }
      }
      throw err
    }
  },
}
