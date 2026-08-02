import { describe, expect, it, vi } from 'vitest'
import { ProductCard } from '@/components/ui/product-card'
import { sampleProduct, quoteOnlyProduct } from '../fixtures/product'
import { renderWithProviders, screen, fireEvent } from '../utils/render'

describe('ProductCard', () => {
  it('نام، مدل و برند را نشان می‌دهد', () => {
    renderWithProviders(<ProductCard product={sampleProduct} />)
    expect(screen.getByText(sampleProduct.name)).toBeInTheDocument()
    expect(screen.getByText(sampleProduct.model)).toBeInTheDocument()
    expect(screen.getByText(/CANON/i)).toBeInTheDocument()
  })

  it('برای کالای خریدنی دکمهٔ افزودن به سبد دارد', () => {
    const onAdd = vi.fn()
    renderWithProviders(<ProductCard product={sampleProduct} onAddToCart={onAdd} />)
    const btn = screen.getByRole('button', {
      name: `افزودن ${sampleProduct.name} به سبد خرید`,
    })
    fireEvent.click(btn)
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith(sampleProduct)
  })

  it('برای کالای استعلامی لینک استعلام نشان می‌دهد', () => {
    renderWithProviders(<ProductCard product={quoteOnlyProduct} />)
    const link = screen.getByRole('link', {
      name: `استعلام قیمت ${quoteOnlyProduct.name}`,
    })
    expect(link).toHaveAttribute('href', `/products/${quoteOnlyProduct.slug}#quote`)
  })

  it('با onCompare دکمهٔ مقایسه را نشان می‌دهد و کلیک می‌کند', () => {
    const onCompare = vi.fn()
    renderWithProviders(
      <ProductCard product={sampleProduct} onCompare={onCompare} inCompare={false} />
    )
    fireEvent.click(
      screen.getByRole('button', { name: `افزودن ${sampleProduct.name} به مقایسه` })
    )
    expect(onCompare).toHaveBeenCalledWith(sampleProduct)
  })

  it('وقتی inCompare=true برچسب حذف از مقایسه دارد', () => {
    renderWithProviders(
      <ProductCard product={sampleProduct} onCompare={() => {}} inCompare />
    )
    expect(
      screen.getByRole('button', { name: `حذف ${sampleProduct.name} از مقایسه` })
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('بدون onCompare دکمهٔ مقایسه رندر نمی‌شود', () => {
    renderWithProviders(<ProductCard product={sampleProduct} />)
    expect(screen.queryByRole('button', { name: /مقایسه/ })).not.toBeInTheDocument()
  })

  it('با onWishlist و inWishlist درست کار می‌کند', () => {
    const onWishlist = vi.fn()
    renderWithProviders(
      <ProductCard product={sampleProduct} onWishlist={onWishlist} inWishlist />
    )
    const btn = screen.getByRole('button', {
      name: `حذف ${sampleProduct.name} از علاقه‌مندی‌ها`,
    })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(btn)
    expect(onWishlist).toHaveBeenCalledWith(sampleProduct)
  })

  it('لینک جزئیات محصول را با slug می‌سازد', () => {
    renderWithProviders(<ProductCard product={sampleProduct} />)
    const links = screen.getAllByRole('link')
    const detail = links.find((a) => a.getAttribute('href') === `/products/${sampleProduct.slug}`)
    expect(detail).toBeTruthy()
  })

  it('ویژگی‌های کلیدی را نشان می‌دهد', () => {
    renderWithProviders(<ProductCard product={sampleProduct} />)
    expect(screen.getByText('۱۲ ppm')).toBeInTheDocument()
    expect(screen.getByText('A4')).toBeInTheDocument()
  })
})
