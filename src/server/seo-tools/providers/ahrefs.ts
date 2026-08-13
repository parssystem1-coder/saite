import 'server-only'
import { z } from 'zod'
import { fetchJson } from '@/server/shared/fetch'
import { getSeoToolCountry } from '@/lib/seo/seo-tool-connections'
import type { KeywordInsight, SeoToolProvider } from '@/lib/seo/seo-tool-contract'
import { normalizeSeoKeyword } from '@/lib/seo/seo-tool-contract'

const AHREFS_OVERVIEW = 'https://api.ahrefs.com/v3/keywords-explorer/overview'

const ahrefsOverviewSchema = z.object({
  keywords: z
    .array(
      z.object({
        keyword: z.string().optional(),
        volume: z.number().nullable().optional(),
        difficulty: z.number().nullable().optional(),
        parent_topic: z.string().nullable().optional(),
      })
    )
    .optional(),
})

export const ahrefsSeoToolProvider: SeoToolProvider = {
  id: 'ahrefs',
  async lookupKeyword(input): Promise<KeywordInsight> {
    const apiKey = process.env.AHREFS_API_KEY?.trim()
    if (!apiKey) throw new Error('AHREFS_API_KEY not set')

    const keyword = normalizeSeoKeyword(input.keyword)
    const country = input.country ?? getSeoToolCountry()
    const url = new URL(AHREFS_OVERVIEW)
    url.searchParams.set('country', country)
    url.searchParams.set('select', 'keyword,volume,difficulty,parent_topic')
    url.searchParams.set('keywords', keyword)
    url.searchParams.set('limit', '1')

    const raw = await fetchJson<unknown>(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      timeoutMs: 8_000,
      retries: 0,
    })

    const parsed = ahrefsOverviewSchema.safeParse(raw)
    if (!parsed.success) throw new Error('Ahrefs payload rejected')
    const row = parsed.data.keywords?.[0]
    if (!row) throw new Error('Ahrefs returned no keywords')

    const related = row.parent_topic?.trim() ? [row.parent_topic.trim().slice(0, 80)] : []
    return {
      keyword: row.keyword?.trim() || keyword,
      searchVolume: row.volume ?? null,
      difficulty: row.difficulty ?? null,
      related,
      source: 'ahrefs',
      mode: 'live',
    }
  },
}
