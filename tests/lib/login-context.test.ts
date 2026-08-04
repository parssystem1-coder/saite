import { describe, expect, it } from 'vitest'
import { getLoginContextMessage } from '@/lib/auth/login-context'

describe('getLoginContextMessage', () => {
  it('🔑 برای تسویه‌حساب پیام اطمینان‌بخش می‌دهد', () => {
    const message = getLoginContextMessage('/checkout')
    expect(message).not.toBeNull()
    expect(message?.title).toContain('تکمیل خرید')
    // کاربر باید مطمئن شود سبدش نپریده — دلیل اصلی رها کردن خرید
    expect(message?.description).toContain('سبد خرید شما محفوظ است')
  })

  it('برای پنل کاربری و علاقه‌مندی پیام مخصوص دارد', () => {
    expect(getLoginContextMessage('/dashboard')?.title).toContain('پنل کاربری')
    expect(getLoginContextMessage('/wishlist')?.title).toContain('علاقه‌مندی')
  })

  it('زیرمسیرها هم پوشش داده می‌شوند', () => {
    expect(getLoginContextMessage('/checkout/success')).not.toBeNull()
  })

  it('مسیر ناشناخته پیام ندارد — ورود عادی', () => {
    expect(getLoginContextMessage('/products')).toBeNull()
    expect(getLoginContextMessage(null)).toBeNull()
    expect(getLoginContextMessage('')).toBeNull()
  })

  it('🔑 مسیر ناامن هرگز پیام نمی‌سازد', () => {
    // جلوگیری از استفاده از پیام به‌عنوان بردار فیشینگ
    expect(getLoginContextMessage('https://evil.example/checkout')).toBeNull()
    expect(getLoginContextMessage('//evil.example/checkout')).toBeNull()
    expect(getLoginContextMessage('javascript:alert(1)')).toBeNull()
  })

  it('🔑 مسیر فریبنده که با /checkout شروع می‌شود اما نیست', () => {
    expect(getLoginContextMessage('/checkout-fake')).toBeNull()
  })
})
