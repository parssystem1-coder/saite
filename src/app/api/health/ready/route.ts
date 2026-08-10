import { NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { redis } from '@/server/shared/redis'

/**
 * Readiness probe: وابستگی‌های لازم برای پاسخ‌گویی واقعی را بررسی می‌کند.
 * این endpoint برای load balancer/container orchestration است، نه liveness.
 */
export async function GET() {
  const [db, redisOk] = await Promise.all([
    prisma.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    redis
      .ping()
      .then(() => true)
      .catch(() => false),
  ])

  const ready = db && redisOk
  return NextResponse.json(
    { status: ready ? 'ok' : 'degraded', db, redis: redisOk, timestamp: new Date().toISOString() },
    { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
