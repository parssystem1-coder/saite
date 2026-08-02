'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { CheckoutSkeleton } from '@/components/checkout/checkout-skeleton'
import { CheckoutSummary } from '@/components/checkout/checkout-summary'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useCartHydrated } from '@/hooks/use-has-hydrated'
import type { CheckoutInput } from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'

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

    // شبیه‌سازی اتصال به درگاه — در فاز بک‌اند با createOrder جایگزین می‌شود
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // شمارهٔ پیگیری موقت برای صفحهٔ موفقیت (تا وقتی سفارش واقعی نداریم)
    const ref = String(Math.floor(100000 + Math.random() * 900000))
    try {
      sessionStorage.setItem('saite:last-order-ref', ref)
      sessionStorage.setItem('saite:last-order-meta', JSON.stringify({
        receiverName: data.receiverName,
        itemCount: items.length,
      }))
    } catch {
      // sessionStorage ممکن است در حالت private محدود باشد
    }

    clearCart()
    router.push(`/checkout/success?ref=${ref}`)
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
          total={totalPrice()}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  )
}
