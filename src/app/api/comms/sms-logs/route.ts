import { NextRequest, NextResponse } from 'next/server'
import { commsService } from '@/server/communications/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'

export async function GET(req: NextRequest) {
  try {
    const guard = await requirePermission('comms:read')
    if (!guard.ok) return guard.response

    const { searchParams } = req.nextUrl
    const to = searchParams.get('to') || undefined
    const page = Number(searchParams.get('page')) || 1
    const limit = parseLimit(searchParams)

    const result = await commsService.listSmsLogs({ to, page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}
