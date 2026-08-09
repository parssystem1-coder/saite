import 'server-only'
import { logger } from '@/server/shared/logger'
import { prisma } from '@/server/shared/db'
import { OUTBOX_BATCH_SIZE, OUTBOX_MAX_RETRY, OUTBOX_POLL_MS } from '@/server/shared/constants'
import { outboxQueue } from '../queues'

/**
 * Type محلی برای OutboxEvent — چون prisma generate در build بدون network ممکن است fail شود
 * این type با schema.prisma مدل OutboxEvent مطابقت دارد
 */
interface OutboxEventRow {
  id: string
  type: string
  payload: unknown
  aggregateId: string
  processedAt: Date | null
  retryCount: number
  createdAt: Date
}

let intervalId: ReturnType<typeof setInterval> | null = null

export function startOutboxDispatcher() {
  if (intervalId) return

  async function poll() {
    try {
      // ── Atomic Claim Batch ──────────────────────────────────────────
      // UPDATE + FOR UPDATE SKIP LOCKED: در یک transaction اتمیک، eventها را claim می‌کنیم
      // - FOR UPDATE SKIP LOCKED: از rowهای lock شده توسط instance دیگر رد می‌شود
      // - retryCount در همان UPDATE increment می‌شود — نیازی به update جداگانه نیست
      // - RETURNING: eventهای claim شده را برمی‌گرداند
      // این یعنی دو instance هم‌زمان هرگز یک event را enqueue نمی‌کنند
      const events = await prisma.$queryRaw<OutboxEventRow[]>`
        UPDATE outbox_events
        SET "retryCount" = "retryCount" + 1
        WHERE id IN (
          SELECT id FROM outbox_events
          WHERE "processedAt" IS NULL
            AND "retryCount" < ${OUTBOX_MAX_RETRY}
          ORDER BY "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT ${OUTBOX_BATCH_SIZE}
        )
        RETURNING *
      `

      if (events.length === 0) return

      for (const event of events) {
        try {
          await outboxQueue.add(
            event.type,
            { eventId: event.id },
            { jobId: event.id, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
          )
        } catch (e: unknown) {
          // اگر jobId تکراری باشد (dedupe)، خطا را نادیده بگیر
          const msg = e instanceof Error ? e.message : String(e)
          if (!msg.includes('already exists') && !msg.includes('Job')) {
            logger.error({ err: e, eventId: event.id }, '[OutboxDispatcher] enqueue failed')
          }
        }
      }

      // DLQ: رویدادهایی که به سقف retry رسیدند را لاگ کن
      const stuck = events.filter((e: OutboxEventRow) => e.retryCount >= OUTBOX_MAX_RETRY)
      if (stuck.length > 0) {
        logger.warn({ stuckIds: stuck.map((e: OutboxEventRow) => e.id) }, `[OutboxDispatcher] ${stuck.length} events reached DLQ`)
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
