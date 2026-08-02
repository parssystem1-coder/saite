import { describe, expect, it } from 'vitest'
import { StockBadge } from '@/components/ui/stock-badge'
import { STOCK_STATUS_MAP } from '@/lib/constants'
import type { StockStatus } from '@/types/product'
import { renderWithProviders, screen } from '../utils/render'

describe('StockBadge', () => {
  const statuses = Object.keys(STOCK_STATUS_MAP) as StockStatus[]

  it.each(statuses)('برچسب صحیح برای وضعیت %s', (status) => {
    renderWithProviders(<StockBadge status={status} />)
    expect(screen.getByText(STOCK_STATUS_MAP[status].label)).toBeInTheDocument()
  })

  it('نقطهٔ رنگی برای screen reader مخفی است', () => {
    const { container } = renderWithProviders(<StockBadge status="in_stock" />)
    const dots = container.querySelectorAll('[aria-hidden="true"]')
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })
})
