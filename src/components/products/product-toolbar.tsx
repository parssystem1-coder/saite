'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS, type SortOption } from '@/lib/constants'
import { formatNumber } from '@/lib/format'

interface ProductToolbarProps {
  resultCount: number
  isLoading: boolean
  activeFilterCount: number
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  onOpenMobileFilters: () => void
}

/** نوار بالای گرید: دکمهٔ فیلتر موبایل، تعداد نتایج، مرتب‌سازی */
export function ProductToolbar({
  resultCount,
  isLoading,
  activeFilterCount,
  sort,
  onSortChange,
  onOpenMobileFilters,
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

      <div className="flex items-center gap-2">
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
