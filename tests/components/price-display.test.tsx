import { describe, expect, it } from 'vitest'
import { PriceDisplay } from '@/components/ui/price-display'
import { renderWithProviders, screen } from '../utils/render'

describe('PriceDisplay', () => {
  it('قیمت ثابت را با واحد تومان نشان می‌دهد', () => {
    renderWithProviders(<PriceDisplay priceType="fixed" price={4_850_000} />)
    expect(screen.getByText('تومان')).toBeInTheDocument()
    // ارقام فارسی از Intl
    expect(screen.getByText(/۴.?۸۵۰.?۰۰۰|4850000/)).toBeInTheDocument()
  })

  it('حالت quote_only را به‌صورت «استعلام قیمت» نشان می‌دهد', () => {
    renderWithProviders(<PriceDisplay priceType="quote_only" />)
    expect(screen.getByText('استعلام قیمت')).toBeInTheDocument()
    expect(screen.getByText('برای قیمت تماس بگیرید')).toBeInTheDocument()
  })

  it('بدون price حتی با fixed، استعلام نشان می‌دهد', () => {
    renderWithProviders(<PriceDisplay priceType="fixed" />)
    expect(screen.getByText('استعلام قیمت')).toBeInTheDocument()
  })

  it('تخفیف واقعی را با compareAtPrice نشان می‌دهد', () => {
    renderWithProviders(
      <PriceDisplay priceType="fixed" price={4_000_000} compareAtPrice={5_000_000} />
    )
    // ٪۲۰ تخفیف
    expect(screen.getByText(/٪/)).toBeInTheDocument()
  })

  it('compareAtPrice کمتر یا مساوی را به‌عنوان تخفیف نشان نمی‌دهد', () => {
    const { container } = renderWithProviders(
      <PriceDisplay priceType="fixed" price={5_000_000} compareAtPrice={4_000_000} />
    )
    expect(container.querySelector('.line-through')).toBeNull()
  })
})
