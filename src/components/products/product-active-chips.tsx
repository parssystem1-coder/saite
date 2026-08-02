'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  BRANDS,
  CATEGORIES,
  COLOR_SUPPORT_LABELS,
  TECHNOLOGY_LABELS,
  USAGE_CLASS_LABELS,
} from '@/lib/constants'
import type { ProductFilters } from '@/lib/product-filters'
import type { ColorSupport, PrintTechnology, UsageClass } from '@/types/product'

interface ProductActiveChipsProps {
  filters: ProductFilters
  onRemove: (key: string, value: string | number | boolean | null) => void
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="default" className="gap-1.5 py-1 ps-1.5">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`حذف فیلتر ${label}`}
        className="rounded-full p-0.5 transition-colors hover:bg-primary/25"
      >
        <X className="size-3" />
      </button>
      {label}
    </Badge>
  )
}

/** تراشه‌های فیلتر فعال زیر نوار ابزار کاتالوگ */
export function ProductActiveChips({ filters, onRemove }: ProductActiveChipsProps) {
  const activeCategory = CATEGORIES.find((c) => c.slug === filters.category)
  const chips: { key: string; label: string; clear: () => void }[] = []

  if (filters.q) {
    chips.push({
      key: 'q',
      label: `جستجو: ${filters.q}`,
      clear: () => onRemove('q', null),
    })
  }
  if (activeCategory) {
    chips.push({
      key: 'category',
      label: activeCategory.name,
      clear: () => onRemove('category', null),
    })
  }
  if (filters.brand && filters.brand !== 'all') {
    chips.push({
      key: 'brand',
      label: BRANDS.find((b) => b.slug === filters.brand)?.displayName ?? filters.brand,
      clear: () => onRemove('brand', null),
    })
  }
  if (filters.technology && filters.technology !== 'all') {
    chips.push({
      key: 'technology',
      label:
        TECHNOLOGY_LABELS[filters.technology as PrintTechnology] ?? filters.technology,
      clear: () => onRemove('technology', null),
    })
  }
  if (filters.color && filters.color !== 'all') {
    chips.push({
      key: 'color',
      label: COLOR_SUPPORT_LABELS[filters.color as ColorSupport] ?? filters.color,
      clear: () => onRemove('color', null),
    })
  }
  if (filters.usage && filters.usage !== 'all') {
    chips.push({
      key: 'usage',
      label: USAGE_CLASS_LABELS[filters.usage as UsageClass] ?? filters.usage,
      clear: () => onRemove('usage', null),
    })
  }
  if (filters.inStock) {
    chips.push({
      key: 'inStock',
      label: 'فقط موجود',
      clear: () => onRemove('inStock', false),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} onRemove={c.clear} />
      ))}
    </div>
  )
}
