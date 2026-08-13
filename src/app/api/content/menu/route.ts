import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, checkMutationRateLimit } from '@/server/shared/http-utils'
import { menuItemCreateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(req: NextRequest) {
  try {
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
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await checkMutationRateLimit(req, 'content-menu-create', 30, 60_000)
    if (rateLimitResponse) return rateLimitResponse

    const guard = await requirePermission('content:write')
    if (!guard.ok) return guard.response

    const body = parseWithSchema(menuItemCreateSchema, await parseJsonBody(req))
    const item = await contentService.createMenuItem(body)
    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
