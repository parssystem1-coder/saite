import { NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { redis } from '@/server/shared/redis'

export async function GET() {
  let dbOk = false
  let redisOk = false

  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  try {
    await redis.ping()
    redisOk = true
  } catch {
    redisOk = false
  }

  const allOk = dbOk && redisOk
  const checks = {
    status: allOk ? 'ok' : 'degraded',
    db: dbOk,
    redis: redisOk,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(checks, { status: allOk ? 200 : 503 })
}
