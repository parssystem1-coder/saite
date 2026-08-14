import 'server-only'
import { logger } from '@/server/shared/logger'
import { startOutboxDispatcher } from './dispatchers/outbox-dispatcher'
import { startInventoryExpiryDispatcher } from './dispatchers/inventory-expiry-dispatcher'
import { startLogRetentionDispatcher } from './dispatchers/log-retention-dispatcher'

let started = false

export async function startBackgroundJobs() {
  if (started) return
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  if (process.env.NODE_ENV === 'test') return
  if (process.env.RUN_JOBS === '0') return

  started = true
  // registry فقط زمانی لود شود که واقعاً می‌خواهیم jobها را استارت کنیم
  // تا وابستگی چرخه‌ای db → jobs → registry → workers → db در زمان build شکسته شود
  await import('./registry')
  startOutboxDispatcher()
  startInventoryExpiryDispatcher()
  startLogRetentionDispatcher()
  logger.info('[BackgroundJobs] outbox, inventory expiry, and log retention dispatchers started')
}
