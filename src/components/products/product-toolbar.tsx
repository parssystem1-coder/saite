'use client'

import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import type { CatalogViewMode } from '@/components/products/product-grid'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS, type SortOption } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProductToolbarProps {
  resultCount: number
  isLoading: boolean
  activeFilterCount: number
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  onOpenMobileFilters: () => void
  view?: CatalogViewMode
  onViewChange?: (view: CatalogViewMode) => void
}

/** نوار بالای گرید: فیلتر موبایل، تعداد، نمای شبکه/لیست، مرتب‌سازی */
export function ProductToolbar({
  resultCount,
  isLoading,
  activeFilterCount,
  sort,
  onSortChange,
  onOpenMobileFilters,
  view = 'grid',
  onViewChange,
}: ProductToolbarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="lg:hidden"
          onClick={onOpenMobileFilters}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal />
          فیلترها
          {activeFilterCount > 0 && (
            <span className="ms-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
              {formatNumber(activeFilterCount)}
            </span>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'در حال بارگذاری…' : `${formatNumber(resultCount)} کالا`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onViewChange && (
          <div
            className="flex rounded-xl border border-border bg-surface-0/60 p-0.5"
            role="group"
            aria-label="نوع نمایش"
          >
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              aria-pressed={view === 'grid'}
              aria-label="نمای شبکه"
              className={cn(
                'flex size-9 items-center justify-center rounded-lg transition-colors',
                view === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              aria-pressed={view === 'list'}
              aria-label="نمای لیست"
              className={cn(
                'flex size-9 items-center justify-center rounded-lg transition-colors',
                view === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        )}

        <label htmlFor="sort" className="text-xs font-bold text-muted-foreground">
          مرتب‌سازی
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="h-10 rounded-xl border border-border bg-input px-3 text-sm outline-none focus-visible:border-primary/60"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
