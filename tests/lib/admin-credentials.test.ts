import { describe, expect, it } from 'vitest'
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_USERNAME,
  INVALID_CREDENTIALS_MESSAGE,
  LOCKOUT_DURATION_MS,
  MAX_LOGIN_ATTEMPTS,
  verifyAdminCredentials,
} from '@/lib/auth/admin-credentials'

describe('verifyAdminCredentials', () => {
  it('اعتبارنامهٔ درست را می‌پذیرد و نقش admin می‌دهد', async () => {
    const result = await verifyAdminCredentials({
      username: DEMO_ADMIN_USERNAME,
      password: DEMO_ADMIN_PASSWORD,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user.role).toBe('admin')
      expect(result.user.name).toBeTruthy()
    }
  })

  it('نام کاربری بدون حساسیت به حروف بزرگ و فاصله', async () => {
    const result = await verifyAdminCredentials({
      username: `  ${DEMO_ADMIN_USERNAME.toUpperCase()}  `,
      password: DEMO_ADMIN_PASSWORD,
    })
    expect(result.ok).toBe(true)
  })

  it('🔑 رمز به حروف بزرگ و کوچک حساس است', async () => {
    const result = await verifyAdminCredentials({
      username: DEMO_ADMIN_USERNAME,
      password: DEMO_ADMIN_PASSWORD.toUpperCase(),
    })
    expect(result.ok).toBe(false)
  })

  it('رمز غلط رد می‌شود', async () => {
    const result = await verifyAdminCredentials({
      username: DEMO_ADMIN_USERNAME,
      password: 'wrong-password',
    })
    expect(result.ok).toBe(false)
  })

  it('نام کاربری غلط رد می‌شود', async () => {
    const result = await verifyAdminCredentials({
      username: 'someone',
      password: DEMO_ADMIN_PASSWORD,
    })
    expect(result.ok).toBe(false)
  })

  it('🔑 پیام خطا یکسان است — از شمارش نام کاربری جلوگیری می‌کند', async () => {
    // اگر پیام‌ها فرق کنند، مهاجم می‌فهمد کدام نام کاربری وجود دارد
    const wrongUser = await verifyAdminCredentials({
      username: 'ghost',
      password: 'anything',
    })
    const wrongPass = await verifyAdminCredentials({
      username: DEMO_ADMIN_USERNAME,
      password: 'anything',
    })

    expect(wrongUser.ok).toBe(false)
    expect(wrongPass.ok).toBe(false)
    if (!wrongUser.ok && !wrongPass.ok) {
      expect(wrongUser.message).toBe(wrongPass.message)
      expect(wrongUser.message).toBe(INVALID_CREDENTIALS_MESSAGE)
    }
  })

  it('🔑 پیام خطا نام کاربری معتبر را لو نمی‌دهد', async () => {
    const result = await verifyAdminCredentials({
      username: DEMO_ADMIN_USERNAME,
      password: 'x',
    })
    if (!result.ok) {
      expect(result.message).not.toContain(DEMO_ADMIN_USERNAME)
      expect(result.message.toLowerCase()).not.toContain('username')
      expect(result.message).not.toContain('رمز اشتباه')
    }
  })

  it('ورودی خالی رد می‌شود', async () => {
    const result = await verifyAdminCredentials({ username: '', password: '' })
    expect(result.ok).toBe(false)
  })
})

describe('پیکربندی امنیتی', () => {
  it('سقف تلاش و مدت قفل معقول‌اند', () => {
    expect(MAX_LOGIN_ATTEMPTS).toBeGreaterThanOrEqual(3)
    expect(MAX_LOGIN_ATTEMPTS).toBeLessThanOrEqual(10)
    expect(LOCKOUT_DURATION_MS).toBeGreaterThanOrEqual(30_000)
  })

  it('رمز نمایشی به‌وضوح نمایشی است — با رمز واقعی اشتباه نشود', () => {
    expect(DEMO_ADMIN_PASSWORD).toContain('demo')
  })
})
