import { NextRequest, NextResponse } from 'next/server'
import { commsService } from '@/server/communications/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(req: NextRequest) {
  const guard = await requirePermission('comms:read')
  if (!guard.ok) return guard.response

  const { searchParams } = req.nextUrl
  const to = searchParams.get('to') || undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await commsService.listEmailLogs({ to, page, limit })
  return NextResponse.json(result)
}
