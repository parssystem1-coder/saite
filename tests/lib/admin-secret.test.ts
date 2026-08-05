import { describe, expect, it } from 'vitest'
import {
  ADMIN_PASSWORD,
  ADMIN_PROFILE,
  ADMIN_USERNAME,
  checkAdminCredentials,
  IS_PASSWORD_HASHED,
  IS_TOTP_ENABLED,
  IS_USING_DEFAULT_CREDENTIALS,
} from '@/lib/auth/server/admin-secret'

/** کمک‌کننده: فقط بله/خیر می‌خواهیم */
async function matches(username: string, password: string): Promise<boolean> {
  return (await checkAdminCredentials(username, password)).ok
}

/**
 * تأیید اعتبارنامه — حالا فقط سمت سرور.
 *
 * این تست‌ها جای `tests/lib/admin-credentials.test.ts` قبلی را
 * گرفتند. تفاوت مهم: ماژول زیر آزمایش با `import 'server-only'`
 * علامت‌گذاری شده، پس اگر روزی از یک Client Component ایمپورت
 * شود، **بیلد می‌شکند** — نه اینکه بی‌صدا به باندل نشت کند.
 */

describe('تأیید اعتبارنامه', () => {
  it('اعتبارنامهٔ درست پذیرفته می‌شود', async () => {
    expect(await matches(ADMIN_USERNAME, ADMIN_PASSWORD)).toBe(true)
  })

  it('نام کاربری بدون حساسیت به حروف بزرگ و فاصله', async () => {
    expect(await matches(`  ${ADMIN_USERNAME.toUpperCase()}  `, ADMIN_PASSWORD)).toBe(true)
  })

  it('🔑 رمز به حروف بزرگ و کوچک حساس است', async () => {
    expect(await matches(ADMIN_USERNAME, ADMIN_PASSWORD.toUpperCase())).toBe(false)
  })

  it('رمز غلط رد می‌شود', async () => {
    expect(await matches(ADMIN_USERNAME, 'wrong-password')).toBe(false)
  })

  it('نام کاربری غلط رد می‌شود', async () => {
    expect(await matches('someone', ADMIN_PASSWORD)).toBe(false)
  })

  it('ورودی خالی رد می‌شود', async () => {
    expect(await matches('', '')).toBe(false)
  })

  it('رمز با فاصلهٔ اضافی رد می‌شود — trim نمی‌شود', async () => {
    // فاصله بخشی از رمز است؛ trim کردنش فضای حدس را کوچک می‌کند
    expect(await matches(ADMIN_USERNAME, ` ${ADMIN_PASSWORD} `)).toBe(false)
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

  it('در پیکربندی پیش‌فرض، رمز هش‌نشده است', () => {
    /*
      این تست وضعیت **توسعه** را ثبت می‌کند، نه توصیه.
      `npm run admin:check` همین را به‌عنوان مورد بحرانی
      گزارش می‌دهد.
    */
    expect(IS_PASSWORD_HASHED).toBe(false)
  })

  it('در پیکربندی پیش‌فرض، ورود دومرحله‌ای خاموش است', () => {
    expect(IS_TOTP_ENABLED).toBe(false)
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
