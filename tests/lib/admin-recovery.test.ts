import { describe, expect, it } from 'vitest'
import { getAdminRecoveryOptions } from '@/lib/auth/admin-recovery'
import { SITE } from '@/lib/constants'

describe('getAdminRecoveryOptions', () => {
  it('چند راه بازیابی ارائه می‌دهد', () => {
    const options = getAdminRecoveryOptions()
    expect(options.length).toBeGreaterThanOrEqual(2)
  })

  it('🔑 هیچ گزینه‌ای ایمیل خودکار پیشنهاد نمی‌دهد', () => {
    /*
      قاعدهٔ امنیتی: بازیابی ایمیلی صندوق ایمیل مدیر را به کلید
      کل فروشگاه تبدیل می‌کند. اگر روزی کسی این را اضافه کرد،
      این تست باید هشدار بدهد.
    */
    const options = getAdminRecoveryOptions()
    for (const option of options) {
      expect(option.action?.href ?? '').not.toMatch(/^mailto:/)
      expect(option.action?.href ?? '').not.toContain('forgot-password')
    }
  })

  it('راه تماس با پشتیبانی شمارهٔ واقعی سایت را می‌دهد', () => {
    const phoneOption = getAdminRecoveryOptions().find((o) => o.icon === 'phone')
    expect(phoneOption?.action?.href).toBe(`tel:${SITE.phoneLtr}`)
  })

  it('گزینهٔ «مدیر دیگر» به تنظیمات اشاره می‌کند', () => {
    const usersOption = getAdminRecoveryOptions().find((o) => o.icon === 'users')
    expect(usersOption?.description).toContain('تنظیمات')
  })

  it('دلیل نبود بازیابی خودکار برای کاربر توضیح داده می‌شود', () => {
    const shieldOption = getAdminRecoveryOptions().find((o) => o.icon === 'shield')
    expect(shieldOption).toBeDefined()
    expect(shieldOption?.description.length).toBeGreaterThan(30)
  })

  it('هر گزینه عنوان و توضیح معنادار دارد', () => {
    for (const option of getAdminRecoveryOptions()) {
      expect(option.title.trim().length).toBeGreaterThan(5)
      expect(option.description.trim().length).toBeGreaterThan(20)
    }
  })
})
