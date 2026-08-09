import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const isPublished = searchParams.has('published') ? searchParams.get('published') === 'true' : undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  // لیست صفحات منتشرنشده یا همه صفحات فقط برای ادمین
  if (isPublished !== true) {
    const guard = await requirePermission('content:read')
    if (!guard.ok) return guard.response
  }

  const result = await contentService.listPages({ isPublished, page, limit })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('content:write')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const page = await contentService.createPage(body)
  return NextResponse.json(page, { status: 201 })
}
