import 'server-only'
import { prisma } from '@/server/shared/db'
import { outboxQueue } from '../queues'

const POLL_INTERVAL_MS = 5000

let intervalId: ReturnType<typeof setInterval> | null = null

export function startOutboxDispatcher() {
  if (intervalId) return

  async function poll() {
    try {
      const events = await prisma.outboxEvent.findMany({
        where: { processedAt: null },
        orderBy: { createdAt: 'asc' },
        take: 100,
      })

      for (const event of events) {
        await outboxQueue.add(
          event.type,
          { eventId: event.id },
          { jobId: event.id, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
        )
      }
    } catch (err) {
      console.error('[OutboxDispatcher] poll error:', err)
    }
  }

  intervalId = setInterval(poll, POLL_INTERVAL_MS)
  poll() // اولین poll فوری
}

export function stopOutboxDispatcher() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
