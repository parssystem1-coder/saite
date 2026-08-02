'use client'

import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Error Boundary سطح app — خطاهای رندر مسیر را می‌گیرد.
 * بدون لحن تزئینی؛ پیام انسانی و کنش واضح.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // آماده‌سازی فاز بعد: ارسال به سرویس مانیتورینگ (Sentry و …)
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="surface-3d max-w-lg rounded-2xl p-8 md:p-10">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-destructive/15">
          <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-black text-foreground">مشکلی پیش آمد</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          در نمایش این صفحه خطایی رخ داد. می‌توانید دوباره تلاش کنید یا به فروشگاه
          بازگردید. اگر مشکل تکرار شد، با پشتیبانی تماس بگیرید.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/70" dir="ltr">
            کد پیگیری: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RotateCcw />
            تلاش دوباره
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/">
              <Home />
              بازگشت به خانه
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/products">فروشگاه</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
