import 'server-only'
import { Worker } from 'bullmq'
import { redis } from '@/server/shared/redis'
import { commsService } from '@/server/communications/service'

export const smsWorker = new Worker(
  'sms',
  async (job) => {
    const { to, body, template } = job.data as {
      to: string
      body: string
      template?: string
    }
    await commsService.sendSms({ to, body, template })
  },
  { connection: redis, concurrency: 3 }
)

smsWorker.on('failed', (job, err) => {
  console.error(`[SmsWorker] job ${job?.id} failed:`, err.message)
})
