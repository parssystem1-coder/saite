import { describe, expect, it, vi } from 'vitest'
import { Pagination } from '@/components/ui/pagination'
import { renderWithProviders, screen, fireEvent } from '../utils/render'

describe('Pagination', () => {
  it('وقتی totalPages ≤ 1 چیزی رندر نمی‌کند', () => {
    const { container } = renderWithProviders(
      <Pagination page={1} totalPages={1} onChange={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('شمارهٔ صفحات را نشان می‌دهد', () => {
    renderWithProviders(<Pagination page={2} totalPages={3} onChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'صفحه‌بندی نتایج' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'صفحهٔ ۱' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'صفحهٔ ۲' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('در صفحهٔ اول، «قبلی» غیرفعال است', () => {
    renderWithProviders(<Pagination page={1} totalPages={4} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'قبلی' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'بعدی' })).not.toBeDisabled()
  })

  it('در صفحهٔ آخر، «بعدی» غیرفعال است', () => {
    renderWithProviders(<Pagination page={4} totalPages={4} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'بعدی' })).toBeDisabled()
  })

  it('کلیک روی شماره، onChange را صدا می‌زند', () => {
    const onChange = vi.fn()
    renderWithProviders(<Pagination page={1} totalPages={3} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'صفحهٔ ۳' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('کلیک بعدی/قبلی صفحه را جابه‌جا می‌کند', () => {
    const onChange = vi.fn()
    renderWithProviders(<Pagination page={2} totalPages={5} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'بعدی' }))
    expect(onChange).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByRole('button', { name: 'قبلی' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })
})
