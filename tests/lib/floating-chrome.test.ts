import { describe, expect, it } from 'vitest'
import {
  FLOATING_CHROME_HIDDEN_PREFIXES,
  isFloatingChromeHidden,
} from '@/lib/layout/floating-chrome'

describe('isFloatingChromeHidden', () => {
  it('در صفحات فروشگاه المان شناور نمایش داده می‌شود', () => {
    expect(isFloatingChromeHidden('/')).toBe(false)
    expect(isFloatingChromeHidden('/products')).toBe(false)
    expect(isFloatingChromeHidden('/products/canon-i-sensys-lbp-2900')).toBe(false)
    expect(isFloatingChromeHidden('/cart')).toBe(false)
  })

  it('در ریشهٔ پنل مدیریت پنهان می‌شود', () => {
    expect(isFloatingChromeHidden('/admin')).toBe(true)
  })

  it('در زیرمسیرهای پنل مدیریت هم پنهان می‌شود', () => {
    expect(isFloatingChromeHidden('/admin/orders')).toBe(true)
    expect(isFloatingChromeHidden('/admin/finance/invoices')).toBe(true)
  })

  it('مسیری که فقط با admin شروع می‌شود اما ادمین نیست، پنهان نمی‌شود', () => {
    // جلوگیری از باگ startsWith خام
    expect(isFloatingChromeHidden('/administration')).toBe(false)
    expect(isFloatingChromeHidden('/admin-guide')).toBe(false)
  })

  it('با pathname خالی امن است', () => {
    expect(isFloatingChromeHidden(null)).toBe(false)
    expect(isFloatingChromeHidden(undefined)).toBe(false)
  })

  it('فهرست پیشوندها شامل /admin است', () => {
    expect(FLOATING_CHROME_HIDDEN_PREFIXES).toContain('/admin')
  })
})
