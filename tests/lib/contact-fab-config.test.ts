import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTACT_FAB_CONFIG,
  getEnabledContactFabChannels,
} from '@/lib/contact-fab-config'
import { buildInstagramUrl } from '@/lib/constants'

describe('contact-fab-config', () => {
  it('کانال‌های فعال را به‌ترتیب order برمی‌گرداند', () => {
    const channels = getEnabledContactFabChannels()
    expect(channels.length).toBeGreaterThanOrEqual(3)
    const orders = channels.map((c) => c.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(channels[0].id).toBe('whatsapp')
  })

  it('با enabled=false لیست خالی است', () => {
    const channels = getEnabledContactFabChannels({
      ...DEFAULT_CONTACT_FAB_CONFIG,
      enabled: false,
    })
    expect(channels).toHaveLength(0)
  })

  it('کانال غیرفعال را حذف می‌کند', () => {
    const channels = getEnabledContactFabChannels({
      ...DEFAULT_CONTACT_FAB_CONFIG,
      channels: DEFAULT_CONTACT_FAB_CONFIG.channels.map((c) =>
        c.id === 'instagram' ? { ...c, enabled: false } : c
      ),
    })
    expect(channels.every((c) => c.id !== 'instagram')).toBe(true)
  })
})

describe('buildInstagramUrl', () => {
  it('یوزرنیم را به لینک پروفایل تبدیل می‌کند', () => {
    expect(buildInstagramUrl('saite.office')).toBe('https://instagram.com/saite.office')
    expect(buildInstagramUrl('@saite.office')).toBe('https://instagram.com/saite.office')
  })

  it('URL کامل را دست‌نخورده برمی‌گرداند', () => {
    expect(buildInstagramUrl('https://instagram.com/foo')).toBe('https://instagram.com/foo')
  })
})
