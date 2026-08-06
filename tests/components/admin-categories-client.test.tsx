import { describe, expect, it } from 'vitest'
import { AdminCategoriesClient } from '@/components/admin/admin-categories-client'
import { render, screen } from '../utils/render'

describe('AdminCategoriesClient', () => {
  it('تب‌های دسته‌بندی و برند را همراه با مقادیر پیش‌فرض کاتالوگ نمایش می‌دهد', () => {
    render(<AdminCategoriesClient />)

    // بررسی حضور تب‌ها
    expect(
      screen.getByRole('button', { name: /دسته‌بندی‌های محصولات/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /برندها/i })).toBeInTheDocument()

    // بررسی دسته‌بندی پیش‌فرض
    expect(screen.getByText('پرینتر')).toBeInTheDocument()
    expect(screen.getByText('اسکنر')).toBeInTheDocument()
  })
})
