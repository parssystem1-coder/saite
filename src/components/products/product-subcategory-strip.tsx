'use client'

import { FolderTree } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CategorySlug } from '@/types/product'

export interface ProductSubCategoryStripProps {
  category?: CategorySlug | 'all'
  activeSubCategory?: string | 'all'
  onSelect: (subCategorySlug: string | null) => void
}

/**
 * نوار زیردسته‌های کاتالوگ (مربع‌های کوچک بالای صفحهٔ محصولات).
 *
 * وقتی کاربر روی یک دستهٔ اصلی (مثلاً پرینتر) کلیک می‌کند، این کامپوننت
 * زیردسته‌های تخصصی آن را به شکل کارت‌های سه‌بعدی در بالای صفحه نشان می‌دهد
 * تا خریدار بتواند سریعاً روی دسته‌بندی تخصصی مورد نظر فیلتر کند.
 */
export function ProductSubCategoryStrip({
  category,
  activeSubCategory,
  onSelect,
}: ProductSubCategoryStripProps) {
  if (!category || category === 'all') return null

  const catObj = CATEGORIES.find((c) => c.slug === category)
  if (!catObj || !catObj.subCategories || catObj.subCategories.length === 0) return null

  return (
    <section className="mb-8" aria-label={`زیردسته‌های ${catObj.name}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-primary uppercase">
          زیردسته‌های تخصصی {catObj.name}
        </h2>
        {activeSubCategory && activeSubCategory !== 'all' && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs font-bold text-muted-foreground transition hover:text-foreground"
          >
            نمایش همهٔ زیردسته‌ها ×
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {catObj.subCategories.map((sub) => {
          const isActive = activeSubCategory === sub.slug

          return (
            <button
              key={sub.slug}
              type="button"
              onClick={() => onSelect(isActive ? null : sub.slug)}
              aria-pressed={isActive}
              className={cn(
                'surface-3d group flex min-h-[115px] sm:min-h-[130px] flex-col items-center justify-center rounded-2xl p-3.5 sm:p-4 text-center transition-all duration-200 outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isActive
                  ? 'border-primary bg-primary/15 shadow-glow-sm ring-2 ring-primary/60'
                  : 'hover:border-primary/40 hover:bg-surface-2'
              )}
            >
              <div
                className={cn(
                  'layer-lift-sm mb-2.5 flex size-11 sm:size-14 items-center justify-center rounded-2xl transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-glow-sm'
                    : 'bg-primary/12 text-primary group-hover:bg-primary/20'
                )}
              >
                <FolderTree className="size-5 sm:size-6" />
              </div>

              <span
                className={cn(
                  'text-xs sm:text-sm font-bold leading-tight',
                  isActive ? 'text-primary' : 'text-foreground'
                )}
              >
                {sub.name}
              </span>

              <span dir="ltr" className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {sub.slug}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
