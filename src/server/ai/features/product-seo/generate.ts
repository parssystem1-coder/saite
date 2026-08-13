import 'server-only'
import { callChat } from '@/server/ai/gateway'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import { normalizeProductSeoSuggestion } from '@/lib/seo/product-seo-normalize'
import {
  hasProductSeoSeed,
  listEmptySeoFields,
  pickEmptyOnlySuggestion,
  suggestionHasContent,
  type ProductSeoCurrentFields,
  type ProductSeoSuggestion,
} from '@/lib/seo/product-seo-suggestion'
import { ValidationError } from '@/server/shared/errors'
import { lookupKeywordInsight } from '@/server/seo-tools/gateway'
import { parseProductSeoOutput } from './output'
import {
  PRODUCT_SEO_FEATURE,
  PRODUCT_SEO_MAX_TOKENS,
  resolveProductSeoPromptPackId,
} from './prompt'

const LONG_DESCRIPTION_LIMIT = 2500
const SPECS_LIMIT = 1500

export interface GenerateProductSeoInput {
  actorId: string
  emptyOnly: boolean
  current: ProductSeoCurrentFields
  productName: string
  nameEn: string
  category: string
  subCategory: string
  brand: string
  model: string
  series: string
  slug: string
  sku: string
  shortDescription: string
  longDescription: string
  specs: unknown
  packId?: string
  keywordHints?: string[]
  imageCount?: number
}

export interface GenerateProductSeoResult {
  suggestion: ProductSeoSuggestion
  promptVersion: string
  emptyOnly: boolean
}

function serializeSpecs(specs: unknown): string {
  try {
    const text = JSON.stringify(specs ?? null)
    return text.length > SPECS_LIMIT ? text.slice(0, SPECS_LIMIT) : text
  } catch {
    return ''
  }
}

async function resolveKeywordHints(input: GenerateProductSeoInput): Promise<string> {
  const provided = (input.keywordHints ?? []).map((hint) => hint.trim()).filter(Boolean).slice(0, 8)
  if (provided.length > 0) return provided.join('، ')

  const seed =
    input.current.focusKeyword.trim() ||
    input.productName.trim() ||
    `${input.brand} ${input.model}`.trim()
  if (!seed) return ''

  try {
    const insight = await lookupKeywordInsight(seed)
    return insight.related.slice(0, 8).join('، ')
  } catch {
    return ''
  }
}

export async function generateProductSeoSuggestion(
  input: GenerateProductSeoInput
): Promise<GenerateProductSeoResult> {
  if (
    !hasProductSeoSeed({
      name: input.productName,
      brand: input.brand,
      model: input.model,
      focusKeyword: input.current.focusKeyword,
    })
  ) {
    throw new ValidationError(
      { seo: 'دادهٔ شروع کافی نیست' },
      'برای محصول جدید حداقل نام، یا برند و مدل را در تب پایه وارد کنید.'
    )
  }

  const packId = resolveProductSeoPromptPackId(input.packId)
  const keywordHints = await resolveKeywordHints(input)

  const emptyFields = listEmptySeoFields(input.current)
  if (input.emptyOnly && emptyFields.length === 0) {
    throw new ValidationError(
      { seo: 'همهٔ فیلدهای سئو پر هستند' },
      'همهٔ فیلدهای سئو پر هستند. گزینهٔ «فقط فیلدهای خالی» را خاموش کنید یا فیلدی را خالی بگذارید.'
    )
  }

  const raw = await callChat({
    feature: PRODUCT_SEO_FEATURE,
    promptVersion: packId,
    actorId: input.actorId,
    maxTokens: PRODUCT_SEO_MAX_TOKENS,
    variables: {
      productName: input.productName,
      nameEn: input.nameEn,
      category: input.category,
      subCategory: input.subCategory,
      brand: input.brand,
      model: input.model,
      series: input.series,
      slug: input.slug,
      sku: input.sku,
      focusKeyword: input.current.focusKeyword,
      seoTitle: input.current.seoTitle,
      seoDescription: input.current.seoDescription,
      canonicalUrl: input.current.canonicalUrl,
      shortDescription: input.shortDescription,
      longDescription: input.longDescription.slice(0, LONG_DESCRIPTION_LIMIT),
      specs: serializeSpecs(input.specs),
      faqs: JSON.stringify(
        input.current.faqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }))
      ),
      emptyOnly: input.emptyOnly,
      emptyFields: emptyFields.join(','),
      keywordHints,
      imageCount: input.imageCount ?? 0,
      allowedCategories: CATEGORIES.map((item) => item.slug).join(', '),
      allowedBrands: BRANDS.map((item) => item.displayName).join(', '),
    },
  })

  const parsed = normalizeProductSeoSuggestion(parseProductSeoOutput(raw))
  const suggestion = input.emptyOnly ? pickEmptyOnlySuggestion(parsed, input.current) : parsed

  if (!suggestionHasContent(suggestion)) {
    throw new ValidationError(
      { seo: 'پیشنهاد خالی' },
      'هوش مصنوعی پیشنهادی برای فیلدهای خالی نداد. دوباره تلاش کنید یا گزینهٔ «فقط فیلدهای خالی» را خاموش کنید.'
    )
  }

  return {
    suggestion,
    promptVersion: packId,
    emptyOnly: input.emptyOnly,
  }
}
