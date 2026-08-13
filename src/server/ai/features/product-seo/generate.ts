import 'server-only'
import { callChat } from '@/server/ai/gateway'
import {
  listEmptySeoFields,
  pickEmptyOnlySuggestion,
  suggestionHasContent,
  type ProductSeoCurrentFields,
  type ProductSeoSuggestion,
} from '@/lib/seo/product-seo-suggestion'
import { ValidationError } from '@/server/shared/errors'
import { parseProductSeoOutput } from './output'
import {
  PRODUCT_SEO_FEATURE,
  PRODUCT_SEO_MAX_TOKENS,
  PRODUCT_SEO_PROMPT_VERSION,
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
  brand: string
  model: string
  series: string
  slug: string
  shortDescription: string
  longDescription: string
  specs: unknown
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

export async function generateProductSeoSuggestion(
  input: GenerateProductSeoInput
): Promise<GenerateProductSeoResult> {
  const emptyFields = listEmptySeoFields(input.current)
  if (input.emptyOnly && emptyFields.length === 0) {
    throw new ValidationError(
      { seo: 'همهٔ فیلدهای سئو پر هستند' },
      'همهٔ فیلدهای سئو پر هستند. گزینهٔ «فقط فیلدهای خالی» را خاموش کنید یا فیلدی را خالی بگذارید.'
    )
  }

  const raw = await callChat({
    feature: PRODUCT_SEO_FEATURE,
    promptVersion: PRODUCT_SEO_PROMPT_VERSION,
    actorId: input.actorId,
    maxTokens: PRODUCT_SEO_MAX_TOKENS,
    variables: {
      productName: input.productName,
      nameEn: input.nameEn,
      category: input.category,
      brand: input.brand,
      model: input.model,
      series: input.series,
      slug: input.slug,
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
    },
  })

  const parsed = parseProductSeoOutput(raw)
  const suggestion = input.emptyOnly ? pickEmptyOnlySuggestion(parsed, input.current) : parsed

  if (!suggestionHasContent(suggestion)) {
    throw new ValidationError(
      { seo: 'پیشنهاد خالی' },
      'هوش مصنوعی پیشنهادی برای فیلدهای خالی نداد. دوباره تلاش کنید یا گزینهٔ «فقط فیلدهای خالی» را خاموش کنید.'
    )
  }

  return {
    suggestion,
    promptVersion: PRODUCT_SEO_PROMPT_VERSION,
    emptyOnly: input.emptyOnly,
  }
}
