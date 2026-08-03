'use client'

import { ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  isValidOrderRef,
  PAYMENT_METHOD_LABELS,
  readLastOrder,
  readLastOrderRef,
  type LastOrder,
} from '@/lib/checkout/last-order'
import { formatNumber, formatPriceWithUnit } from '@/lib/format'

const subscribeNoop = () => () => {}

/** snapshot پایدار — بدون آن useSyncExternalStore در هر رندر شیء تازه می‌گیرد */
let cachedRaw: string | null = null
let cachedOrder: LastOrder | null = null

function getOrderSnapshot(): LastOrder | null {
  let raw: string | null = null
  try {
    raw = sessionStorage.getItem('saite:last-order-meta')
  } catch {
    return null
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedOrder = readLastOrder()
  }
  return cachedOrder
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
  const fromStorage = useSyncExternalStore(subscribeNoop, readLastOrderRef, () => null)
  const order = useSyncExternalStore(subscribeNoop, getOrderSnapshot, () => null)

  const orderRef = isValidOrderRef(fromQuery)
    ? fromQuery
    : isValidOrderRef(fromStorage)
      ? fromStorage
      : null

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

            {/* خلاصهٔ سفارش — تا پیش از این ذخیره می‌شد ولی هرگز نمایش داده نمی‌شد */}
            {order && order.ref === orderRef && (
              <dl className="mx-auto max-w-sm space-y-2.5 rounded-2xl border border-border bg-surface-0/40 p-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">تحویل‌گیرنده</dt>
                  <dd className="font-bold text-foreground">{order.receiverName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">تعداد اقلام</dt>
                  <dd className="font-bold text-foreground">
                    {formatNumber(order.itemCount)} کالا
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">روش پرداخت</dt>
                  <dd className="font-bold text-foreground">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
                  <dt className="text-muted-foreground">مبلغ پرداختی</dt>
                  <dd className="font-black text-primary">{formatPriceWithUnit(order.total)}</dd>
                </div>
              </dl>
            )}

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
