import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const location = searchParams.get('location') || 'header'
  const active = searchParams.has('active') ? searchParams.get('active') === 'true' : true

  // منوی غیرفعال فقط برای ادمین
  if (active !== true) {
    const guard = await requirePermission('content:read')
    if (!guard.ok) return guard.response
  }

  const items = await contentService.listMenuItems({ location, active })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('content:write')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const item = await contentService.createMenuItem(body)
  return NextResponse.json(item, { status: 201 })
}
