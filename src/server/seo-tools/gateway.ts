import 'server-only'
import { ValidationError } from '@/server/shared/errors'
import { logger } from '@/server/shared/logger'
import { cacheAside } from '@/server/shared/cache'
import {
  getActiveSeoToolProviderId,
  getSeoToolCountry,
} from '@/lib/seo/seo-tool-connections'
import {
  normalizeSeoKeyword,
  SEO_TOOL_CACHE_TTL_SECONDS,
  type KeywordInsight,
  type SeoToolProvider,
} from '@/lib/seo/seo-tool-contract'
import { mockSeoToolProvider } from './providers/mock'
import { ahrefsSeoToolProvider } from './providers/ahrefs'
import { semrushSeoToolProvider } from './providers/semrush'

export { mockSeoToolProvider }

function resolveLiveProvider(): SeoToolProvider | null {
  const active = getActiveSeoToolProviderId()
  if (active === 'ahrefs') return ahrefsSeoToolProvider
  if (active === 'semrush') return semrushSeoToolProvider
  return null
}

/**
 * جستجوی کلمهٔ کلیدی.
 * kill-switch یا نبود کلید → stub.
 * خطای شبکه/پارس → stub. سایت بدون حساب کار می‌کند.
 */
export async function lookupKeywordInsight(rawKeyword: string): Promise<KeywordInsight> {
  const keyword = normalizeSeoKeyword(rawKeyword)
  if (!keyword) {
    throw new ValidationError({ keyword: 'کلمهٔ کلیدی خالی است' }, 'کلمهٔ کلیدی را وارد کنید.')
  }

  const live = resolveLiveProvider()
  if (!live) {
    return mockSeoToolProvider.lookupKeyword({ keyword })
  }

  try {
    return await cacheAside(
      `${live.id}:${getSeoToolCountry()}:${keyword}`,
      () => live.lookupKeyword({ keyword }),
      { ttl: SEO_TOOL_CACHE_TTL_SECONDS, prefix: 'seo-tools' }
    )
  } catch (err) {
    logger.warn({ err, provider: live.id }, '[SeoTools] live lookup failed; using stub')
    return mockSeoToolProvider.lookupKeyword({ keyword })
  }
}
