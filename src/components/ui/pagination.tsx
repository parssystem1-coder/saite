'use client'

import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  /** برچسب aria برای nav */
  'aria-label'?: string
  className?: string
}

/** صفحه‌بندی عمومی — مستقل از دامنهٔ محصولات */
export function Pagination({
  page,
  totalPages,
  onChange,
  'aria-label': ariaLabel = 'صفحه‌بندی نتایج',
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

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
        {pages.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`صفحهٔ ${formatNumber(p)}`}
              className={cn(
                'size-9 rounded-lg text-sm font-bold transition-all',
                p === page
                  ? 'bg-primary text-primary-foreground shadow-glow-sm'
                  : 'border border-border bg-surface-1 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {formatNumber(p)}
            </button>
          </li>
        ))}
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
