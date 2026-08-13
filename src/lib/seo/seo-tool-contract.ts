import { FOCUS_KEYWORD_MAX, stripMarkup } from '@/lib/seo/product-seo-suggestion'

export const SEO_TOOL_PROVIDER_IDS = ['mock', 'ahrefs', 'semrush'] as const
export type SeoToolProviderId = (typeof SEO_TOOL_PROVIDER_IDS)[number]

export const SEO_TOOL_CACHE_TTL_SECONDS = 15 * 60
export const SEO_KEYWORD_MAX = FOCUS_KEYWORD_MAX

export type SeoToolMode = 'live' | 'stub'

export type KeywordInsight = {
  keyword: string
  searchVolume: number | null
  difficulty: number | null
  related: string[]
  source: SeoToolProviderId
  mode: SeoToolMode
}

export type SeoToolLookupInput = {
  keyword: string
  country?: string
}

export interface SeoToolProvider {
  readonly id: SeoToolProviderId
  lookupKeyword(input: SeoToolLookupInput): Promise<KeywordInsight>
}

export function normalizeSeoKeyword(raw: string): string {
  return stripMarkup(raw).replace(/\s+/g, ' ').trim().slice(0, SEO_KEYWORD_MAX)
}
