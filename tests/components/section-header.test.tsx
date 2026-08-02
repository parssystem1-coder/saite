import { describe, expect, it } from 'vitest'
import { SectionHeader } from '@/components/ui/section-header'
import { renderWithProviders, screen } from '../utils/render'

describe('SectionHeader', () => {
  it('عنوان h2 پیش‌فرض را رندر می‌کند', () => {
    renderWithProviders(<SectionHeader title="پرفروش‌ترین‌ها" />)
    expect(screen.getByRole('heading', { level: 2, name: 'پرفروش‌ترین‌ها' })).toBeInTheDocument()
  })

  it('با as=h1 عنوان صفحه می‌سازد', () => {
    renderWithProviders(<SectionHeader as="h1" title="کاتالوگ" description="توضیح" />)
    expect(screen.getByRole('heading', { level: 1, name: 'کاتالوگ' })).toBeInTheDocument()
    expect(screen.getByText('توضیح')).toBeInTheDocument()
  })

  it('action اختیاری را نشان می‌دهد', () => {
    renderWithProviders(
      <SectionHeader title="بخش" action={<button type="button">همه</button>} />
    )
    expect(screen.getByRole('button', { name: 'همه' })).toBeInTheDocument()
  })
})
