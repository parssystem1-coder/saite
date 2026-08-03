'use client'

import { Filter, X } from 'lucide-react'
import * as React from 'react'
import { ProductFiltersPanel } from '@/components/products/product-filters-panel'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import type { ProductFilters } from '@/lib/product-filters'

interface ProductFiltersDrawerProps {
  open: boolean
  onClose: () => void
  filters: ProductFilters
  activeCount: number
  resultCount: number
  setParam: (key: string, value: string | number | boolean | null) => void
  resetFilters: () => void
}

/**
 * کشوی فیلتر موبایل با Escape و قفل اسکرول.
 * focus-trap کامل‌تر در فاز a11y قابل ارتقا است.
 */
export function ProductFiltersDrawer({
  open,
  onClose,
  filters,
  activeCount,
  resultCount,
  setParam,
  resetFilters,
}: ProductFiltersDrawerProps) {
  const closeRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 lg:hidden">
      <button
        type="button"
        aria-label="بستن فیلترها"
        onClick={onClose}
        className="absolute inset-0 bg-overlay backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="فیلتر محصولات"
        className="absolute inset-y-0 right-0 w-[min(88vw,20rem)] overflow-y-auto border-s border-border bg-surface-1 p-5 shadow-depth-4"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-black text-foreground">
            <Filter className="size-4 text-primary" />
            فیلترها
          </h2>
          <Button
            ref={closeRef}
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            aria-label="بستن"
          >
            <X />
          </Button>
        </div>

        <ProductFiltersPanel
          filters={filters}
          activeCount={activeCount}
          setParam={setParam}
          resetFilters={resetFilters}
        />

        <Button className="mt-6 w-full" onClick={onClose}>
          نمایش {formatNumber(resultCount)} کالا
        </Button>
      </div>
    </div>
  )
}
