import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getActiveSeoToolProviderId,
  getSeoToolConnectionStatus,
} from '@/lib/seo/seo-tool-connections'

describe('seo tool connections status', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('بدون kill-switch همیشه stub است', () => {
    vi.stubEnv('SEO_TOOLS_ENABLED', 'false')
    vi.stubEnv('AHREFS_API_KEY', 'super-secret-ahrefs')
    const status = getSeoToolConnectionStatus()
    expect(status.enabled).toBe(false)
    expect(status.ahrefsConfigured).toBe(true)
    expect(status.activeProvider).toBe('mock')
    expect(JSON.stringify(status)).not.toContain('super-secret')
  })

  it('با کلید Ahrefs و kill-switch روشن، Ahrefs فعال است', () => {
    vi.stubEnv('SEO_TOOLS_ENABLED', 'true')
    vi.stubEnv('AHREFS_API_KEY', 'super-secret-ahrefs')
    vi.stubEnv('SEMRUSH_API_KEY', '')
    expect(getActiveSeoToolProviderId()).toBe('ahrefs')
  })

  it('بدون کلید به stub برمی‌گردد', () => {
    vi.stubEnv('SEO_TOOLS_ENABLED', 'true')
    vi.stubEnv('AHREFS_API_KEY', '')
    vi.stubEnv('SEMRUSH_API_KEY', '')
    expect(getActiveSeoToolProviderId()).toBe('mock')
  })
})
