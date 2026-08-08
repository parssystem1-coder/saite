import { NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'

export async function GET() {
  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  const checks = {
    db: dbOk,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(checks, { status: dbOk ? 200 : 503 })
}
