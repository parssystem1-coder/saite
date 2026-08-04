import { describe, expect, it } from 'vitest'
import {
  getBackendRecoveryOptions,
  getSelfServiceRecoverySteps,
} from '@/lib/auth/admin-recovery'
import { SITE } from '@/lib/constants'

describe('راهنمای بازیابی در فاز بدون بک‌اند', () => {
  it('🔑 مسیر عملی می‌دهد، نه بن‌بست', () => {
    const steps = getSelfServiceRecoverySteps()
    expect(steps.length).toBeGreaterThanOrEqual(3)
    // هر مرحله باید دستور یا مسیر مشخصی داشته باشد
    expect(steps.filter((s) => s.code).length).toBeGreaterThanOrEqual(2)
  })

  it('به فایل .env.local اشاره می‌کند', () => {
    const steps = getSelfServiceRecoverySteps()
    const joined = steps.map((s) => `${s.description} ${s.code ?? ''}`).join(' ')
    expect(joined).toContain('.env.local')
  })

  it('نحوهٔ تعیین رمز جدید را نشان می‌دهد', () => {
    const steps = getSelfServiceRecoverySteps()
    const codes = steps.map((s) => s.code ?? '').join('\n')
    expect(codes).toContain('ADMIN_PASSWORD')
  })
})

describe('گزینه‌های بازیابی پس از اتصال بک‌اند', () => {
  it('چند راه ارائه می‌دهد', () => {
    expect(getBackendRecoveryOptions().length).toBeGreaterThanOrEqual(3)
  })

  it('🔑 هیچ گزینه‌ای بازیابی خودکار ایمیلی پیشنهاد نمی‌دهد', () => {
    /*
      قاعدهٔ امنیتی: بازیابی ایمیلی صندوق ایمیل مدیر را به کلید
      کل فروشگاه تبدیل می‌کند. اگر روزی کسی این را اضافه کرد،
      این تست باید هشدار بدهد.
    */
    for (const option of getBackendRecoveryOptions()) {
      expect(option.action?.href ?? '').not.toMatch(/^mailto:/)
      expect(option.action?.href ?? '').not.toContain('forgot-password')
    }
  })

  it('🔑 راهی مستقل از ایمیل دارد — برای مدیر تنها', () => {
    // اگر شما تنها مدیر باشید، «از مدیر دیگر کمک بگیر» کافی نیست
    const cliOption = getBackendRecoveryOptions().find((o) => o.icon === 'terminal')
    expect(cliOption).toBeDefined()
    expect(cliOption?.code).toBeTruthy()
  })

  it('راه تماس با پشتیبانی شمارهٔ واقعی سایت را می‌دهد', () => {
    const phoneOption = getBackendRecoveryOptions().find((o) => o.icon === 'phone')
    expect(phoneOption?.action?.href).toBe(`tel:${SITE.phoneLtr}`)
  })

  it('هر گزینه عنوان و توضیح معنادار دارد', () => {
    for (const option of [...getBackendRecoveryOptions(), ...getSelfServiceRecoverySteps()]) {
      expect(option.title.trim().length).toBeGreaterThan(5)
      expect(option.description.trim().length).toBeGreaterThan(20)
    }
  })
})
