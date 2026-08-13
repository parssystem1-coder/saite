import { afterEach, describe, expect, it, vi } from 'vitest'
import { lookupKeywordInsight } from '@/server/seo-tools/gateway'
import { parseSemrushCsv } from '@/server/seo-tools/providers/semrush'
import { ahrefsSeoToolProvider } from '@/server/seo-tools/providers/ahrefs'
import { semrushSeoToolProvider } from '@/server/seo-tools/providers/semrush'

describe('seo tools gateway', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('با kill-switch خاموش fetch نمی‌زند', async () => {
    vi.stubEnv('SEO_TOOLS_ENABLED', '')
    vi.stubEnv('AHREFS_API_KEY', 'secret-key')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const insight = await lookupKeywordInsight('پرینتر اچ پی')
    expect(insight.source).toBe('mock')
    expect(insight.mode).toBe('stub')
    expect(insight.searchVolume).toBeTypeOf('number')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('پاسخ Ahrefs را می‌خواند و کلید را در URL نمی‌گذارد', async () => {
    vi.stubEnv('SEO_TOOLS_ENABLED', 'true')
    vi.stubEnv('AHREFS_API_KEY', 'secret-ahrefs-token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            keywords: [
              {
                keyword: 'پرینتر اچ پی',
                volume: 1800,
                difficulty: 41,
                parent_topic: 'پرینتر لیزری',
              },
            ],
          }),
      })
    )

    const insight = await ahrefsSeoToolProvider.lookupKeyword({ keyword: 'پرینتر اچ پی' })
    expect(insight.mode).toBe('live')
    expect(insight.source).toBe('ahrefs')
    expect(insight.searchVolume).toBe(1800)
    expect(insight.related).toContain('پرینتر لیزری')

    const fetchMock = vi.mocked(fetch)
    const url = String(fetchMock.mock.calls[0]?.[0])
    expect(url).toContain('keywords-explorer/overview')
    expect(url).not.toContain('secret-ahrefs-token')
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toMatchObject({ Authorization: 'Bearer secret-ahrefs-token' })
  })

  it('خطای Ahrefs را به stub برمی‌گرداند', async () => {
    vi.stubEnv('SEO_TOOLS_ENABLED', 'true')
    vi.stubEnv('AHREFS_API_KEY', 'secret-ahrefs-token')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const insight = await lookupKeywordInsight('پرینتر')
    expect(insight.source).toBe('mock')
    expect(insight.mode).toBe('stub')
  })

  it('CSV سمرش را می‌خواند و کلید را در خطا لو نمی‌دهد', async () => {
    vi.stubEnv('SEMRUSH_API_KEY', 'semrush-secret-key-xyz')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'ERROR 43 :: AUTHORIZATION FAILED',
      })
    )
    await expect(semrushSeoToolProvider.lookupKeyword({ keyword: 'printer' })).rejects.toThrow(
      /SEMrush/
    )
    await expect(semrushSeoToolProvider.lookupKeyword({ keyword: 'printer' })).rejects.not.toThrow(
      /semrush-secret-key-xyz/
    )
  })
})

describe('parseSemrushCsv', () => {
  it('حجم را از CSV می‌خواند', () => {
    expect(parseSemrushCsv('Keyword;Search Volume\nprinter;4400')).toEqual({
      phrase: 'printer',
      volume: 4400,
    })
  })
})
