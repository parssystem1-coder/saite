import { describe, expect, it } from 'vitest'
import {
  ADMIN_PASSWORD,
  ADMIN_PROFILE,
  ADMIN_USERNAME,
  IS_USING_DEFAULT_CREDENTIALS,
  matchesAdminCredentials,
} from '@/lib/auth/server/admin-secret'

/**
 * تأیید اعتبارنامه — حالا فقط سمت سرور.
 *
 * این تست‌ها جای `tests/lib/admin-credentials.test.ts` قبلی را
 * گرفتند. تفاوت مهم: ماژول زیر آزمایش با `import 'server-only'`
 * علامت‌گذاری شده، پس اگر روزی از یک Client Component ایمپورت
 * شود، **بیلد می‌شکند** — نه اینکه بی‌صدا به باندل نشت کند.
 */

describe('تأیید اعتبارنامه', () => {
  it('اعتبارنامهٔ درست پذیرفته می‌شود', () => {
    expect(matchesAdminCredentials(ADMIN_USERNAME, ADMIN_PASSWORD)).toBe(true)
  })

  it('نام کاربری بدون حساسیت به حروف بزرگ و فاصله', () => {
    expect(
      matchesAdminCredentials(`  ${ADMIN_USERNAME.toUpperCase()}  `, ADMIN_PASSWORD)
    ).toBe(true)
  })

  it('🔑 رمز به حروف بزرگ و کوچک حساس است', () => {
    expect(matchesAdminCredentials(ADMIN_USERNAME, ADMIN_PASSWORD.toUpperCase())).toBe(
      false
    )
  })

  it('رمز غلط رد می‌شود', () => {
    expect(matchesAdminCredentials(ADMIN_USERNAME, 'wrong-password')).toBe(false)
  })

  it('نام کاربری غلط رد می‌شود', () => {
    expect(matchesAdminCredentials('someone', ADMIN_PASSWORD)).toBe(false)
  })

  it('ورودی خالی رد می‌شود', () => {
    expect(matchesAdminCredentials('', '')).toBe(false)
  })

  it('رمز با فاصلهٔ اضافی رد می‌شود — trim نمی‌شود', () => {
    // فاصله بخشی از رمز است؛ trim کردنش فضای حدس را کوچک می‌کند
    expect(matchesAdminCredentials(ADMIN_USERNAME, ` ${ADMIN_PASSWORD} `)).toBe(false)
  })
})

describe('پیکربندی', () => {
  it('مقدار پیش‌فرض وجود دارد', () => {
    expect(ADMIN_USERNAME).toBeTruthy()
    expect(ADMIN_PASSWORD).toBeTruthy()
  })

  it('پرچم استفاده از مقدار پیش‌فرض درست است', () => {
    // در تست، متغیر محیطی تنظیم نشده پس باید true باشد
    expect(IS_USING_DEFAULT_CREDENTIALS).toBe(true)
  })

  it('رمز نمایشی به‌وضوح نمایشی است — با رمز واقعی اشتباه نشود', () => {
    expect(ADMIN_PASSWORD).toContain('demo')
  })

  it('🔑 پروفایل مدیر هیچ دادهٔ حساسی ندارد', () => {
    /*
      این پروفایل به کلاینت فرستاده می‌شود. اگر روزی کسی رمز یا
      توکن را به آن اضافه کند، دوباره همان نشت قبلی رخ می‌دهد.
    */
    const serialized = JSON.stringify(ADMIN_PROFILE)
    expect(serialized).not.toContain(ADMIN_PASSWORD)
    expect(Object.keys(ADMIN_PROFILE).sort()).toEqual(['email', 'id', 'name', 'role'])
    expect(ADMIN_PROFILE.role).toBe('admin')
  })
})
