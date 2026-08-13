import { describe, expect, it } from 'vitest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'

describe('robots native', () => {
  it('پنل ادمین و تسویه را disallow می‌کند و به sitemap اشاره دارد', () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rules?.disallow).toEqual(expect.arrayContaining(['/admin/', '/checkout/']))
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})

describe('sitemap native', () => {
  it('مسیر ادمین را ایندکس نمی‌کند و صفحات عمومی را دارد', async () => {
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)
    expect(urls.some((url) => url.includes('/admin'))).toBe(false)
    expect(urls.some((url) => url.endsWith('/privacy'))).toBe(true)
    expect(urls.some((url) => url.includes('/products/'))).toBe(true)
  })
})
