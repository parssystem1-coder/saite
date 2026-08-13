import type { KeywordInsight, SeoToolProvider } from '@/lib/seo/seo-tool-contract'
import { normalizeSeoKeyword } from '@/lib/seo/seo-tool-contract'

function stableScore(input: string, min: number, max: number): number {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return min + (hash % (max - min + 1))
}

/**
 * Stub همیشه‌حاضر — سایت بدون حساب Ahrefs/SEMrush کار می‌کند.
 * حذف نشود.
 */
export const mockSeoToolProvider: SeoToolProvider = {
  id: 'mock',
  async lookupKeyword(input): Promise<KeywordInsight> {
    const keyword = normalizeSeoKeyword(input.keyword)
    return {
      keyword,
      searchVolume: stableScore(keyword, 80, 2400),
      difficulty: stableScore(`${keyword}:d`, 12, 68),
      related: [`خرید ${keyword}`, `قیمت ${keyword}`, `${keyword} گارانتی`].map((item) =>
        item.slice(0, 80)
      ),
      source: 'mock',
      mode: 'stub',
    }
  },
}
