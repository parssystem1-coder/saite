import type { Attribute, ProductDraft, ProductFaq, ProductImage } from './product-editor.types'
import type { ProductSeoSuggestion } from '@/lib/seo/product-seo-suggestion'

export function applyProductSeoSuggestionToDraft(
  suggestion: ProductSeoSuggestion,
  set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void
): void {
  if (suggestion.name !== undefined) set('name', suggestion.name)
  if (suggestion.nameEn !== undefined) set('nameEn', suggestion.nameEn)
  if (suggestion.slug !== undefined) set('slug', suggestion.slug)
  if (suggestion.sku !== undefined) set('sku', suggestion.sku)
  if (suggestion.series !== undefined) set('series', suggestion.series)
  if (suggestion.model !== undefined) set('model', suggestion.model)
  if (suggestion.category !== undefined) set('category', suggestion.category)
  if (suggestion.subCategory !== undefined) set('subCategory', suggestion.subCategory)
  if (suggestion.brand !== undefined) set('brand', suggestion.brand)
  if (suggestion.shortDescription !== undefined) set('shortDescription', suggestion.shortDescription)
  if (suggestion.longDescription !== undefined) set('longDescription', suggestion.longDescription)
  if (suggestion.seoTitle !== undefined) set('seoTitle', suggestion.seoTitle)
  if (suggestion.seoDescription !== undefined) set('seoDescription', suggestion.seoDescription)
  if (suggestion.focusKeyword !== undefined) set('focusKeyword', suggestion.focusKeyword)
  if (suggestion.canonicalUrl !== undefined) set('canonicalUrl', suggestion.canonicalUrl)
}

export function suggestionFaqsToEditor(faqs: NonNullable<ProductSeoSuggestion['faqs']>): ProductFaq[] {
  return faqs.map((faq, index) => ({
    id: `ai-faq-${index}-${faq.question.slice(0, 12)}`,
    question: faq.question,
    answer: faq.answer,
    visible: true,
    inSchema: true,
  }))
}

export function suggestionAttributesToEditor(
  attributes: NonNullable<ProductSeoSuggestion['attributes']>
): Attribute[] {
  return attributes.map((item, index) => ({
    id: `ai-attr-${index}-${item.name.slice(0, 12)}`,
    group: item.group,
    name: item.name,
    value: item.value,
    unit: item.unit ?? '',
    filterable: true,
    comparable: true,
    inSchema: true,
  }))
}

export function applyImageAlts(
  images: ProductImage[],
  alts: string[]
): ProductImage[] {
  return images.map((image, index) => {
    const alt = alts[index]?.trim()
    if (!alt) return image
    return { ...image, alt, title: image.title.trim() ? image.title : alt }
  })
}
