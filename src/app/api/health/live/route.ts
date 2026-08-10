import { NextResponse } from 'next/server'

/**
 * Liveness probe: فقط نشان می‌دهد process پاسخ‌گو است.
 * به DB/Redis وابسته نیست تا خرابی یک dependency باعث restart-loop نشود.
 */
export function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
