import { describe, expect, it } from 'vitest'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { render, screen } from '../utils/render'

describe('MobileBottomNav', () => {
  it('تمام ۵ لینک ناوبری اصلی را در موبایل رندر می‌کند', () => {
    render(<MobileBottomNav />)

    const nav = screen.getByRole('navigation', { name: 'ناوبری سریع موبایل' })
    expect(nav).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links.length).toBe(5)

    const labels = links.map((link) => link.textContent?.trim())
    expect(labels).toContain('خانه')
    expect(labels).toContain('محصولات')
    expect(labels).toContain('سبد خرید')
    expect(labels).toContain('مقایسه')
    expect(labels).toContain('حساب')
  })
})
