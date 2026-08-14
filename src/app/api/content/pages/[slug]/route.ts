import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError } from '@/server/shared/http-utils'
import { checkRouteRateLimit } from '@/server/shared/rate-limit-policy'
import { pageUpdateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const page = await contentService.getPageBySlug(slug)
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    // صفحه منتشرنشده فقط برای ادمین
    if (!page.isPublished) {
      const guard = await requirePermission('content:read')
      if (!guard.ok) return guard.response
    }
    return NextResponse.json(page)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rateLimit = await checkRouteRateLimit(req, 'content-update')
    if (rateLimit) return rateLimit

    const guard = await requirePermission('content:write')
    if (!guard.ok) return guard.response

    const { slug } = await params
    const page = await contentService.getPageBySlug(slug)
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    const body = parseWithSchema(pageUpdateSchema, await parseJsonBody(req))
    const updated = await contentService.updatePage(page.id, body)
    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rateLimit = await checkRouteRateLimit(req, 'content-update')
    if (rateLimit) return rateLimit

    const guard = await requirePermission('content:write')
    if (!guard.ok) return guard.response

    const { slug } = await params
    const page = await contentService.getPageBySlug(slug)
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    await contentService.deletePage(page.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleServiceError(err)
  }
}
