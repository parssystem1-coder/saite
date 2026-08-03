'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { Button } from '@/components/ui/button'

export interface SegmentErrorProps {
  /** عنوان متناسب با همان بخش — نه پیام عمومی */
  title: string
  /** توضیح اینکه دقیقاً چه چیزی بارگذاری نشد و کاربر چه کند */
  description: string
  error: Error & { digest?: string }
  reset: () => void
  /** کنش جایگزین کنار «تلاش دوباره» */
  secondaryAction?: { href: string; label: string }
}

/**
 * بدنهٔ مشترک `error.tsx` سگمنت‌ها.
 *
 * چرا مرز خطا در سطح سگمنت لازم است؟
 * بدون آن، خطای یک ویجت (مثلاً پیشنهاد مصرفی در سبد) کل صفحه را به
 * error ریشه می‌برد و کاربر context خود — سبد، فیلترها، مسیر — را
 * گم می‌کند. با مرز سگمنتی، هدر و ناوبری سالم می‌مانند و فقط همان
 * بخش پیام خطا نشان می‌دهد.
 *
 * این کامپوننت خودش `error.tsx` نیست؛ هر سگمنت فایل نازک خودش را
 * دارد تا عنوان و پیام مخصوص همان بخش باشد.
 */
export function SegmentError({
  title,
  description,
  error,
  reset,
  secondaryAction,
}: SegmentErrorProps) {
  React.useEffect(() => {
    // آماده‌سازی فاز بعد: ارسال به سرویس مانیتورینگ (Sentry و …)
    console.error('[segment-error]', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16">
      <div
        role="alert"
        className="surface-3d mx-auto max-w-lg rounded-2xl p-8 text-center md:p-10"
      >
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-destructive/15">
          <AlertTriangle className="size-7 text-destructive" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-black text-foreground md:text-2xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/70" dir="ltr">
            کد پیگیری: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RotateCcw />
            تلاش دوباره
          </Button>
          {secondaryAction && (
            <Button variant="outline" asChild>
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
