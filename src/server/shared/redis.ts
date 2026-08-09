import 'server-only'
import { logger } from '@/server/shared/logger'
import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // build بدون Redis نباید کرش کند — اتصال تنبل
  lazyConnect: true,
  // اگر Redis در دسترس نباشد، BullMQ خودش retry می‌کند؛ خطا فقط لاگ می‌شود
})

redis.on('error', (err) => {
  logger.error({ err: err.message }, '[Redis] connection error')
})
