import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { HeaderActions } from '@/components/layout/header-actions'
import { useCartStore } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { sampleProduct } from '../fixtures/product'

/**
 * بازتولید واقعی باگ hydration mismatch در هدر.
 *
 * سناریوی گزارش‌شدهٔ کاربر:
 *   ۱. کاربر کالایی در سبد دارد (localStorage پُر است)
 *   ۲. سرور HTML را بدون دسترسی به localStorage می‌سازد → ۰ کالا
 *   ۳. کلاینت hydrate می‌کند و مقدار واقعی را می‌بیند → ۱ کالا
 *   ۴. React اختلاف aria-label را گزارش می‌دهد
 *
 * این تست به‌جای شبیه‌سازی، واقعاً renderToString + hydrateRoot را
 * اجرا می‌کند تا اگر روزی برچسب دوباره به شمارنده وصل شود، اینجا
 * شکست بخورد.
 */

const noop = () => {}

/*
  HeaderActions از useSignOut استفاده می‌کند که به router نیاز دارد.
  در تست واحد، App Router mount نشده — پس mock می‌کنیم.
  فقط در همین فایل، تا سایر تست‌ها رفتار واقعی را حفظ کنند.
*/
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

function setupCartWithItem() {
  useCartStore.setState({ items: [] })
  useCartStore.getState().addItem(sampleProduct, 1)
  useWishlistStore.getState().toggle(sampleProduct)
}

let errorSpy: MockInstance<(...args: unknown[]) => void>

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ items: [] })
  useWishlistStore.setState({ items: [] })
  errorSpy = vi.spyOn(console, 'error').mockImplementation(noop)
})

afterEach(() => {
  errorSpy.mockRestore()
})

describe('HeaderActions — hydration', () => {
  it('🔑 با سبد پُر، hydration بدون mismatch انجام می‌شود', async () => {
    const element = <HeaderActions mobileOpen={false} onToggleMobile={noop} />

    // ۱) HTML سرور: store هنوز خالی است
    const serverHtml = renderToString(element)

    // ۲) کاربر از قبل کالا داشته — درست مثل بازیابی localStorage
    setupCartWithItem()

    // ۳) hydration واقعی روی همان HTML
    const container = document.createElement('div')
    container.innerHTML = serverHtml
    document.body.appendChild(container)

    await act(async () => {
      hydrateRoot(container, element)
    })

    const mismatch = errorSpy.mock.calls.find((call: unknown[]) =>
      String(call[0]).includes('hydrat')
    )
    expect(mismatch, `خطای hydration: ${String(mismatch?.[0])}`).toBeUndefined()

    document.body.removeChild(container)
  })

  it('🔑 HTML سرور هیچ عددی در aria-label ندارد', () => {
    setupCartWithItem()

    const html = renderToString(<HeaderActions mobileOpen={false} onToggleMobile={noop} />)
    const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1])

    const cartLabel = labels.find((l) => l.startsWith('سبد خرید'))
    const wishlistLabel = labels.find((l) => l.startsWith('علاقه‌مندی'))

    expect(cartLabel).toBe('سبد خرید')
    expect(wishlistLabel).toBe('علاقه‌مندی‌ها')
  })

  it('پس از hydration، تعداد واقعی در برچسب می‌آید', async () => {
    const element = <HeaderActions mobileOpen={false} onToggleMobile={noop} />

    // HTML سرور باید واقعاً داخل کانتینر باشد، وگرنه hydrateRoot
    // خودش خطای «container is empty» می‌دهد
    const serverHtml = renderToString(element)
    setupCartWithItem()

    const container = document.createElement('div')
    container.innerHTML = serverHtml
    document.body.appendChild(container)

    await act(async () => {
      hydrateRoot(container, element)
    })

    const cartLink = container.querySelector('a[href="/cart"]')
    expect(cartLink?.getAttribute('aria-label')).toBe('سبد خرید، ۱ کالا')

    document.body.removeChild(container)
  })
})
