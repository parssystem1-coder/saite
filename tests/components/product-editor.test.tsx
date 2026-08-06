import { describe, expect, it } from 'vitest'
import ProductEditor from '@/components/admin/products/ProductEditor'
import { render, screen } from '../utils/render'

describe('ProductEditor', () => {
  it('هدر و تب‌های اصلی ویرایشگر محصول را رندر می‌کند', () => {
    render(<ProductEditor />)

    expect(screen.getByText('Saite Admin')).toBeInTheDocument()
    expect(screen.getByText('افزودن محصول جدید')).toBeInTheDocument()

    // بررسی تب‌ها
    expect(screen.getByRole('tab', { name: /پایه/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /قیمت و موجودی/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /مشخصات فنی/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /رسانه/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /محتوا/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /سئو و اسکیما/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /خدمات و ارتباطات/i })).toBeInTheDocument()
  })
})
