import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/server/require-role'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { importProductSeoSuggestion } from '@/server/ai/features/product-seo/import'
import { PRODUCT_SEO_IMPORT_MAX_CHARS, SEO_PACK_ERRORS } from '@/lib/seo/product-seo-pack'
import { parseJsonBody, parseWithSchema } from '@/server/shared/validation'
import { handleServiceError } from '@/server/shared/http-utils'
import { ValidationError } from '@/server/shared/errors'

/**
 * POST /api/admin/products/seo/import
 *
 * پارس سخت‌گیرانهٔ فایل نسخه‌دار سئو. هیچ ستونی نوشته نمی‌شود.
 * HTML/iframe تفسیر نمی‌شود — فقط JSON متنی به پنل diff می‌رود.
 */

export const runtime = 'nodejs'

const SEO_IMPORT_LIMIT = { max: 10, windowMs: 60_000 }

const faqSnapshotSchema = z.object({
  question: z.string().max(200),
  answer: z.string().max(800),
})

const importBodySchema = z.object({
  rawText: z.string().min(1).max(PRODUCT_SEO_IMPORT_MAX_CHARS),
  emptyOnly: z.boolean().optional().default(true),
  current: z.object({
    seoTitle: z.string().max(120).optional().default(''),
    seoDescription: z.string().max(300).optional().default(''),
    focusKeyword: z.string().max(120).optional().default(''),
    canonicalUrl: z.string().max(500).optional().default(''),
  }),
  faqs: z.array(faqSnapshotSchema).max(20).optional().default([]),
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission('catalog:write')
  if (!guard.ok) return guard.response

  const actorKey = `seo-import:actor:${guard.admin.id}`
  const ipKey = `seo-import:ip:${getClientKey(req.headers)}`
  const actorLimit = await consumeRateLimit(actorKey, SEO_IMPORT_LIMIT.max, SEO_IMPORT_LIMIT.windowMs)
  if (!actorLimit.allowed) {
    return NextResponse.json(
      { error: 'سقف ایمپورت سئو در این دقیقه پر شده است. کمی بعد دوباره تلاش کنید.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(actorLimit.retryAfterSeconds) } }
    )
  }
  const ipLimit = await consumeRateLimit(ipKey, SEO_IMPORT_LIMIT.max, SEO_IMPORT_LIMIT.windowMs)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'سقف ایمپورت سئو در این دقیقه پر شده است. کمی بعد دوباره تلاش کنید.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    )
  }

  try {
    const rawBody = await parseJsonBody(req)
    if (isRecord(rawBody) && typeof rawBody.rawText === 'string' && rawBody.rawText.length > PRODUCT_SEO_IMPORT_MAX_CHARS) {
      throw new ValidationError({ rawText: SEO_PACK_ERRORS.tooLarge }, SEO_PACK_ERRORS.tooLarge)
    }

    const body = parseWithSchema(importBodySchema, rawBody)
    const result = importProductSeoSuggestion({
      rawText: body.rawText,
      emptyOnly: body.emptyOnly,
      current: {
        seoTitle: body.current.seoTitle,
        seoDescription: body.current.seoDescription,
        focusKeyword: body.current.focusKeyword,
        canonicalUrl: body.current.canonicalUrl,
        faqs: body.faqs,
      },
    })

    return NextResponse.json({
      suggestion: result.suggestion,
      promptVersion: result.promptVersion,
      emptyOnly: result.emptyOnly,
      source: result.source,
    })
  } catch (err) {
    return handleServiceError(err)
  }
}
