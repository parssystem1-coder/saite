import { describe, expect, it, vi } from 'vitest'
import { ProductSubCategoryStrip } from '@/components/products/product-subcategory-strip'
import { render, screen, fireEvent } from '../utils/render'

describe('ProductSubCategoryStrip', () => {
  it('اگر دسته‌بندی انتخاب نشده باشد رندر نمی‌شود', () => {
    const { container } = render(
      <ProductSubCategoryStrip category="all" onSelect={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('زمانی که دسته پرینتر انتخاب شده باشد، زیردسته‌های تخصصی پرینتر را نمایش می‌دهد', () => {
    const handleSelect = vi.fn()
    render(
      <ProductSubCategoryStrip
        category="printer"
        activeSubCategory="laser-mono"
        onSelect={handleSelect}
      />
    )

    expect(screen.getByText('زیردسته‌های تخصصی پرینتر')).toBeInTheDocument()
    expect(screen.getByText('پرینتر لیزری تک‌رنگ')).toBeInTheDocument()
    expect(screen.getByText('پرینتر لیزری رنگی')).toBeInTheDocument()
    expect(screen.getByText('پلاتر و چاپ عریض')).toBeInTheDocument()

    // تست کلیک روی زیردسته
    const button = screen.getByRole('button', { name: /پرینتر لیزری رنگی/i })
    fireEvent.click(button)
    expect(handleSelect).toHaveBeenCalledWith('laser-color')
  })
})
