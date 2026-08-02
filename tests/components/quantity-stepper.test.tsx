import { describe, expect, it, vi } from 'vitest'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { renderWithProviders, screen, fireEvent } from '../utils/render'

describe('QuantityStepper', () => {
  it('مقدار فعلی را نمایش می‌دهد', () => {
    renderWithProviders(<QuantityStepper value={3} onChange={() => {}} />)
    expect(screen.getByText('۳')).toBeInTheDocument()
  })

  it('با افزایش، onChange را با value+1 صدا می‌زند', () => {
    const onChange = vi.fn()
    renderWithProviders(<QuantityStepper value={2} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'افزایش تعداد' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('با کاهش، onChange را با value-1 صدا می‌زند', () => {
    const onChange = vi.fn()
    renderWithProviders(<QuantityStepper value={2} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'کاهش تعداد' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('در min دکمهٔ کاهش غیرفعال است', () => {
    renderWithProviders(<QuantityStepper value={1} min={1} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'کاهش تعداد' })).toBeDisabled()
  })

  it('در max دکمهٔ افزایش غیرفعال است', () => {
    renderWithProviders(<QuantityStepper value={5} max={5} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'افزایش تعداد' })).toBeDisabled()
  })

  it('از max بالاتر نمی‌رود', () => {
    const onChange = vi.fn()
    renderWithProviders(<QuantityStepper value={4} max={5} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'افزایش تعداد' }))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})
