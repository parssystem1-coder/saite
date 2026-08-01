import { Star } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  /** امتیاز ۰ تا ۵ */
  value: number
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

/**
 * ستاره‌های امتیاز.
 *
 * نکتهٔ RTL: ردیف ستاره‌ها با dir="ltr" رندر می‌شود تا پرشدن از چپ به
 * راست باشد — همان قراردادی که کاربر در همهٔ سایت‌ها انتظار دارد.
 */
export function RatingStars({ value, count, size = 'sm', className }: Props) {
  const starSize = size === 'sm' ? 'size-3.5' : 'size-4'
  const rounded = Math.round(value)

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        dir="ltr"
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`امتیاز ${formatNumber(value)} از ۵`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className={cn(
              starSize,
              i < rounded ? 'fill-stock-low text-stock-low' : 'text-muted-foreground/35'
            )}
          />
        ))}
      </div>
      <span className={cn('font-bold text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {formatNumber(value)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({formatNumber(count)} نظر)</span>
      )}
    </div>
  )
}
