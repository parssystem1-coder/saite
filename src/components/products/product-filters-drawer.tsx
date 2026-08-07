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
 * کشوی فیلتر موبایل — focus-trap کامل، Escape، قفل اسکرول و aria-hidden.
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
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const previouslyFocused = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    // جلوگیری از پرش layout هنگام مخفی شدن scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    // مخفی کردن محتوای پشت dialog از screen reader
    const main = document.getElementById('main-content')
    const prevAriaHidden = main?.getAttribute('aria-hidden')
    main?.setAttribute('aria-hidden', 'true')

    const getFocusable = () =>
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable()
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', onKey)
    // فوکوس اولیه به دکمه بستن
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
      if (main) {
        if (prevAriaHidden == null) main.removeAttribute('aria-hidden')
        else main.setAttribute('aria-hidden', prevAriaHidden)
      }
      window.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus()
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
        ref={dialogRef}
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
