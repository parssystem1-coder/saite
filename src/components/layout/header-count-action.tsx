'use client'

import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface HeaderCountActionProps {
  href: string
  icon: LucideIcon
  /** نام بخش برای screen reader — مثلاً «سبد خرید» */
  label: string
  count: number
  /** آیا store از localStorage بازیابی شده؟ */
  ready: boolean
  /** رنگ بج — سبد از primary و علاقه‌مندی از destructive استفاده می‌کند */
  badgeClassName?: string
  className?: string
}

/**
 * آیکون هدر با شمارندهٔ ذخیره‌شده در localStorage.
 *
 * ── چرا `ready` روی aria-label هم اثر دارد؟ ───────────────────
 * سرور همیشه شمارنده را ۰ می‌بیند (localStorage آنجا نیست)، اما
 * کلاینت پس از بازیابی مقدار واقعی را دارد. اگر متن دسترس‌پذیری
 * مستقیماً به شمارنده وصل باشد، HTML سرور و کلاینت فرق می‌کنند و
 * React خطای hydration mismatch می‌دهد:
 *
 *   aria-label="سبد خرید، ۱ کالا"   (کلاینت)
 *   aria-label="سبد خرید، ۰ کالا"   (سرور)
 *
 * پیش از این فقط بجِ دیداری داخل گارد بود و aria-label بیرون مانده
 * بود — یعنی مشکل برای کاربر بینا پنهان و برای screen reader باقی.
 *
 * تا وقتی بازیابی تمام نشده، برچسب بدون عدد است. این هم صادقانه‌تر
 * است (هنوز نمی‌دانیم چند تا) و هم پایدار.
 */
export function HeaderCountAction({
  href,
  icon: Icon,
  label,
  count,
  ready,
  badgeClassName,
  className,
}: HeaderCountActionProps) {
  const showCount = ready && count > 0

  return (
    <Button size="icon" variant="ghost" asChild className={cn('relative', className)}>
      <Link
        href={href}
        aria-label={showCount ? `${label}، ${formatNumber(count)} کالا` : label}
      >
        <Icon />
        {showCount && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute -top-1 -left-1 flex size-5 items-center justify-center',
              'rounded-full text-[10px] font-bold',
              badgeClassName
            )}
          >
            {formatNumber(count)}
          </span>
        )}
      </Link>
    </Button>
  )
}
