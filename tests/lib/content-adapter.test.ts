import { beforeEach, describe, expect, it } from 'vitest'
import {
  createMockContentAdapter,
  isValidSlug,
} from '@/lib/content/mock-adapter'

describe('isValidSlug', () => {
  it('slug صحیح را می‌پذیرد', () => {
    expect(isValidSlug('how-to-print')).toBe(true)
    expect(isValidSlug('a')).toBe(true)
    expect(isValidSlug('abc-123-xyz')).toBe(true)
  })

  it('slug نامعتبر را رد می‌کند', () => {
    expect(isValidSlug('')).toBe(false)
    expect(isValidSlug('-abc')).toBe(false)
    expect(isValidSlug('abc-')).toBe(false)
    expect(isValidSlug('foo--bar')).toBe(false)
    expect(isValidSlug('ABC')).toBe(false)
    expect(isValidSlug('فارسی')).toBe(false)
    expect(isValidSlug('has space')).toBe(false)
  })
})

describe('content adapter', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('صفحهٔ جدید ذخیره و پرچم فوتر تغییر می‌کند', () => {
    const adapter = createMockContentAdapter()
    const page = {
      id: 'p-x',
      title: 'X',
      slug: 'x',
      status: 'draft' as const,
      showInFooter: false,
      showInHeader: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const after = adapter.savePage(page)
    expect(after.find((p) => p.id === 'p-x')?.showInFooter).toBe(false)

    const flipped = adapter.savePage({ ...page, showInFooter: true })
    expect(flipped.find((p) => p.id === 'p-x')?.showInFooter).toBe(true)
  })
})
