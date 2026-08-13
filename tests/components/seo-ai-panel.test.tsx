import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SeoAiPanel } from '@/components/admin/products/panels/SeoAiPanel'
import { INITIAL_DRAFT, INITIAL_FAQS } from '@/components/admin/products/product-editor.constants'
import { renderWithProviders } from '../utils/render'

const suggestion = {
  seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
  seoDescription:
    'خرید پرینتر اچ پی M402 با گارانتی اصالت کالا و مشاوره تخصصی در فروشگاه ماشین‌های اداری سایت. مشخصات فنی و قیمت به‌روز.',
  focusKeyword: 'پرینتر اچ پی M402',
}

describe('SeoAiPanel', () => {
  it('تولید را صدا می‌زند و اعمال فیلد draft را عوض می‌کند', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestion, promptVersion: 'product-seo.v1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const set = vi.fn()
    renderWithProviders(
      <SeoAiPanel
        draft={{ ...INITIAL_DRAFT, seoTitle: '', seoDescription: '' }}
        set={set}
        faqs={INITIAL_FAQS}
        onFaqsChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'تولید خودکار' }))
    await waitFor(() => expect(screen.getByText('عنوان سئو')).toBeInTheDocument())

    const applyButtons = screen.getAllByRole('button', { name: 'اعمال' })
    fireEvent.click(applyButtons[0]!)
    expect(set).toHaveBeenCalledWith('seoTitle', suggestion.seoTitle)

    vi.unstubAllGlobals()
  })

  it('خطای فارسی سرور را نشان می‌دهد', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'سقف تولید سئو در این دقیقه پر شده است.' }),
      })
    )

    renderWithProviders(
      <SeoAiPanel draft={INITIAL_DRAFT} set={vi.fn()} faqs={INITIAL_FAQS} onFaqsChange={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'تولید خودکار' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('سقف تولید سئو')
    vi.unstubAllGlobals()
  })

  it('دانلود فایل سئو JSON نسخه‌دار می‌سازد', () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:seo')
    const revokeObjectURL = vi.fn()
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    renderWithProviders(
      <SeoAiPanel
        draft={{ ...INITIAL_DRAFT, slug: 'hp-m402' }}
        set={vi.fn()}
        faqs={INITIAL_FAQS}
        onFaqsChange={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'دانلود فایل سئو' }))
    expect(createObjectURL).toHaveBeenCalled()
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(blob.type).toContain('application/json')
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  })

  it('ایمپورت را به پنل diff می‌برد و خودکار اعمال نمی‌کند', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestion, promptVersion: 'import:v1', source: 'file' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const set = vi.fn()
    renderWithProviders(
      <SeoAiPanel
        draft={{ ...INITIAL_DRAFT, seoTitle: '' }}
        set={set}
        faqs={INITIAL_FAQS}
        onFaqsChange={vi.fn()}
      />
    )

    const file = new File([JSON.stringify({ suggestion })], 'seo.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('ایمپورت فایل سئو'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('عنوان سئو')).toBeInTheDocument())
    expect(set).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/products/seo/import',
      expect.objectContaining({ method: 'POST' })
    )
    expect(screen.getByText(/منبع: فایل ایمپورت‌شده/)).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
