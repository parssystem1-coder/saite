'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPriceWithUnit } from '@/lib/format'

interface CartSummaryProps {
  itemCount: number
  total: number
}

export function CartSummary({ itemCount, total }: CartSummaryProps) {
  return (
    <aside className="w-full lg:w-96">
      <div className="surface-3d sticky top-28 rounded-2xl p-6 md:p-8">
        <h2 className="mb-6 text-xl font-bold text-foreground">خلاصهٔ سفارش</h2>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>تعداد اقلام</span>
            <span>{formatNumber(itemCount)} کالا</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>هزینهٔ ارسال</span>
            <span className="font-bold text-stock-in">رایگان</span>
          </div>
          <div className="my-4 h-px bg-border" />
          <div className="flex items-center justify-between text-xl font-black text-foreground">
            <span>جمع کل</span>
            <span className="text-primary">{formatPriceWithUnit(total)}</span>
          </div>
        </div>

        <Button size="lg" className="mt-8 h-14 w-full text-base" asChild>
          <Link href="/checkout">تکمیل فرایند خرید</Link>
        </Button>

        <Link
          href="/products"
          className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          ادامهٔ خرید
        </Link>
      </div>
    </aside>
  )
}
