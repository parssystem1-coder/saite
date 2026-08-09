import 'server-only'
import { Worker } from 'bullmq'
import { redis } from '@/server/shared/redis'
import { prisma } from '@/server/shared/db'
import { financeService } from '@/server/modules/finance/service'
import { inventoryService } from '@/server/modules/inventory/service'
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
          console.log(`[OutboxWorker] order.created order=${orderId}`)
          break
        }
        case 'order.status_changed': {
          const orderId = payload.orderId as string
          const to = payload.to as string
          const from = payload.from as string
          console.log(`[OutboxWorker] order.status_changed order=${orderId} ${from}→${to}`)

          // فقط گذار به paid زنجیره مالی/انبار/ایمیل را می‌سازد
          if (to === 'paid') {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              include: { items: true },
            })
            if (!order) {
              console.warn(`[OutboxWorker] order ${orderId} not found for status_changed`)
              break
            }

            // ۱) صدور فاکتور (idempotent — اگر قبلاً ساخته شده باشد برمی‌گردد)
            try {
              await financeService.createInvoiceFromOrder({
                id: order.id,
                customerId: order.customerId,
                totalAmount: order.totalAmount,
                currency: order.currency,
              })
              console.log(`[OutboxWorker] invoice created for order=${orderId}`)
            } catch (e) {
              console.error(`[OutboxWorker] createInvoice failed for ${orderId}:`, e)
            }

            // ۲) رزرو موجودی
            try {
              const items = order.items.map((it: { productId: string; quantity: number }) => ({
                productId: it.productId,
                quantity: it.quantity,
              }))
              await inventoryService.reserveItems(items)
              console.log(`[OutboxWorker] inventory reserved for order=${orderId}`)
            } catch (e) {
              console.error(`[OutboxWorker] inventory reserve failed for ${orderId}:`, e)
            }

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
              console.error(`[OutboxWorker] sendOrderConfirmation failed for ${orderId}:`, e)
            }
          }
          break
        }
        case 'order.paid': {
          // سازگاری عقب‌رو — همان منطق order.status_changed با to=paid
          const orderId = payload.orderId as string
          console.log(`[OutboxWorker] order.paid (legacy) order=${orderId}`)
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          })
          if (order) {
            try {
              await financeService.createInvoiceFromOrder({
                id: order.id,
                customerId: order.customerId,
                totalAmount: order.totalAmount,
                currency: order.currency,
              })
            } catch (e) {
              console.error(`[OutboxWorker] createInvoice (legacy) failed:`, e)
            }
          }
          break
        }
        case 'invoice.created': {
          const orderId = payload.orderId as string
          const amount = payload.amount as number
          console.log(`[OutboxWorker] invoice.created order=${orderId} amount=${amount}`)
          // TODO: ارسال ایمیل فاکتور — فعلاً لاگ
          break
        }
        case 'invoice.paid': {
          const orderId = payload.orderId as string
          console.log(`[OutboxWorker] invoice.paid order=${orderId}`)
          break
        }
        case 'shipment.status_changed': {
          const orderId = payload.orderId as string
          const status = payload.status as string
          console.log(
            `[OutboxWorker] shipment.status_changed order=${orderId} status=${status} tracking=${payload.trackingNumber || 'none'}`
          )
          break
        }
        default:
          console.log(`[OutboxWorker] unhandled event type: ${event.type}`)
      }
    } catch (err) {
      console.error(`[OutboxWorker] handler failed for ${event.type} ${eventId}:`, err)
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
  console.error(`[OutboxWorker] job ${job?.id} failed:`, err.message)
  // افزایش retryCount برای DLQ — dispatcher پس از ۵ بار دیگر enqueue نمی‌کند
  if (job?.data?.eventId) {
    try {
      await prisma.outboxEvent.update({
        where: { id: job.data.eventId as string },
        data: { retryCount: { increment: 1 } },
      })
    } catch (e) {
      console.error('[OutboxWorker] failed to increment retryCount:', e)
    }
  }
})
