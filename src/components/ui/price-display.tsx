import { calcDiscountPercent, formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PriceType } from '@/types/product'

interface PriceDisplayProps {
  priceType: PriceType
  price?: number
  compareAtPrice?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { main: 'text-base', unit: 'text-[10px]', old: 'text-[10px]' },
  md: { main: 'text-xl', unit: 'text-xs', old: 'text-xs' },
  lg: { main: 'text-3xl', unit: 'text-sm', old: 'text-sm' },
}

/**
 * نمایش قیمت با پشتیبانی از حالت B2B «استعلامی».
 *
 * بخشی از کالاهای این صنعت (کپی‌های سنگین، قطعات سفارشی) قیمت ثابت
 * ندارند. این کامپوننت به‌جای نمایش «۰ تومان»، حالت «تماس بگیرید» را
 * به‌شکل معنادار رندر می‌کند.
 */
export function PriceDisplay({
  priceType,
  price,
  compareAtPrice,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const s = SIZE_MAP[size]

  if (priceType === 'quote_only' || price === undefined) {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className={cn('font-black text-stock-quote', s.main)}>استعلام قیمت</span>
        <span className={cn('text-muted-foreground', s.unit)}>برای قیمت تماس بگیرید</span>
      </div>
    )
  }

  const discount = calcDiscountPercent(price, compareAtPrice)

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {discount !== null && compareAtPrice !== undefined && (
        <div className="flex items-center gap-2">
          <span className={cn('text-muted-foreground line-through', s.old)}>
            {formatPrice(compareAtPrice)}
          </span>
          <span
            className={cn(
              'rounded-md bg-destructive/15 px-1.5 py-0.5 font-bold text-destructive',
              s.old
            )}
          >
            ٪{formatPrice(discount)}
          </span>
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className={cn('font-black text-foreground', s.main)}>{formatPrice(price)}</span>
        <span className={cn('font-medium text-muted-foreground', s.unit)}>تومان</span>
      </div>
    </div>
  )
}
