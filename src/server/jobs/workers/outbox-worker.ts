import 'server-only'
import { logger } from '@/server/shared/logger'
import { Worker } from 'bullmq'
import { redis } from '@/server/shared/redis'
import { prisma } from '@/server/shared/db'
import { financeService } from '@/server/modules/finance/service'
import { commsService } from '@/server/communications/service'

export const outboxWorker = new Worker(
  'outbox',
  async (job) => {
    const { eventId } = job.data as { eventId: string }
    const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } })
    if (!event || event.processedAt) return

    const payload = event.payload as Record<string, unknown>

    try {
      switch (event.type) {
        case 'order.created': {
          const orderId = payload.orderId as string
          logger.info(`[OutboxWorker] order.created order=${orderId}`)
          break
        }
        case 'order.status_changed': {
          const orderId = payload.orderId as string
          const to = payload.to as string
          const from = payload.from as string
          logger.info(`[OutboxWorker] order.status_changed order=${orderId} ${from}→${to}`)

          // فقط گذار به paid زنجیره مالی/انبار/ایمیل را می‌سازد
          if (to === 'paid') {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              include: { items: true },
            })
            if (!order) {
              logger.warn(`[OutboxWorker] order ${orderId} not found for status_changed`)
              break
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

            // ۱) صدور فاکتور (idempotent — اگر قبلاً ساخته شده باشد برمی‌گردد)
            try {
              const invoice = await financeService.createInvoiceFromOrder({
                id: order.id,
                customerId: order.customerId,
                totalAmount: order.totalAmount,
                currency: order.currency,
              })
              logger.info({ orderId, invoiceId: invoice.id }, '[OutboxWorker] invoice created')

              // ۱.۱) علامت‌گذاری فاکتور به‌عنوان پرداخت‌شده + ثبت Transaction
              // idempotent: اگر فاکتور قبلاً paid باشد، بدون تغییر برمی‌گردد
              await financeService.markInvoicePaid(invoice.id, referenceId)
              logger.info({ orderId, invoiceId: invoice.id, referenceId }, '[OutboxWorker] invoice marked paid')
            } catch (e) {
              logger.error({ err: e, orderId }, '[OutboxWorker] createInvoice/markPaid failed')
            }

            // موجودی هنگام ساخت سفارش به‌صورت اتمیک رزرو و هنگام paid در
            // همان transaction گذار سفارش confirm شده است؛ worker نباید دوباره رزرو کند.
            // ۳) ایمیل تأیید — اگر مشتری ایمیل دارد
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
          break
        }
        case 'order.paid': {
          // سازگاری عقب‌رو — همان منطق order.status_changed با to=paid
          const orderId = payload.orderId as string
          logger.info(`[OutboxWorker] order.paid (legacy) order=${orderId}`)
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          })
          if (order) {
            let referenceId: string | undefined
            try {
              const paymentIntent = await prisma.paymentIntent.findFirst({
                where: { orderId, status: 'succeeded' },
                orderBy: { createdAt: 'desc' },
                select: { transactionId: true },
              })
              referenceId = paymentIntent?.transactionId ?? undefined
            } catch (e) {
              logger.error({ err: e, orderId }, '[OutboxWorker] findPaymentIntent (legacy) failed')
            }

            try {
              const invoice = await financeService.createInvoiceFromOrder({
                id: order.id,
                customerId: order.customerId,
                totalAmount: order.totalAmount,
                currency: order.currency,
              })
              await financeService.markInvoicePaid(invoice.id, referenceId)
              logger.info({ orderId, invoiceId: invoice.id }, '[OutboxWorker] invoice created+paid (legacy)')
            } catch (e) {
              logger.error({ err: e, orderId }, '[OutboxWorker] createInvoice (legacy) failed')
            }
          }
          break
        }
        case 'invoice.created': {
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
        case 'invoice.paid': {
          const orderId = payload.orderId as string
          logger.info(`[OutboxWorker] invoice.paid order=${orderId}`)
          break
        }
        case 'shipment.status_changed': {
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
      // خطا را throw می‌کنیم تا BullMQ retry کند و retryCount در dispatcher بالا برود
      throw err
    }

    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date() },
    })
  },
  { connection: redis, concurrency: 5 }
)

outboxWorker.on('failed', async (job, err) => {
  logger.error({ err, jobId: job?.id }, '[OutboxWorker] job failed')
  // افزایش retryCount برای DLQ — dispatcher پس از ۵ بار دیگر enqueue نمی‌کند
  if (job?.data?.eventId) {
    try {
      await prisma.outboxEvent.update({
        where: { id: job.data.eventId as string },
        data: { retryCount: { increment: 1 } },
      })
    } catch (e) {
      logger.error({ err: e }, '[OutboxWorker] failed to increment retryCount')
    }
  }
})
