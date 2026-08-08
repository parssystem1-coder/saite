import 'server-only'
import { Worker } from 'bullmq'
import { redis } from '@/server/shared/redis'
import { prisma } from '@/server/shared/db'

export const outboxWorker = new Worker(
  'outbox',
  async (job) => {
    const { eventId } = job.data as { eventId: string }
    const event = await prisma.outboxEvent.findUnique({ where: { id: eventId } })
    if (!event || event.processedAt) return

    const payload = event.payload as Record<string, unknown>

    switch (event.type) {
      case 'invoice.created': {
        const orderId = payload.orderId as string
        const amount = payload.amount as number
        // TODO: ارسال ایمیل فاکتور
        console.log(`[OutboxWorker] invoice.created order=${orderId} amount=${amount}`)
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
        console.log(`[OutboxWorker] shipment.status_changed order=${orderId} status=${status} tracking=${payload.trackingNumber || 'none'}`)
        break
      }
      case 'order.paid': {
        const orderId = payload.orderId as string
        const customerId = payload.customerId as string
        console.log(`[OutboxWorker] order.paid order=${orderId} customer=${customerId}`)
        break
      }
      default:
        console.log(`[OutboxWorker] unhandled event type: ${event.type}`)
    }

    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date() },
    })
  },
  { connection: redis, concurrency: 5 }
)

outboxWorker.on('failed', (job, err) => {
  console.error(`[OutboxWorker] job ${job?.id} failed:`, err.message)
})
