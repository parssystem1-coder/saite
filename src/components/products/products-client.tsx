'use client'

import { useQuery } from '@tanstack/react-query'
import { Filter, PackageSearch } from 'lucide-react'
import * as React from 'react'
import { ProductActiveChips } from '@/components/products/product-active-chips'
import { ProductFiltersDrawer } from '@/components/products/product-filters-drawer'
import { ProductFiltersPanel } from '@/components/products/product-filters-panel'
import { ProductGrid } from '@/components/products/product-grid'
import { ProductToolbar } from '@/components/products/product-toolbar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { SectionHeader } from '@/components/ui/section-header'
import { useProductFilters } from '@/hooks/use-product-filters'
import { getProducts } from '@/lib/api'
import { CATEGORIES, type SortOption } from '@/lib/constants'
import { applyFilters, countActiveFilters } from '@/lib/product-filters'

const PER_PAGE = 9

/**
 * orchestration کاتالوگ — فیلتر، صفحه‌بندی و گرید.
 * کامپوننت‌های UI فیلتر/گرید در فایل‌های جدا هستند.
 */
export function ProductsClient() {
  const { filters, setParam, resetFilters, page, setPage } = useProductFilters()
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const visible = React.useMemo(
    () => (products ? applyFilters(products, filters) : []),
    [products, filters]
  )

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const activeCount = countActiveFilters(filters)
  const activeCategory = CATEGORIES.find((c) => c.slug === filters.category)

  const closeMobileFilters = React.useCallback(() => setMobileFiltersOpen(false), [])

  return (
    <div className="container mx-auto px-4 py-10">
      <SectionHeader
        as="h1"
        title={activeCategory ? activeCategory.name : 'کاتالوگ محصولات'}
        description={
          activeCategory
            ? activeCategory.description
            : 'پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی با ضمانت اصالت کالا.'
        }
        className="mb-8"
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="surface-3d sticky top-28 rounded-2xl p-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-black text-foreground">
              <Filter className="size-4 text-primary" />
              فیلترها
            </h2>
            <ProductFiltersPanel
              filters={filters}
              activeCount={activeCount}
              setParam={setParam}
              resetFilters={resetFilters}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <ProductToolbar
            resultCount={visible.length}
            isLoading={isLoading}
            activeFilterCount={activeCount}
            sort={(filters.sort ?? 'newest') as SortOption}
            onSortChange={(s) => setParam('sort', s)}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
          />

          {activeCount > 0 && (
            <ProductActiveChips filters={filters} onRemove={setParam} />
          )}

          <ProductGrid
            products={pageItems}
            columns={3}
            isLoading={isLoading}
            skeletonCount={6}
            empty={
              <div className="surface-3d rounded-2xl">
                <EmptyState
                  icon={PackageSearch}
                  title="محصولی یافت نشد"
                  description="با این فیلترها نتیجه‌ای پیدا نکردیم. عبارت جستجو یا برند را تغییر دهید."
                  action={
                    <Button variant="outline" onClick={resetFilters}>
                      حذف همهٔ فیلترها
                    </Button>
                  }
                />
              </div>
            }
          />

          {!isLoading && visible.length > 0 && (
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          )}
        </main>
      </div>

      <ProductFiltersDrawer
        open={mobileFiltersOpen}
        onClose={closeMobileFilters}
        filters={filters}
        activeCount={activeCount}
        resultCount={visible.length}
        setParam={setParam}
        resetFilters={resetFilters}
      />
    </div>
  )
}
