'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { CheckoutSkeleton } from '@/components/checkout/checkout-skeleton'
import { CheckoutSummary } from '@/components/checkout/checkout-summary'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useCartHydrated } from '@/hooks/use-has-hydrated'
import { generateOrderRef, saveLastOrder } from '@/lib/checkout/last-order'
import type { CheckoutInput } from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'
import { repriceCart } from '@/lib/checkout/actions'
import type { RejectedLine } from '@/lib/checkout/price-authority'

/**
 * تسویه‌حساب سمت کلاینت (mock).
 *
 * آماده‌سازی فاز بعد: onSubmit باید Server Action / API واقعی را صدا بزند،
 * قیمت را سمت سرور دوباره محاسبه کند و به درگاه هدایت کند.
 */
export function CheckoutClient() {
  const router = useRouter()
  const hydrated = useCartHydrated()

  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const clearCart = useCartStore((s) => s.clearCart)

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)

  const [isProcessing, setIsProcessing] = React.useState(false)
  const [rejected, setRejected] = React.useState<RejectedLine[] | null>(null)
  const [repricedTotal, setRepricedTotal] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!hydrated || isProcessing) return
    if (!isLoggedIn) {
      router.replace('/login?redirect=/checkout')
      return
    }
    if (items.length === 0) {
      router.replace('/products')
    }
  }, [hydrated, isLoggedIn, items.length, router, isProcessing])

  if (!hydrated || !isLoggedIn || items.length === 0) {
    return <CheckoutSkeleton />
  }

  const handleSubmit = async (data: CheckoutInput) => {
    setIsProcessing(true)
    setRejected(null)

    try {
      // مرجع قیمت سمت سرور — تنها مبلغ معتبر
      const lines = items.map((item) => ({ id: item.id, quantity: item.quantity }))
      const result = await repriceCart(lines)

      if (result.rejected.length > 0) {
        setRejected(result.rejected)
        setIsProcessing(false)
        return
      }

      setRepricedTotal(result.total)

      // شبیه‌سازی اتصال به درگاه — در فاز بک‌اند با createOrder جایگزین می‌شود
      await new Promise((resolve) => setTimeout(resolve, 800))

      // شمارهٔ پیگیری موقت برای صفحهٔ موفقیت
      const ref = generateOrderRef()
      saveLastOrder({
        ref,
        receiverName: data.receiverName,
        itemCount: result.lines.length,
        total: result.total,
        paymentMethod: data.paymentMethod,
      })

      clearCart()
      router.push(`/checkout/success?ref=${ref}`)
    } catch {
      setRejected([{ id: 'unknown', reason: 'not-found' }])
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: 'خانه', href: '/' },
          { label: 'سبد خرید', href: '/cart' },
          { label: 'تسویه‌حساب' },
        ]}
      />

      {rejected && rejected.length > 0 && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <p className="font-bold text-destructive">برخی اقلام قابل پرداخت نیستند:</p>
          <ul className="mt-2 list-disc pr-5 text-muted-foreground">
            {rejected.map((r) => (
              <li key={r.id}>
                {r.id} —{' '}
                {r.reason === 'not-found'
                  ? 'ناموجود در منبع داده'
                  : r.reason === 'quote-only'
                    ? 'نیاز به استعلام قیمت'
                    : r.reason === 'out-of-stock'
                      ? 'ناموجود'
                      : r.reason === 'invalid-quantity'
                        ? 'تعداد نامعتبر'
                        : r.reason}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">لطفاً سبد را به‌روزرسانی کنید و دوباره تلاش کنید.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2">
          <h1 className="mb-6 text-2xl font-black text-foreground md:text-3xl">
            تکمیل اطلاعات ارسال
          </h1>
          <CheckoutForm
            defaultName={user?.name ?? ''}
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
          />
        </div>

        <CheckoutSummary
          items={items}
          total={repricedTotal ?? totalPrice()}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  )
}
