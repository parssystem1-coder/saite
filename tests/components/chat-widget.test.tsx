import { describe, it, expect } from 'vitest'
import { ChatWidget } from '@/components/chat/chat-widget'
import { fireEvent, renderWithProviders, screen } from '../utils/render'

/** اسموک‌تست ویجت — قابلیت باز/بسته شدن، خوشامد، و چیپ‌های سوال */
describe('ChatWidget', () => {
  it('دکمهٔ شناور با برچسب دسترس‌پذیر رندر می‌شود و پنل پیش‌فرض بسته است', () => {
    renderWithProviders(<ChatWidget />)

    const fab = screen.getByRole('button', { name: 'گفتگو با مشاور فروش هوشمند' })
    expect(fab).toBeInTheDocument()
    expect(fab).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('باز کردن پنل — خوشامد، چیپ‌های سوال و ورودی نمایش داده می‌شود', () => {
    renderWithProviders(<ChatWidget />)

    fireEvent.click(screen.getByRole('button', { name: 'گفتگو با مشاور فروش هوشمند' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'گفتگو با مشاور فروش هوشمند سایته')
    expect(screen.getByText(/مشاور فروش هوشمند سایته هستم/)).toBeInTheDocument()
    expect(screen.getByText('یک پرینتر لیزری برای دفتر کوچک می‌خواهم')).toBeInTheDocument()
    expect(screen.getByLabelText('پیام به مشاور فروش هوشمند')).toBeInTheDocument()

    // سلب مسئولیت شفافیت AI زیر فرم دیده می‌شود
    expect(screen.getByText(/توسط هوش مصنوعی تولید می‌شوند/)).toBeInTheDocument()
  })

  it('دکمهٔ ارسال تا وقتی ورودی خالی است غیرفعال می‌ماند', () => {
    renderWithProviders(<ChatWidget />)
    fireEvent.click(screen.getByRole('button', { name: 'گفتگو با مشاور فروش هوشمند' }))

    const sendButton = screen.getByRole('button', { name: 'ارسال پیام' })
    expect(sendButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('پیام به مشاور فروش هوشمند'), {
      target: { value: 'پرینتر' },
    })
    expect(sendButton).toBeEnabled()
  })
})
