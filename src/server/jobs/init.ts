import 'server-only'
import { startOutboxDispatcher } from './dispatchers/outbox-dispatcher'

let started = false

export async function startBackgroundJobs() {
  if (started) return
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  if (process.env.NODE_ENV === 'test') return

  started = true
  // registry فقط زمانی لود شود که واقعاً می‌خواهیم jobها را استارت کنیم
  // تا وابستگی چرخه‌ای db → jobs → registry → workers → db در زمان build شکسته شود
  await import('./registry')
  startOutboxDispatcher()
  console.log('[BackgroundJobs] outbox dispatcher started')
}
