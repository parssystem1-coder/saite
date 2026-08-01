import { STOCK_STATUS_MAP } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { StockStatus } from '@/types/product'

interface StockBadgeProps {
  status: StockStatus
  className?: string
  size?: 'sm' | 'md'
}

/**
 * بج وضعیت موجودی.
 * چهار حالت دامنه را پوشش می‌دهد: موجود، محدود، ناموجود، استعلامی.
 * نقطهٔ رنگی برای حالت «موجود» پالس می‌زند تا نگاه را جذب کند.
 */
export function StockBadge({ status, className, size = 'md' }: StockBadgeProps) {
  const config = STOCK_STATUS_MAP[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.tokenClass,
        className
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          config.dotClass,
          status === 'in_stock' && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}
