'use client'

import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import { getPaginationRange, PAGE_ELLIPSIS } from '@/lib/pagination-range'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  /** تعداد صفحات مجاور صفحهٔ فعلی در هر سمت */
  siblingCount?: number
  /** برچسب aria برای nav */
  'aria-label'?: string
  className?: string
}

/** صفحه‌بندی عمومی — مستقل از دامنهٔ محصولات */
export function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
  'aria-label': ariaLabel = 'صفحه‌بندی نتایج',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const slots = getPaginationRange(page, totalPages, siblingCount)

  return (
    <nav
      aria-label={ariaLabel}
      className={cn('mt-10 flex items-center justify-center gap-2', className)}
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        قبلی
      </Button>

      <ul className="flex items-center gap-1.5">
        {slots.map((slot, index) =>
          slot === PAGE_ELLIPSIS ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="flex size-9 items-center justify-center text-sm text-muted-foreground/60"
            >
              …
            </li>
          ) : (
            <li key={slot}>
              <button
                type="button"
                onClick={() => onChange(slot)}
                aria-current={slot === page ? 'page' : undefined}
                aria-label={`صفحهٔ ${formatNumber(slot)}`}
                className={cn(
                  'size-9 rounded-lg text-sm font-bold transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                  slot === page
                    ? 'bg-primary text-primary-foreground shadow-glow-sm'
                    : 'border border-border bg-surface-1 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                {formatNumber(slot)}
              </button>
            </li>
          )
        )}
      </ul>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        بعدی
      </Button>
    </nav>
  )
}
