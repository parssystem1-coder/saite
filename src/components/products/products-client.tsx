'use client'

import { useQuery } from '@tanstack/react-query'
import { Filter, PackageSearch, RotateCcw } from 'lucide-react'
import * as React from 'react'
import { ProductActiveChips } from '@/components/products/product-active-chips'
import { ProductFiltersDrawer } from '@/components/products/product-filters-drawer'
import { ProductFiltersPanel } from '@/components/products/product-filters-panel'
import {
  ProductGrid,
  type CatalogViewMode,
} from '@/components/products/product-grid'
import { ProductToolbar } from '@/components/products/product-toolbar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/pagination'
import { useProductFilters } from '@/hooks/use-product-filters'
import { getProductList } from '@/lib/api'
import type { SortOption } from '@/lib/constants'
import { countActiveFilters } from '@/lib/product-filters'

const PER_PAGE = 9

/**
 * orchestration کاتالوگ.
 * فیلتر و صفحه‌بندی از لایهٔ api (getProductList).
 */
export function ProductsClient() {
  const { filters, setParam, resetFilters, page, setPage } = useProductFilters()
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)
  const [view, setView] = React.useState<CatalogViewMode>('grid')

  // کلید پایدار و سریال‌پذیر — از object خام که reference عوض می‌کند پرهیز می‌کنیم
  const queryKey = React.useMemo(
    () =>
      [
        'product-list',
        filters.q ?? '',
        filters.category ?? 'all',
        filters.brand ?? 'all',
        filters.technology ?? 'all',
        filters.usage ?? 'all',
        filters.color ?? 'all',
        filters.inStock ? '1' : '0',
        filters.minPrice ?? '',
        filters.maxPrice ?? '',
        filters.sort ?? 'newest',
        page,
        PER_PAGE,
      ] as const,
    [filters, page]
  )

  const listQuery = React.useMemo(
    () => ({
      q: filters.q,
      category: filters.category,
      brand: filters.brand,
      technology: filters.technology,
      usage: filters.usage,
      color: filters.color,
      inStock: filters.inStock,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      page,
      perPage: PER_PAGE,
    }),
    [filters, page]
  )

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => getProductList(listQuery),
    staleTime: 30_000,
    retry: 1,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const safePage = data?.page ?? page

  const activeCount = countActiveFilters(filters)
  const showSkeleton = isPending && !data

  const closeMobileFilters = React.useCallback(() => setMobileFiltersOpen(false), [])

  return (
    <>
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
            resultCount={total}
            isLoading={showSkeleton || (isFetching && !data)}
            activeFilterCount={activeCount}
            sort={(filters.sort ?? 'newest') as SortOption}
            onSortChange={(s) => setParam('sort', s)}
            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
            view={view}
            onViewChange={setView}
          />

          {activeCount > 0 && (
            <ProductActiveChips filters={filters} onRemove={setParam} />
          )}

          {isError ? (
            <div className="surface-3d rounded-2xl">
              <EmptyState
                icon={PackageSearch}
                title="بارگذاری کاتالوگ ناموفق بود"
                description={
                  error instanceof Error
                    ? error.message
                    : 'لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، صفحه را رفرش کنید.'
                }
                action={
                  <Button variant="outline" onClick={() => void refetch()}>
                    <RotateCcw />
                    تلاش دوباره
                  </Button>
                }
              />
            </div>
          ) : (
            <ProductGrid
              products={items}
              columns={3}
              view={view}
              isLoading={showSkeleton}
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
          )}

          {!showSkeleton && !isError && total > 0 && (
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
          )}
        </main>
      </div>

      <ProductFiltersDrawer
        open={mobileFiltersOpen}
        onClose={closeMobileFilters}
        filters={filters}
        activeCount={activeCount}
        resultCount={total}
        setParam={setParam}
        resetFilters={resetFilters}
      />
    </>
  )
}
