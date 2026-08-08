import { NextRequest, NextResponse } from 'next/server'
import { commsService } from '@/server/communications/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const to = searchParams.get('to') || undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await commsService.listEmailLogs({ to, page, limit })
  return NextResponse.json(result)
}
