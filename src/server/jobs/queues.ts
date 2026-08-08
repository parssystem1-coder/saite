import 'server-only'
import { Queue } from 'bullmq'
import { redis } from '@/server/shared/redis'

export const outboxQueue = new Queue('outbox', { connection: redis })
export const emailQueue = new Queue('email', { connection: redis })
export const smsQueue = new Queue('sms', { connection: redis })

export async function closeQueues() {
  await Promise.all([
    outboxQueue.close(),
    emailQueue.close(),
    smsQueue.close(),
  ])
}
