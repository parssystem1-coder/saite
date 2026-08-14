import 'server-only'
import { logger } from '@/server/shared/logger'
import { Worker } from 'bullmq'
import { redis } from '@/server/shared/redis'
import { prisma } from '@/server/shared/db'
import { financeService } from '@/server/modules/finance/service'
import { ordersService } from '@/server/modules/orders/service'
import { InvalidStateTransitionError } from '@/server/modules/orders/state-machine'
import { commsService } from '@/server/communications/service'
import { OUTBOX_MAX_RETRY } from '@/server/shared/constants'
import {
  OrderEvents,
  FinanceEvents,
  ShippingEvents,
} from '@/server/shared/event-types'

/**
 * زنجیرهٔ مالی/اطلاع‌رسانی پس از پرداخت موفق سفارش.
 *
 * فقط یک منبع واحد — هم از `order.status_changed (to=paid)` و هم از
 * `order.paid` (legacy) فراخوانی می‌شود تا منطق تکراری نماند:
 *   ۱. یافتن referenceId از PaymentIntent موفق
 *   ۲. صدور فاکتور (idempotent)
 *   ۳. علامت‌گذاری فاکتور به‌عنوان پرداخت‌شده + ثبت Transaction (idempotent)
 *   ۴. ایمیل تأیید سفارش
 *
 * هر مرحله جدا try/catch دارد تا خطای یک مرحله، مراحل دیگر را نسوزاند
 * و کل job را (و در نتیجه retry دوبارهٔ همهٔ مراحل) نکشد.
 */
async function handlePaidOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) {
    logger.warn(`[OutboxWorker] order ${orderId} not found`)
    return
  }

  // ── یافتن referenceId از PaymentIntent موفق ──
  let referenceId: string | undefined
  try {
    const paymentIntent = await prisma.paymentIntent.findFirst({
      where: { orderId, status: 'succeeded' },
      orderBy: { createdAt: 'desc' },
      select: { transactionId: true },
    })
    referenceId = paymentIntent?.transactionId ?? undefined
  } catch (e) {
    logger.error({ err: e, orderId }, '[OutboxWorker] findPaymentIntent failed')
  }

  // ── صدور فاکتور + علامت‌گذاری پرداخت‌شده (هر دو idempotent) ──
  try {
    const invoice = await financeService.createInvoiceFromOrder({
      id: order.id,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      currency: order.currency,
    })
    await financeService.markInvoicePaid(invoice.id, referenceId)
    logger.info({ orderId, invoiceId: invoice.id, referenceId }, '[OutboxWorker] invoice created+paid')
  } catch (e) {
    logger.error({ err: e, orderId }, '[OutboxWorker] createInvoice/markPaid failed')
  }

  // ── ایمیل تأیید — اگر مشتری ایمیل دارد ──
  try {
    const customer = await prisma.customer.findUnique({ where: { id: order.customerId } })
    if (customer?.email) {
      await commsService.sendOrderConfirmation({
        to: customer.email,
        orderId: order.id,
        totalAmount: order.totalAmount,
      })
    }
  } catch (e) {
    logger.error({ err: e, orderId }, '[OutboxWorker] sendOrderConfirmation failed')
  }
}

export const outboxWorker = new Worker(
  'outbox',
  async (job) => {
    // ۴.۴ — job ساخته‌شده توسط repeatable scheduler: فقط poll کند
    if (job.name === 'outbox-poll') {
      const { dispatchOutboxEvents } = await import('../dispatchers/outbox-dispatcher')
      await dispatchOutboxEvents()
      return
    }

    const { eventId } = job.data as { eventId: string }

    // ── Claim شرطی و اتمیک — مصرف idempotent ──────────────────────────
    // با concurrency بالا و retry، دو job هم‌زمان می‌توانند یک event را
    // پردازش کنند و side-effect (ایمیل/فاکتور) دوبار اجرا شود.
    // این updateMany فقط به ردیفی که هنوز processedAt ندارد می‌خورد؛
    // اگر job دیگری زودتر مصرفش کرده بود count=0 می‌شود و این job صرفاً
    // برمی‌گردد (بدون side-effect تکراری).
    const claimed = await prisma.outboxEvent.updateMany({
      where: { id: eventId, processedAt: null },
      data: { processedAt: new Date() },
    })
    if (claimed.count === 0) return // مصرف‌شده توسط job دیگر

    const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } })
    if (!event) return

    const payload = event.payload as Record<string, unknown>

    try {
      switch (event.type) {
        case OrderEvents.created: {
          const orderId = payload.orderId as string
          logger.info(`[OutboxWorker] order.created order=${orderId}`)
          break
        }
        case OrderEvents.statusChanged: {
          const orderId = payload.orderId as string
          const to = payload.to as string
          const from = payload.from as string
          logger.info(`[OutboxWorker] order.status_changed order=${orderId} ${from}→${to}`)

          // فقط گذار به paid زنجیرهٔ مالی/ایمیل را می‌سازد
          if (to === 'paid') {
            await handlePaidOrder(orderId)
          }
          break
        }
        case OrderEvents.paid: {
          // این رویداد از webhook پرداخت (داخل تراکنش verify) می‌آید.
          // اگر گذار paid پس از commit در webhook شکست خورده باشد (کرش/قطعی
          // لحظه‌ای DB)، اینجا با retry جبران می‌شود — وگرنه idempotent است.
          const orderId = payload.orderId as string
          logger.info(`[OutboxWorker] order.paid order=${orderId}`)
          try {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              select: { status: true },
            })
            if (order?.status === 'pending') {
              await ordersService.transitionState(orderId, 'paid', 'outbox-worker')
            }
          } catch (e) {
            if (!(e instanceof InvalidStateTransitionError)) {
              logger.error({ err: e, orderId }, '[OutboxWorker] compensating paid transition failed')
              throw e // retry توسط BullMQ
            }
          }
          await handlePaidOrder(orderId)
          break
        }
        case FinanceEvents.created: {
          const orderId = payload.orderId as string
          const amount = payload.amount as number
          const customerId = payload.customerId as string
          const invoiceNumber = payload.invoiceNumber as string | undefined
          logger.info(`[OutboxWorker] invoice.created order=${orderId} amount=${amount}`)
          if (customerId && invoiceNumber) {
            try {
              const customer = await prisma.customer.findUnique({ where: { id: customerId } })
              if (customer?.email) {
                await commsService.sendInvoiceNotification({
                  to: customer.email,
                  invoiceNumber,
                  amount,
                })
              }
            } catch (e) {
              logger.error({ err: e, orderId }, '[OutboxWorker] sendInvoiceNotification failed')
            }
          }
          break
        }
        case FinanceEvents.paid: {
          const orderId = payload.orderId as string
          logger.info(`[OutboxWorker] invoice.paid order=${orderId}`)
          break
        }
        case ShippingEvents.statusChanged: {
          const orderId = payload.orderId as string
          const status = payload.status as string
          logger.info(
            `[OutboxWorker] shipment.status_changed order=${orderId} status=${status} tracking=${payload.trackingNumber || 'none'}`
          )
          break
        }
        default:
          logger.info(`[OutboxWorker] unhandled event type: ${event.type}`)
      }
    } catch (err) {
      logger.error({ err, eventType: event.type, eventId }, '[OutboxWorker] handler failed')
      // retry ممکن بماند: processedAt که در claim ست شد را null می‌کنیم تا
      // dispatcher بتواند دوباره claim و enqueue کند. (این فقط برای ردیف‌هایی
      // است که همین job ادعا کرده بود — با id+processedAt مطابقت می‌دهیم)
      try {
        await prisma.outboxEvent.updateMany({
          where: { id: eventId, processedAt: { not: null } },
          data: { processedAt: null },
        })
      } catch (resetErr) {
        logger.error({ err: resetErr, eventId }, '[OutboxWorker] failed to reset processedAt for retry')
      }
      throw err
    }
  },
  { connection: redis, concurrency: 5 }
)

outboxWorker.on('failed', async (job, err) => {
  logger.error({ err, jobId: job?.id }, '[OutboxWorker] job failed')
  // افزایش retryCount — این تنها جایی است که retryCount زیاد می‌شود؛
  // یعنی فقط شکست‌های واقعی شمرده می‌شوند، نه claimهای موفق.
  if (job?.data?.eventId) {
    try {
      const updated = await prisma.outboxEvent.update({
        where: { id: job.data.eventId as string },
        data: { retryCount: { increment: 1 } },
      })
      // وقتی به سقف رسید، دیگر dispatcher claim نمی‌کند → DLQ
      if (updated.retryCount >= OUTBOX_MAX_RETRY) {
        logger.warn(
          { eventId: updated.id, retryCount: updated.retryCount },
          '[OutboxWorker] event reached DLQ (max retries)'
        )
      }
    } catch (e) {
      logger.error({ err: e }, '[OutboxWorker] failed to increment retryCount')
    }
  }
})
