import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RecentlyViewed } from '@/components/products/recently-viewed'
import { __resetRecentlyViewedCache, trackProductView } from '@/lib/recently-viewed'
import type { RecentProduct } from '@/lib/recently-viewed'
import { act, render, screen } from '../utils/render'

const sample = (id: string): RecentProduct => ({
  id,
  slug: `slug-${id}`,
  name: `پرینتر ${id}`,
  brand: 'canon',
  model: `M-${id}`,
  images: ['/products/printer.svg'],
  priceType: 'fixed',
  price: 1_000_000,
  stockStatus: 'in_stock',
})

beforeEach(() => {
  sessionStorage.clear()
  __resetRecentlyViewedCache()
})

describe('RecentlyViewed', () => {
  it('🔑 بدون حلقهٔ بی‌نهایت رندر می‌شود', () => {
    // باگ اصلی: getSnapshot هر بار آرایهٔ تازه می‌ساخت و React
    // با خطای «getSnapshot should be cached» در حلقه می‌افتاد.
    // این تست دقیقاً همان مسیر را می‌رود.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    trackProductView(sample('a'))
    trackProductView(sample('b'))

    expect(() => render(<RecentlyViewed />)).not.toThrow()

    const loopWarning = errorSpy.mock.calls.find((call) =>
      String(call[0]).includes('getSnapshot should be cached')
    )
    expect(loopWarning).toBeUndefined()

    errorSpy.mockRestore()
  })

  it('اقلام دیده‌شده را نشان می‌دهد — جدیدترین اول', () => {
    trackProductView(sample('a'))
    trackProductView(sample('b'))

    render(<RecentlyViewed />)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/products/slug-b')
    expect(links[1]).toHaveAttribute('href', '/products/slug-a')
  })

  it('با فهرست خالی چیزی رندر نمی‌کند', () => {
    const { container } = render(<RecentlyViewed />)
    expect(container).toBeEmptyDOMElement()
  })

  it('excludeId کالای فعلی را حذف می‌کند', () => {
    trackProductView(sample('a'))
    trackProductView(sample('b'))

    render(<RecentlyViewed excludeId="b" />)

    expect(screen.queryByText('پرینتر b')).not.toBeInTheDocument()
    expect(screen.getByText('پرینتر a')).toBeInTheDocument()
  })

  it('اگر تنها کالا همان صفحهٔ فعلی باشد، بخش پنهان می‌شود', () => {
    trackProductView(sample('only'))
    const { container } = render(<RecentlyViewed excludeId="only" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('🔑 با ثبت بازدید جدید، فهرست بدون رفرش به‌روز می‌شود', () => {
    trackProductView(sample('a'))
    render(<RecentlyViewed />)
    expect(screen.getAllByRole('link')).toHaveLength(1)

    // رویداد storage در همان تب fire نمی‌شود؛ ناظر داخلی باید کار کند
    act(() => {
      trackProductView(sample('b'))
    })

    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('عنوان سفارشی را می‌پذیرد', () => {
    trackProductView(sample('a'))
    render(<RecentlyViewed title="بازدیدهای اخیر شما" />)
    expect(screen.getByText('بازدیدهای اخیر شما')).toBeInTheDocument()
  })
})
