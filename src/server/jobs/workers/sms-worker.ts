import 'server-only'
import { logger } from '@/server/shared/logger'
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
  logger.error({ err, jobId: job?.id }, '[SmsWorker] job failed')
})
