'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPriceWithUnit } from '@/lib/format'
import type { CartItem } from '@/store/cart-store'

interface CheckoutSummaryProps {
  items: CartItem[]
  total: number
  isProcessing: boolean
}

export function CheckoutSummary({ items, total, isProcessing }: CheckoutSummaryProps) {
  return (
    <aside className="w-full">
      <div className="surface-3d sticky top-28 rounded-2xl border border-primary/20 p-6 md:p-8">
        <h2 className="mb-6 text-xl font-bold text-foreground">خلاصهٔ نهایی</h2>

        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1 line-clamp-1 text-muted-foreground">
                {item.name} × {formatNumber(item.quantity)}
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {formatPriceWithUnit(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="my-5 h-px bg-border" />

        <div className="flex items-center justify-between text-xl font-black text-foreground md:text-2xl">
          <span>قابل پرداخت</span>
          <span className="text-primary">{formatPriceWithUnit(total)}</span>
        </div>

        <Button
          type="submit"
          form="checkout-form"
          size="lg"
          className="mt-8 hidden h-14 w-full text-base lg:inline-flex"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" />
              در حال انتقال به درگاه…
            </>
          ) : (
            'پرداخت و ثبت نهایی'
          )}
        </Button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          با ثبت سفارش،{' '}
          <a href="/terms" className="text-primary hover:underline">
            قوانین و مقررات
          </a>{' '}
          فروشگاه را می‌پذیرید.
        </p>
      </div>
    </aside>
  )
}
