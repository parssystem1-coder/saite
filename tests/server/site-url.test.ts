import { describe, it, expect, vi, afterEach } from 'vitest'

describe('getSiteUrl — آدرس متمرکز سایت (فاز ۵)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('در production بدون NEXT_PUBLIC_SITE_URL → throw (fail-fast)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    const { getSiteUrl } = await import('@/server/shared/site-url')
    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })

  it('خارج از production بدون مقدار → localhost', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    const { getSiteUrl } = await import('@/server/shared/site-url')
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('slash انتهایی حذف می‌شود', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://saite.example.com/')
    const { getSiteUrl } = await import('@/server/shared/site-url')
    expect(getSiteUrl()).toBe('https://saite.example.com')
  })
})
