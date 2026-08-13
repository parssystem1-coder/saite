import 'server-only'
import { getSemrushDatabase } from '@/lib/seo/seo-tool-connections'
import type { KeywordInsight, SeoToolProvider } from '@/lib/seo/seo-tool-contract'
import { normalizeSeoKeyword } from '@/lib/seo/seo-tool-contract'

export function parseSemrushCsv(text: string): { phrase: string; volume: number | null } {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) throw new Error('SEMrush empty payload')
  const cols = lines[1]!.split(/[;,]/).map((col) => col.trim())
  const phrase = cols[0] ?? ''
  const volumeRaw = cols[1]
  const volume = volumeRaw !== undefined && volumeRaw !== '' ? Number(volumeRaw) : Number.NaN
  return {
    phrase,
    volume: Number.isFinite(volume) ? volume : null,
  }
}

/**
 * SEMrush کلید را فقط در query می‌پذیرد — URL هرگز در پیام خطا نمی‌آید.
 */
async function fetchSemrushPhrase(phrase: string): Promise<string> {
  const apiKey = process.env.SEMRUSH_API_KEY?.trim()
  if (!apiKey) throw new Error('SEMRUSH_API_KEY not set')

  const url = new URL('https://api.semrush.com/')
  url.searchParams.set('type', 'phrase_this')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('phrase', phrase)
  url.searchParams.set('export_columns', 'Ph,Nq')
  url.searchParams.set('database', getSemrushDatabase())

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal })
    const text = await response.text().catch(() => '')
    if (!response.ok) {
      throw new Error(`SEMrush request failed: ${response.status}`)
    }
    if (/^ERROR\b/i.test(text.trim())) {
      throw new Error('SEMrush returned an error payload')
    }
    return text
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('SEMrush request timed out')
    }
    const message = err instanceof Error ? err.message : 'SEMrush request failed'
    throw new Error(message.includes(apiKey) ? 'SEMrush request failed' : message)
  } finally {
    clearTimeout(timeout)
  }
}

export const semrushSeoToolProvider: SeoToolProvider = {
  id: 'semrush',
  async lookupKeyword(input): Promise<KeywordInsight> {
    const keyword = normalizeSeoKeyword(input.keyword)
    const parsed = parseSemrushCsv(await fetchSemrushPhrase(keyword))
    return {
      keyword: parsed.phrase || keyword,
      searchVolume: parsed.volume,
      difficulty: null,
      related: [],
      source: 'semrush',
      mode: 'live',
    }
  },
}

