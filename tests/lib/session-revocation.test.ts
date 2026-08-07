import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  __resetSessionVersionCache,
  createAdminSessionToken,
  getSessionVersion,
  verifyAdminSessionToken,
} from '@/lib/auth/server/session-token'

/**
 * ابطال گروهی نشست.
 *
 * ── سناریوی واقعی ─────────────────────────────────────────────
 * لپ‌تاپ مدیر دزدیده می‌شود. رمز را عوض می‌کند. تا پیش از این
 * تغییر، کوکی روی آن لپ‌تاپ **تا ۸ ساعت** هنوز کار می‌کرد و هیچ
 * راهی برای بستنش نبود.
 */

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  __resetSessionVersionCache()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  __resetSessionVersionCache()
})

describe('نسخهٔ نشست', () => {
  it('برای پیکربندی ثابت، مقدار ثابت می‌دهد', () => {
    const first = getSessionVersion()
    __resetSessionVersionCache()
    expect(getSessionVersion()).toBe(first)
  })

  it('🔑 با تغییر رمز عوض می‌شود', () => {
    process.env.ADMIN_PASSWORD = 'first-passphrase'
    const before = getSessionVersion()

    __resetSessionVersionCache()
    process.env.ADMIN_PASSWORD = 'second-passphrase'

    expect(getSessionVersion()).not.toBe(before)
  })

  it('🔑 با ADMIN_SESSION_VERSION دستی عوض می‌شود', () => {
    // راه ابطال بدون عوض کردن رمز
    const before = getSessionVersion()

    __resetSessionVersionCache()
    process.env.ADMIN_SESSION_VERSION = 'rotate-me'

    expect(getSessionVersion()).not.toBe(before)
  })

  it('رمز خام را لو نمی‌دهد', () => {
    process.env.ADMIN_PASSWORD = 'super-secret-passphrase'
    __resetSessionVersionCache()

    expect(getSessionVersion()).not.toContain('super-secret')
    expect(getSessionVersion().length).toBeLessThan(16)
  })
})

describe('اثر روی توکن', () => {
  it('توکن در همان پیکربندی معتبر می‌ماند', async () => {
    const token = await createAdminSessionToken('admin-1')
    expect(await verifyAdminSessionToken(token)).not.toBeNull()
  })

  it('🔑 پس از تغییر رمز، توکن قبلی رد می‌شود', async () => {
    process.env.ADMIN_PASSWORD = 'old-passphrase'
    __resetSessionVersionCache()

    const token = await createAdminSessionToken('admin-1')
    expect(await verifyAdminSessionToken(token)).not.toBeNull()

    // مدیر رمز را عوض می‌کند
    process.env.ADMIN_PASSWORD = 'new-passphrase'
    __resetSessionVersionCache()

    expect(await verifyAdminSessionToken(token)).toBeNull()
  })

  it('🔑 توکن بدون claim نسخه رد می‌شود', async () => {
    /*
      توکن‌های صادرشده پیش از این قابلیت `ver` ندارند. باید رد
      شوند، وگرنه ابطال قابل دور زدن است: کافی است مهاجم فیلد را
      حذف کند.
    */
    const legacyPayload = btoa(
      JSON.stringify({
        sub: 'admin-1',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const valid = await createAdminSessionToken('admin-1')
    const [, signature] = valid.split('.')

    expect(await verifyAdminSessionToken(`${legacyPayload}.${signature}`)).toBeNull()
  })
})
