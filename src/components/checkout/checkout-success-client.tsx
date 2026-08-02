'use client'

import { ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'

const subscribeNoop = () => () => {}

function readStoredRef(): string | null {
  try {
    return sessionStorage.getItem('saite:last-order-ref')
  } catch {
    return null
  }
}

function isValidRef(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{6}$/.test(value))
}

/**
 * صفحهٔ تأیید سفارش (mock).
 *
 * شماره از query (?ref=) یا sessionStorage خوانده می‌شود تا با رفرش عوض نشود.
 * آماده‌سازی فاز بعد: اعتبارسنجی orderId از API و نمایش وضعیت واقعی.
 */
export function CheckoutSuccessClient() {
  const searchParams = useSearchParams()
  const fromQuery = searchParams.get('ref')

  // sessionStorage فقط سمت کلاینت؛ useSyncExternalStore از mismatch جلوگیری می‌کند
  const fromStorage = useSyncExternalStore(subscribeNoop, readStoredRef, () => null)

  const orderRef = isValidRef(fromQuery) ? fromQuery : isValidRef(fromStorage) ? fromStorage : null

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[{ label: 'خانه', href: '/' }, { label: 'ثبت سفارش' }]}
      />

      <div className="mx-auto flex max-w-xl justify-center">
        <div className="surface-3d relative w-full overflow-hidden rounded-2xl p-8 text-center md:p-12">
          <div
            aria-hidden="true"
            className="absolute -top-20 -left-20 size-48 rounded-full bg-stock-in/15 blur-[80px]"
          />

          <div className="relative z-10 space-y-7">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-stock-in/40 bg-stock-in/15">
              <CheckCircle2 className="size-10 text-stock-in" aria-hidden="true" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-foreground md:text-3xl">
                سفارش شما ثبت شد
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                از خرید شما سپاسگزاریم. جزئیات سفارش به‌زودی بررسی می‌شود و در صورت نیاز
                کارشناسان ما با شما تماس می‌گیرند.
              </p>
            </div>

            <div className="inline-block rounded-2xl border border-border bg-surface-0/60 px-6 py-5">
              <p className="mb-1 text-xs font-bold tracking-wide text-muted-foreground">
                شمارهٔ پیگیری
              </p>
              <p
                className="text-2xl font-black tracking-widest text-primary md:text-3xl"
                dir="ltr"
              >
                #{orderRef ? formatNumber(Number(orderRef)) : '—'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button size="lg" className="h-12" asChild>
                <Link href="/dashboard">
                  <Package />
                  پنل کاربری
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12" asChild>
                <Link href="/products">
                  <ArrowLeft />
                  بازگشت به فروشگاه
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
