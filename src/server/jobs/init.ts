import 'server-only'
import { startOutboxDispatcher } from './dispatchers/outbox-dispatcher'
import './registry'

let started = false

export function startBackgroundJobs() {
  if (started) return
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  if (process.env.NODE_ENV === 'test') return

  started = true
  startOutboxDispatcher()
  console.log('[BackgroundJobs] outbox dispatcher started')
}
