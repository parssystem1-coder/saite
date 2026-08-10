import { NextResponse } from 'next/server'

/**
 * سازگاری با monitorهای قبلی. برای probeهای جدید از مسیرهای صریح زیر استفاده کنید:
 * - /api/health/live  : سلامت خود process
 * - /api/health/ready : آمادگی DB و Redis
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      checks: { liveness: '/api/health/live', readiness: '/api/health/ready' },
      timestamp: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
