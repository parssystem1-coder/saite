'use client'

import { X } from 'lucide-react'
import { FilterChip } from '@/components/products/filters/filter-chip'
import { SelectFilter } from '@/components/products/filters/select-filter'
import { ProductSearchField } from '@/components/products/product-search-field'
import { Button } from '@/components/ui/button'
import {
  BRANDS,
  CATEGORIES,
  COLOR_SUPPORT_LABELS,
  TECHNOLOGY_LABELS,
  USAGE_CLASS_LABELS,
} from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import type { ProductFilters } from '@/lib/product-filters'

interface ProductFiltersPanelProps {
  filters: ProductFilters
  activeCount: number
  setParam: (key: string, value: string | number | boolean | null) => void
  resetFilters: () => void
}

/** پنل فیلتر کاتالوگ — مشترک دسکتاپ و کشوی موبایل */
export function ProductFiltersPanel({
  filters,
  activeCount,
  setParam,
  resetFilters,
}: ProductFiltersPanelProps) {
  return (
    <div className="space-y-6">
      {/*
        prop «key» باعث می‌شود با تغییر q از بیرون (مثلاً جستجوی هدر)،
        کامپوننت از نو ساخته شود — الگوی رسمی همگام‌سازی state با prop.
      */}
      <ProductSearchField
        key={filters.q ?? ''}
        initialValue={filters.q ?? ''}
        onSubmit={(v) => setParam('q', v || null)}
      />

      <fieldset>
        <legend className="mb-2 text-xs font-bold text-muted-foreground">دسته‌بندی</legend>
        <div className="space-y-1">
          <FilterChip
            active={!filters.category || filters.category === 'all'}
            onClick={() => setParam('category', null)}
            label="همهٔ دسته‌ها"
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.slug}
              active={filters.category === c.slug}
              onClick={() => setParam('category', c.slug)}
              label={c.name}
            />
          ))}
        </div>
      </fieldset>

      {filters.category && filters.category !== 'all' && (
        <fieldset className="border-t border-border pt-4">
          <legend className="mb-2 text-xs font-bold text-primary">
            زیردسته‌های {CATEGORIES.find((c) => c.slug === filters.category)?.name}
          </legend>
          <div className="space-y-1">
            <FilterChip
              active={!filters.subCategory || filters.subCategory === 'all'}
              onClick={() => setParam('subCategory', null)}
              label="همهٔ زیردسته‌ها"
            />
            {CATEGORIES.find((c) => c.slug === filters.category)?.subCategories?.map((sub) => (
              <FilterChip
                key={sub.slug}
                active={filters.subCategory === sub.slug}
                onClick={() => setParam('subCategory', sub.slug)}
                label={sub.name}
              />
            ))}
          </div>
        </fieldset>
      )}

      <SelectFilter
        id="brand"
        label="برند"
        value={filters.brand ?? 'all'}
        onChange={(v) => setParam('brand', v)}
        options={[
          { value: 'all', label: 'همهٔ برندها' },
          ...BRANDS.map((b) => ({ value: b.slug, label: `${b.displayName} — ${b.name}` })),
        ]}
      />

      <SelectFilter
        id="technology"
        label="فناوری چاپ"
        value={filters.technology ?? 'all'}
        onChange={(v) => setParam('technology', v)}
        options={[
          { value: 'all', label: 'همهٔ فناوری‌ها' },
          ...Object.entries(TECHNOLOGY_LABELS).map(([value, label]) => ({ value, label })),
        ]}
      />

      <SelectFilter
        id="color"
        label="نوع چاپ"
        value={filters.color ?? 'all'}
        onChange={(v) => setParam('color', v)}
        options={[
          { value: 'all', label: 'رنگی و تک‌رنگ' },
          ...Object.entries(COLOR_SUPPORT_LABELS).map(([value, label]) => ({ value, label })),
        ]}
      />

      <SelectFilter
        id="usage"
        label="ردهٔ کاربری"
        value={filters.usage ?? 'all'}
        onChange={(v) => setParam('usage', v)}
        options={[
          { value: 'all', label: 'همهٔ رده‌ها' },
          ...Object.entries(USAGE_CLASS_LABELS).map(([value, label]) => ({ value, label })),
        ]}
      />

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.inStock ?? false}
          onChange={(e) => setParam('inStock', e.target.checked)}
          className="size-4 accent-[hsl(var(--primary))]"
        />
        فقط کالاهای موجود
      </label>

      {activeCount > 0 && (
        <Button variant="secondary" className="w-full" onClick={resetFilters}>
          <X />
          حذف {formatNumber(activeCount)} فیلتر
        </Button>
      )}
    </div>
  )
}
