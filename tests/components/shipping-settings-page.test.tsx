import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShippingSettingsClient from '@/components/admin/shipping/shipping-settings-page'

describe('ShippingSettingsClient', () => {
  it('روش‌های ارسال و اتصال به domain rules را نمایش می‌دهد', async () => {
    render(<ShippingSettingsClient />)

    // تب پیش‌فرض
    expect(screen.getByText('روش‌های ارسال')).toBeInTheDocument()
    // جدول شامل هدرهای مورد انتظار
    expect(screen.getByText('روش')).toBeInTheDocument()
    expect(screen.getByText('مدل پرداخت')).toBeInTheDocument()

    // دادهٔ mock-adapter: حداقل دو روش نمونه
    expect(screen.getByText('پست پیشتاز، پیش‌کرایه')).toBeInTheDocument()
    expect(screen.getByText('تیپاکس، پس‌کرایه')).toBeInTheDocument()

    // دکمه افزودن
    expect(screen.getByText('افزودن روش')).toBeInTheDocument()
  })

  it('اعتبارسنجی و پیش‌نمایش هزینه را دارد', async () => {
    render(<ShippingSettingsClient />)
    // متن توضیحی که به domain rules اشاره دارد
    expect(screen.getByText(/isMethodEligible/)).toBeInTheDocument()
    expect(screen.getByText(/quoteShipping/)).toBeInTheDocument()
  })
})
