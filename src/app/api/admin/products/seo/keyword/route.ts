import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/server/require-role'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { detectInjection } from '@/server/ai/safety'
import { lookupKeywordInsight } from '@/server/seo-tools/gateway'
import { parseJsonBody, parseWithSchema } from '@/server/shared/validation'
import { handleServiceError } from '@/server/shared/http-utils'
import { SEO_KEYWORD_MAX } from '@/lib/seo/seo-tool-contract'

/**
 * POST /api/admin/products/seo/keyword
 *
 * پیش‌نمایش بینش کلمهٔ کلیدی. کلید API هرگز برنمی‌گردد.
 * بدون حساب → stub. هیچ فیلدی خودکار اعمال نمی‌شود.
 */

export const runtime = 'nodejs'

const SEO_KEYWORD_LIMIT = { max: 10, windowMs: 60_000 }

const keywordBodySchema = z.object({
  keyword: z.string().min(1).max(SEO_KEYWORD_MAX),
})

export async function POST(req: NextRequest) {
  const guard = await requirePermission('catalog:write')
  if (!guard.ok) return guard.response

  const actorKey = `seo-keyword:actor:${guard.admin.id}`
  const ipKey = `seo-keyword:ip:${getClientKey(req.headers)}`
  const actorLimit = await consumeRateLimit(actorKey, SEO_KEYWORD_LIMIT.max, SEO_KEYWORD_LIMIT.windowMs)
  if (!actorLimit.allowed) {
    return NextResponse.json(
      { error: 'سقف بررسی کلمهٔ کلیدی در این دقیقه پر شده است.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(actorLimit.retryAfterSeconds) } }
    )
  }
  const ipLimit = await consumeRateLimit(ipKey, SEO_KEYWORD_LIMIT.max, SEO_KEYWORD_LIMIT.windowMs)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'سقف بررسی کلمهٔ کلیدی در این دقیقه پر شده است.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    )
  }

  try {
    const body = parseWithSchema(keywordBodySchema, await parseJsonBody(req))
    if (detectInjection({ keyword: body.keyword })) {
      return NextResponse.json({ error: 'ورودی غیرمجاز شناسایی شد.', code: 'INVALID_INPUT' }, { status: 400 })
    }

    const insight = await lookupKeywordInsight(body.keyword)
    return NextResponse.json({ insight })
  } catch (err) {
    return handleServiceError(err)
  }
}
