import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/server/require-role'
import { consumeRateLimit, getClientKey } from '@/lib/auth/server/rate-limit'
import { detectInjection } from '@/server/ai/safety'
import { generateProductSeoSuggestion } from '@/server/ai/features/product-seo/generate'
import { parseJsonBody, parseWithSchema } from '@/server/shared/validation'
import { handleServiceError } from '@/server/shared/http-utils'
import {
  DEFAULT_PRODUCT_SEO_PACK_ID,
  PRODUCT_SEO_PROMPT_PACK_IDS,
} from '@/lib/seo/product-seo-prompt-packs'

/**
 * POST /api/admin/products/seo/generate
 *
 * پیشنهاد ساخت‌یافته برای پیش‌نویس محصول جدید.
 * هیچ ستونی در دیتابیس نوشته نمی‌شود. انتشار فقط با دکمهٔ کاربر است.
 */

export const runtime = 'nodejs'

const SEO_GENERATE_LIMIT = { max: 10, windowMs: 60_000 }

const faqSnapshotSchema = z.object({
  question: z.string().max(200),
  answer: z.string().max(800),
})

const attributeSnapshotSchema = z.object({
  name: z.string().max(80),
  value: z.string().max(120),
})

const generateBodySchema = z.object({
  emptyOnly: z.boolean().optional().default(false),
  draft: z.object({
    name: z.string().max(200),
    nameEn: z.string().max(200).optional().default(''),
    slug: z.string().max(120).optional().default(''),
    sku: z.string().max(80).optional().default(''),
    brand: z.string().max(100).optional().default(''),
    series: z.string().max(100).optional().default(''),
    model: z.string().max(100).optional().default(''),
    category: z.string().max(80).optional().default(''),
    subCategory: z.string().max(80).optional().default(''),
    focusKeyword: z.string().max(120).optional().default(''),
    seoTitle: z.string().max(120).optional().default(''),
    seoDescription: z.string().max(300).optional().default(''),
    canonicalUrl: z.string().max(500).optional().default(''),
    shortDescription: z.string().max(1000).optional().default(''),
    longDescription: z.string().max(20_000).optional().default(''),
  }),
  faqs: z.array(faqSnapshotSchema).max(20).optional().default([]),
  attributes: z.array(attributeSnapshotSchema).max(30).optional().default([]),
  imageAlts: z.array(z.string().max(160)).max(12).optional().default([]),
  imageCount: z.number().int().min(0).max(20).optional().default(0),
  specs: z.unknown().optional(),
  packId: z.enum(PRODUCT_SEO_PROMPT_PACK_IDS).optional().default(DEFAULT_PRODUCT_SEO_PACK_ID),
  keywordHints: z.array(z.string().max(80)).max(8).optional().default([]),
})

export async function POST(req: NextRequest) {
  const guard = await requirePermission('catalog:write')
  if (!guard.ok) return guard.response

  const actorKey = `seo-generate:actor:${guard.admin.id}`
  const ipKey = `seo-generate:ip:${getClientKey(req.headers)}`
  const actorLimit = await consumeRateLimit(actorKey, SEO_GENERATE_LIMIT.max, SEO_GENERATE_LIMIT.windowMs)
  if (!actorLimit.allowed) {
    return NextResponse.json(
      { error: 'سقف تولید سئو در این دقیقه پر شده است. کمی بعد دوباره تلاش کنید.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(actorLimit.retryAfterSeconds) } }
    )
  }
  const ipLimit = await consumeRateLimit(ipKey, SEO_GENERATE_LIMIT.max, SEO_GENERATE_LIMIT.windowMs)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'سقف تولید سئو در این دقیقه پر شده است. کمی بعد دوباره تلاش کنید.', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    )
  }

  try {
    const body = parseWithSchema(generateBodySchema, await parseJsonBody(req))

    if (detectInjection({ draft: body.draft, faqs: body.faqs, keywordHints: body.keywordHints })) {
      return NextResponse.json({ error: 'ورودی غیرمجاز شناسایی شد.', code: 'INVALID_INPUT' }, { status: 400 })
    }

    const result = await generateProductSeoSuggestion({
      actorId: guard.admin.id,
      emptyOnly: body.emptyOnly,
      current: {
        name: body.draft.name,
        nameEn: body.draft.nameEn,
        slug: body.draft.slug,
        sku: body.draft.sku,
        series: body.draft.series,
        model: body.draft.model,
        category: body.draft.category,
        subCategory: body.draft.subCategory,
        brand: body.draft.brand,
        shortDescription: body.draft.shortDescription,
        longDescription: body.draft.longDescription,
        seoTitle: body.draft.seoTitle,
        seoDescription: body.draft.seoDescription,
        focusKeyword: body.draft.focusKeyword,
        canonicalUrl: body.draft.canonicalUrl,
        faqs: body.faqs,
        attributes: body.attributes,
        imageAlts: body.imageAlts,
      },
      productName: body.draft.name,
      nameEn: body.draft.nameEn,
      category: body.draft.category,
      subCategory: body.draft.subCategory,
      brand: body.draft.brand,
      model: body.draft.model,
      series: body.draft.series,
      slug: body.draft.slug,
      sku: body.draft.sku,
      shortDescription: body.draft.shortDescription,
      longDescription: body.draft.longDescription,
      specs: body.specs ?? body.attributes,
      packId: body.packId,
      keywordHints: body.keywordHints,
      imageCount: body.imageCount,
    })

    return NextResponse.json({
      suggestion: result.suggestion,
      promptVersion: result.promptVersion,
      emptyOnly: result.emptyOnly,
    })
  } catch (err) {
    return handleServiceError(err)
  }
}
