import { PackageSearch } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from '@/components/ui/empty-state'
import { renderWithProviders, screen } from '../utils/render'

describe('EmptyState', () => {
  it('عنوان و توضیح را نشان می‌دهد', () => {
    renderWithProviders(
      <EmptyState
        icon={PackageSearch}
        title="محصولی یافت نشد"
        description="فیلترها را تغییر دهید."
      />
    )
    expect(screen.getByRole('heading', { name: 'محصولی یافت نشد' })).toBeInTheDocument()
    expect(screen.getByText('فیلترها را تغییر دهید.')).toBeInTheDocument()
  })

  it('action اختیاری را رندر می‌کند', () => {
    renderWithProviders(
      <EmptyState
        icon={PackageSearch}
        title="خالی"
        action={<button type="button">بازنشانی</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'بازنشانی' })).toBeInTheDocument()
  })

  it('بدون description هم کار می‌کند', () => {
    renderWithProviders(<EmptyState icon={PackageSearch} title="فقط عنوان" />)
    expect(screen.getByText('فقط عنوان')).toBeInTheDocument()
  })
})
