import 'server-only'
import { logger } from '@/server/shared/logger'
/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma stub vs real، Map/filter با any */
import { prisma } from '@/server/shared/db'
import { OUTBOX_BATCH_SIZE, OUTBOX_MAX_RETRY, OUTBOX_POLL_MS } from '@/server/shared/constants'
import { outboxQueue } from '../queues'

let intervalId: ReturnType<typeof setInterval> | null = null

export function startOutboxDispatcher() {
  if (intervalId) return

  async function poll() {
    try {
      const events = await prisma.outboxEvent.findMany({
        where: { processedAt: null, retryCount: { lt: OUTBOX_MAX_RETRY } },
        orderBy: { createdAt: 'asc' },
        take: OUTBOX_BATCH_SIZE,
      })

      for (const event of events) {
        try {
          await outboxQueue.add(
            event.type,
            { eventId: event.id },
            { jobId: event.id, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
          )
          // علامت‌گذاری dispatch — جلوگیری از re-enqueue بی‌نهایت قبل از پردازش
          // اگر job قبلاً وجود داشته باشد (dedupe)، increment بی‌ضرر است و DLQ را جلو می‌برد
          await prisma.outboxEvent.update({
            where: { id: event.id },
            data: { retryCount: { increment: 1 } },
          })
        } catch (e: unknown) {
          // اگر jobId تکراری باشد (dedupe)، خطا را نادیده بگیر
          const msg = e instanceof Error ? e.message : String(e)
          if (!msg.includes('already exists') && !msg.includes('Job')) {
            logger.error({ err: e, eventId: event.id }, '[OutboxDispatcher] enqueue failed')
          }
        }
      }

      // DLQ: رویدادهایی که ۵ بار تلاش شدند و هنوز processedAt ندارند را لاگ کن
      const stuck = events.filter((e: any) => e.retryCount + 1 >= OUTBOX_MAX_RETRY)
      if (stuck.length > 0) {
        logger.warn({ stuckIds: stuck.map((e: any) => e.id) }, `[OutboxDispatcher] ${stuck.length} events reached DLQ`)
      }
    } catch (err) {
      logger.error({ err }, '[OutboxDispatcher] poll error')
    }
  }

  intervalId = setInterval(poll, OUTBOX_POLL_MS)
  // جلوگیری از نگه‌داشتن process در تست
  if (intervalId && typeof (intervalId as unknown as { unref?: () => void }).unref === 'function') {
    ;(intervalId as unknown as { unref: () => void }).unref()
  }
  poll() // اولین poll فوری
}

export function stopOutboxDispatcher() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
