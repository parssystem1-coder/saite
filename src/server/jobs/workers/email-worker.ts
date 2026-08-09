import 'server-only'
import { logger } from '@/server/shared/logger'
import { Worker } from 'bullmq'
import { redis } from '@/server/shared/redis'
import { commsService } from '@/server/communications/service'

export const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, body, template } = job.data as {
      to: string
      subject: string
      body: string
      template?: string
    }
    await commsService.sendEmail({ to, subject, body, template })
  },
  { connection: redis, concurrency: 3 }
)

emailWorker.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id }, '[EmailWorker] job failed')
})
