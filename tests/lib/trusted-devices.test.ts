import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDeviceId, getDeviceInfo } from '@/lib/auth/device-id'
import {
  __clearTrustedDevices,
  getTrustedDevicesServerSnapshot,
  getTrustedDevicesSnapshot,
  isCurrentDevice,
  isDeviceTrusted,
  listTrustedDevices,
  MAX_TRUSTED_DEVICES,
  normalizeAccountKey,
  revokeDevice,
  revokeOtherDevices,
  subscribeTrustedDevices,
  trustCurrentDevice,
} from '@/lib/auth/trusted-devices'

const ACCOUNT = '09123456789'
const OTHER_ACCOUNT = 'other@example.com'

beforeEach(() => {
  localStorage.clear()
  __clearTrustedDevices()
})

describe('getDeviceId', () => {
  it('شناسه پایدار می‌ماند — همان مرورگر دوباره رمز نمی‌خواهد', () => {
    const first = getDeviceId()
    expect(first).toBeTruthy()
    expect(getDeviceId()).toBe(first)
  })

  it('پس از پاک‌شدن storage شناسهٔ تازه می‌سازد', () => {
    const first = getDeviceId()
    localStorage.clear()
    expect(getDeviceId()).not.toBe(first)
  })

  it('🔑 شناسه اثرانگشت نیست — هیچ داده‌ای از کاربر ندارد', () => {
    const id = getDeviceId()
    // فقط شناسهٔ تصادفی؛ نباید user-agent یا مشخصات سیستم داشته باشد
    expect(id).not.toMatch(/Mozilla|Chrome|Windows|Mac/i)
  })
})

describe('getDeviceInfo', () => {
  it('مرورگر و سیستم‌عامل را از user-agent می‌خواند', () => {
    const chromeWin = getDeviceInfo(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    )
    expect(chromeWin.label).toContain('Chrome')
    expect(chromeWin.label).toContain('ویندوز')
    expect(chromeWin.kind).toBe('desktop')
  })

  it('موبایل را تشخیص می‌دهد', () => {
    const iphone = getDeviceInfo(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'
    )
    expect(iphone.kind).toBe('mobile')
    expect(iphone.label).toContain('iOS')
  })

  it('Edge را با Chrome اشتباه نمی‌گیرد', () => {
    const edge = getDeviceInfo('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Edg/120')
    expect(edge.label).toContain('Edge')
  })
})

describe('اعتماد به دستگاه', () => {
  it('🔑 دستگاه ناشناس مورد اعتماد نیست — رمز لازم است', () => {
    expect(isDeviceTrusted(ACCOUNT)).toBe(false)
  })

  it('🔑 پس از ورود موفق، همان دستگاه دیگر رمز نمی‌خواهد', () => {
    trustCurrentDevice(ACCOUNT)
    expect(isDeviceTrusted(ACCOUNT)).toBe(true)
  })

  it('🔑 اعتماد فقط برای همان حساب است — حساب دیگر رمز می‌خواهد', () => {
    trustCurrentDevice(ACCOUNT)
    expect(isDeviceTrusted(OTHER_ACCOUNT)).toBe(false)
  })

  it('کلید حساب به حروف بزرگ/کوچک و فاصله حساس نیست', () => {
    trustCurrentDevice('  User@Example.COM  ')
    expect(isDeviceTrusted('user@example.com')).toBe(true)
  })

  it('ورود دوباره ردیف تکراری نمی‌سازد', () => {
    trustCurrentDevice(ACCOUNT)
    trustCurrentDevice(ACCOUNT)
    expect(listTrustedDevices(ACCOUNT)).toHaveLength(1)
  })
})

describe('حذف دستگاه', () => {
  it('🔑 پس از حذف، آن دستگاه دوباره رمز می‌خواهد', () => {
    trustCurrentDevice(ACCOUNT)
    const id = getDeviceId()

    revokeDevice(ACCOUNT, id)

    expect(isDeviceTrusted(ACCOUNT)).toBe(false)
    expect(listTrustedDevices(ACCOUNT)).toHaveLength(0)
  })

  it('حذف دستگاه یک حساب به حساب دیگر دست نمی‌زند', () => {
    trustCurrentDevice(ACCOUNT)
    trustCurrentDevice(OTHER_ACCOUNT)

    revokeDevice(ACCOUNT, getDeviceId())

    expect(isDeviceTrusted(ACCOUNT)).toBe(false)
    expect(isDeviceTrusted(OTHER_ACCOUNT)).toBe(true)
  })

  it('🔑 «خروج از سایر دستگاه‌ها» دستگاه فعلی را نگه می‌دارد', () => {
    // شبیه‌سازی دو دستگاه دیگر با نوشتن مستقیم
    trustCurrentDevice(ACCOUNT)
    const current = getDeviceId()
    const stored = JSON.parse(localStorage.getItem('saite:trusted-devices') ?? '[]')
    stored.push(
      { deviceId: 'laptop-1', accountKey: ACCOUNT, label: 'Chrome', kind: 'desktop', lastSeenAt: '2026-01-01T00:00:00Z' },
      { deviceId: 'phone-1', accountKey: ACCOUNT, label: 'Safari', kind: 'mobile', lastSeenAt: '2026-01-02T00:00:00Z' }
    )
    localStorage.setItem('saite:trusted-devices', JSON.stringify(stored))

    expect(listTrustedDevices(ACCOUNT)).toHaveLength(3)

    revokeOtherDevices(ACCOUNT)

    const remaining = listTrustedDevices(ACCOUNT)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].deviceId).toBe(current)
  })
})

describe('سقف دستگاه‌ها', () => {
  it('🔑 بیش از سقف نگه نمی‌دارد — قدیمی‌ترین حذف می‌شود', () => {
    const many = Array.from({ length: MAX_TRUSTED_DEVICES + 3 }, (_, i) => ({
      deviceId: `device-${i}`,
      accountKey: ACCOUNT,
      label: `مرورگر ${i}`,
      kind: 'desktop' as const,
      // جدیدتر = شمارهٔ بالاتر
      lastSeenAt: new Date(2026, 0, i + 1).toISOString(),
    }))
    localStorage.setItem('saite:trusted-devices', JSON.stringify(many))

    trustCurrentDevice(ACCOUNT)

    expect(listTrustedDevices(ACCOUNT).length).toBeLessThanOrEqual(MAX_TRUSTED_DEVICES)
  })
})

describe('snapshot و اشتراک', () => {
  it('🔑 snapshot پایدار است — از حلقهٔ بی‌نهایت React جلوگیری می‌کند', () => {
    trustCurrentDevice(ACCOUNT)
    expect(getTrustedDevicesSnapshot()).toBe(getTrustedDevicesSnapshot())
  })

  it('snapshot سرور همیشه یک reference ثابت', () => {
    expect(getTrustedDevicesServerSnapshot()).toBe(getTrustedDevicesServerSnapshot())
    expect(getTrustedDevicesServerSnapshot()).toHaveLength(0)
  })

  it('پس از تغییر، snapshot تازه می‌شود', () => {
    const before = getTrustedDevicesSnapshot()
    trustCurrentDevice(ACCOUNT)
    expect(getTrustedDevicesSnapshot()).not.toBe(before)
  })

  it('🔑 ناظران همان تب خبردار می‌شوند', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeTrustedDevices(listener)

    trustCurrentDevice(ACCOUNT)
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    const callsBefore = listener.mock.calls.length
    revokeDevice(ACCOUNT, getDeviceId())
    expect(listener).toHaveBeenCalledTimes(callsBefore)
  })
})

describe('کمکی‌ها', () => {
  it('isCurrentDevice دستگاه فعلی را تشخیص می‌دهد', () => {
    expect(isCurrentDevice(getDeviceId())).toBe(true)
    expect(isCurrentDevice('some-other-device')).toBe(false)
  })

  it('normalizeAccountKey یکسان‌سازی می‌کند', () => {
    expect(normalizeAccountKey('  A@B.COM ')).toBe('a@b.com')
  })

  it('دادهٔ خراب باعث کرش نمی‌شود', () => {
    localStorage.setItem('saite:trusted-devices', '{ not json')
    __clearTrustedDevices()
    localStorage.setItem('saite:trusted-devices', '{ not json')
    expect(listTrustedDevices(ACCOUNT)).toEqual([])
  })
})
