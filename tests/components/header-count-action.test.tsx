import { ShoppingCart } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { HeaderCountAction } from '@/components/layout/header-count-action'
import { render, screen } from '../utils/render'

/**
 * قفل ضدرگرسیون برای باگ hydration mismatch:
 *
 *   aria-label="سبد خرید، ۱ کالا"   (کلاینت، پس از بازیابی localStorage)
 *   aria-label="سبد خرید، ۰ کالا"   (سرور، بدون localStorage)
 *
 * علت: بجِ دیداری داخل گارد `ready` بود ولی aria-label بیرون از آن.
 */
describe('HeaderCountAction', () => {
  it('🔑 پیش از بازیابی، برچسب عدد ندارد — منشأ mismatch حذف می‌شود', () => {
    render(
      <HeaderCountAction
        href="/cart"
        icon={ShoppingCart}
        label="سبد خرید"
        count={3}
        ready={false}
      />
    )

    // حتی با count=3، تا ready نشده نباید عددی در برچسب باشد
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('aria-label', 'سبد خرید')
    expect(link.getAttribute('aria-label')).not.toMatch(/[۰-۹0-9]/)
  })

  it('🔑 خروجی سرور و کلاینتِ اولیه یکسان است', () => {
    // سرور: ready=false + count=0 | کلاینت پیش از بازیابی: ready=false + count واقعی
    const { container: server } = render(
      <HeaderCountAction href="/cart" icon={ShoppingCart} label="سبد خرید" count={0} ready={false} />
    )
    const serverHtml = server.innerHTML

    const { container: client } = render(
      <HeaderCountAction href="/cart" icon={ShoppingCart} label="سبد خرید" count={7} ready={false} />
    )

    expect(client.innerHTML).toBe(serverHtml)
  })

  it('پس از بازیابی، تعداد در برچسب می‌آید', () => {
    render(
      <HeaderCountAction href="/cart" icon={ShoppingCart} label="سبد خرید" count={3} ready />
    )
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'سبد خرید، ۳ کالا')
  })

  it('سبد خالی بج نشان نمی‌دهد و برچسب ساده دارد', () => {
    render(
      <HeaderCountAction href="/cart" icon={ShoppingCart} label="سبد خرید" count={0} ready />
    )
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'سبد خرید')
  })

  it('بج دیداری از screen reader پنهان است — عدد دوبار خوانده نشود', () => {
    const { container } = render(
      <HeaderCountAction href="/cart" icon={ShoppingCart} label="سبد خرید" count={5} ready />
    )
    // برچسب لینک عدد را دارد، پس بج نباید دوباره اعلام شود
    const badge = container.querySelector('[aria-hidden="true"].rounded-full')
    expect(badge).not.toBeNull()
    expect(badge).toHaveTextContent('۵')
  })

  it('href و آیکون درست رندر می‌شوند', () => {
    render(
      <HeaderCountAction
        href="/wishlist"
        icon={ShoppingCart}
        label="علاقه‌مندی‌ها"
        count={2}
        ready
      />
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/wishlist')
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'علاقه‌مندی‌ها، ۲ کالا')
  })
})
