import { describe, expect, it } from 'vitest'
import {
  ADMIN_NAV,
  findAdminNavByHref,
  flattenAdminNav,
  isAdminGroupActive,
  isAdminLinkActive,
} from '@/lib/admin/nav'

describe('admin nav', () => {
  it('has core root groups', () => {
    const ids = ADMIN_NAV.map((g) => g.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'dashboard',
        'store',
        'finance',
        'reports',
        'marketing',
        'communications',
        'content',
        'pages',
        'system',
      ])
    )
  })

  it('flattens unique hrefs', () => {
    const leaves = flattenAdminNav()
    const hrefs = leaves.map((l) => l.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(hrefs).toContain('/admin/finance/invoices')
    expect(hrefs).toContain('/admin/content/article-categories')
    expect(hrefs).toContain('/admin/pages/new')
    expect(hrefs).toContain('/admin/settings/seo')
  })

  it('finds leaf by href', () => {
    const item = findAdminNavByHref('/admin/marketing/coupons')
    expect(item?.label).toBe('کد تخفیف')
  })

  it('detects active group and link', () => {
    expect(isAdminLinkActive('/admin', '/admin')).toBe(true)
    expect(isAdminLinkActive('/admin', '/admin/orders')).toBe(false)
    expect(isAdminLinkActive('/admin/orders', '/admin/orders')).toBe(true)

    const store = ADMIN_NAV.find((g) => g.id === 'store')!
    expect(isAdminGroupActive(store, '/admin/products')).toBe(true)
    expect(isAdminGroupActive(store, '/admin/finance/wallet')).toBe(false)
  })

  it('content includes articles and categories', () => {
    const content = ADMIN_NAV.find((g) => g.id === 'content')!
    const labels = (content.children ?? []).map((c) => c.label)
    expect(labels).toContain('مقالات')
    expect(labels).toContain('دسته‌بندی مقالات')
  })
})
