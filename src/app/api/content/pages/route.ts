import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, checkMutationRateLimit } from '@/server/shared/http-utils'
import { pageCreateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(req: NextRequest) {
  try {
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
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await checkMutationRateLimit(req, 'content-page-create', 20, 60_000)
    if (rateLimitResponse) return rateLimitResponse

    const guard = await requirePermission('content:write')
    if (!guard.ok) return guard.response

    const body = parseWithSchema(pageCreateSchema, await parseJsonBody(req))
    const page = await contentService.createPage(body)
    return NextResponse.json(page, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
