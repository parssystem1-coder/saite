import 'server-only'
import { detectInjection } from '@/server/ai/safety'
import { ValidationError } from '@/server/shared/errors'
import {
  parseProductSeoImport,
  PRODUCT_SEO_IMPORT_MAX_CHARS,
  SEO_PACK_ERRORS,
} from '@/lib/seo/product-seo-pack'
import {
  listEmptySeoFields,
  pickEmptyOnlySuggestion,
  suggestionHasContent,
  type ProductSeoCurrentFields,
  type ProductSeoSuggestion,
} from '@/lib/seo/product-seo-suggestion'

export const PRODUCT_SEO_IMPORT_VERSION = 'import:v1'

export type ImportProductSeoInput = {
  rawText: string
  emptyOnly: boolean
  current: ProductSeoCurrentFields
}

export type ImportProductSeoResult = {
  suggestion: ProductSeoSuggestion
  promptVersion: string
  emptyOnly: boolean
  source: 'file'
}

/**
 * ایمپورت فایل نسخه‌دار سئو.
 * هیچ ستونی نوشته نمی‌شود؛ خروجی فقط برای پنل diff است.
 */
export function importProductSeoSuggestion(input: ImportProductSeoInput): ImportProductSeoResult {
  if (input.rawText.length > PRODUCT_SEO_IMPORT_MAX_CHARS) {
    throw new ValidationError({ seo: SEO_PACK_ERRORS.tooLarge }, SEO_PACK_ERRORS.tooLarge)
  }

  if (detectInjection({ rawText: input.rawText })) {
    throw new ValidationError({ seo: 'ورودی غیرمجاز شناسایی شد.' }, 'ورودی غیرمجاز شناسایی شد.')
  }

  if (input.emptyOnly && listEmptySeoFields(input.current).length === 0) {
    throw new ValidationError(
      { seo: 'همهٔ فیلدهای سئو پر هستند' },
      'همهٔ فیلدهای سئو پر هستند. گزینهٔ «فقط فیلدهای خالی» را خاموش کنید یا فیلدی را خالی بگذارید.'
    )
  }

  const parsed = parseProductSeoImport(input.rawText)
  if (!parsed.ok) {
    throw new ValidationError({ seo: parsed.message }, parsed.message)
  }

  const suggestion = input.emptyOnly
    ? pickEmptyOnlySuggestion(parsed.value, input.current)
    : parsed.value

  if (!suggestionHasContent(suggestion)) {
    throw new ValidationError(
      { seo: 'پیشنهاد خالی' },
      'پس از فیلتر «فقط فیلدهای خالی» چیزی برای اعمال نماند.'
    )
  }

  return {
    suggestion,
    promptVersion: PRODUCT_SEO_IMPORT_VERSION,
    emptyOnly: input.emptyOnly,
    source: 'file',
  }
}
