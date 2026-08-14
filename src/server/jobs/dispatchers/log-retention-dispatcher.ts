import 'server-only'

import { prisma } from '@/server/shared/db'
import {
  AI_USAGE_RETENTION_DAYS,
  LOG_RETENTION_DAYS,
  LOG_RETENTION_POLL_MS,
  OUTBOX_RETENTION_DAYS,
} from '@/server/shared/constants'
import { logger } from '@/server/shared/logger'

let intervalId: ReturnType<typeof setInterval> | null = null
let running = false

/**
 * پاکسازی دوره‌ای لاگ‌های حاوی PII و رویدادهای پردازش‌شده.
 *
 * فقط روی instance با `RUN_JOBS=1` اجرا می‌شود (از `jobs/init.ts`).
 * هر روز یک‌بار (پیش‌فرض) با poll سادهٔ شبیه الگوی inventory-expiry
 * اجرا می‌شود. مهاجرت به scheduler در فاز ۴ برنامه‌ریزی شده.
 */
export async function runLogRetention(): Promise<{
  emailLogs: number
  smsLogs: number
  outbox: number
  aiUsage: number
}> {
  const now = new Date()

  const emailCutoff = new Date(now.getTime() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const smsCutoff = new Date(now.getTime() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const outboxCutoff = new Date(now.getTime() - OUTBOX_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const aiUsageCutoff = new Date(now.getTime() - AI_USAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  // ایندکس‌های (status, createdAt) که در فاز ۲ ساخته شدند همین کوئری را پوشش می‌دهند.
  const [emailLogs, smsLogs, outbox, aiUsage] = await prisma.$transaction([
    prisma.emailLog.deleteMany({ where: { createdAt: { lt: emailCutoff } } }),
    prisma.smsLog.deleteMany({ where: { createdAt: { lt: smsCutoff } } }),
    prisma.outboxEvent.deleteMany({
      where: { processedAt: { not: null }, createdAt: { lt: outboxCutoff } },
    }),
    prisma.aiUsageLog.deleteMany({ where: { createdAt: { lt: aiUsageCutoff } } }),
  ])

  return { emailLogs: emailLogs.count, smsLogs: smsLogs.count, outbox: outbox.count, aiUsage: aiUsage.count }
}

export function startLogRetentionDispatcher() {
  if (intervalId) return

  const poll = async () => {
    if (running) return
    running = true
    try {
      const result = await runLogRetention()
      if (
        result.emailLogs > 0 ||
        result.smsLogs > 0 ||
        result.outbox > 0 ||
        result.aiUsage > 0
      ) {
        logger.info(result, '[LogRetention] old PII logs and processed outbox purged')
      }
    } catch (err) {
      logger.error({ err }, '[LogRetention] poll failed')
    } finally {
      running = false
    }
  }

  intervalId = setInterval(poll, LOG_RETENTION_POLL_MS)
  intervalId.unref?.()
  void poll()
}

export function stopLogRetentionDispatcher() {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
}
