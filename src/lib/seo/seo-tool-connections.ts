import 'server-only'

/**
 * وضعیت اتصالات ابزار سئوی پولی — فقط boolean / شناسهٔ فعال.
 * مقدار کلید هرگز برنمی‌گردد.
 */

export type SeoToolActiveProvider = 'ahrefs' | 'semrush' | 'mock'

export type SeoToolConnectionStatus = {
  enabled: boolean
  ahrefsConfigured: boolean
  semrushConfigured: boolean
  activeProvider: SeoToolActiveProvider
}

export function isSeoToolsEnabled(): boolean {
  return process.env.SEO_TOOLS_ENABLED === 'true'
}

export function isAhrefsConfigured(): boolean {
  return Boolean(process.env.AHREFS_API_KEY?.trim())
}

export function isSemrushConfigured(): boolean {
  return Boolean(process.env.SEMRUSH_API_KEY?.trim())
}

export function getSeoToolCountry(): string {
  const raw = process.env.SEO_TOOLS_COUNTRY?.trim().toLowerCase() ?? 'ir'
  return /^[a-z]{2}$/.test(raw) ? raw : 'ir'
}

export function getSemrushDatabase(): string {
  const raw = process.env.SEMRUSH_DATABASE?.trim().toLowerCase() ?? 'us'
  return /^[a-z]{2}$/.test(raw) ? raw : 'us'
}

export function getActiveSeoToolProviderId(): SeoToolActiveProvider {
  if (!isSeoToolsEnabled()) return 'mock'
  if (isAhrefsConfigured()) return 'ahrefs'
  if (isSemrushConfigured()) return 'semrush'
  return 'mock'
}

export function getSeoToolConnectionStatus(): SeoToolConnectionStatus {
  return {
    enabled: isSeoToolsEnabled(),
    ahrefsConfigured: isAhrefsConfigured(),
    semrushConfigured: isSemrushConfigured(),
    activeProvider: getActiveSeoToolProviderId(),
  }
}
