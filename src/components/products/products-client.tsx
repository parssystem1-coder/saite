'use client'

import { useQuery } from '@tanstack/react-query'
import { Filter, PackageSearch, Search } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/ui/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { getProducts } from '@/lib/api'
import { BRANDS, CATEGORIES, SORT_OPTIONS, type SortOption } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import type { CategorySlug } from '@/types/product'

export function ProductsClient() {
  const addItem = useCartStore((s) => s.addItem)

  const [searchTerm, setSearchTerm] = React.useState('')
  const [category, setCategory] = React.useState<CategorySlug | 'all'>('all')
  const [brand, setBrand] = React.useState<string | 'all'>('all')
  const [inStockOnly, setInStockOnly] = React.useState(false)
  const [sort, setSort] = React.useState<SortOption>('newest')

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const visible = React.useMemo(() => {
    if (!products) return []
    const q = searchTerm.trim().toLowerCase()

    const filtered = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || p.category === category
      const matchesBrand = brand === 'all' || p.brand === brand
      const matchesStock = !inStockOnly || p.stockStatus !== 'out_of_stock'
      return matchesSearch && matchesCategory && matchesBrand && matchesStock
    })

    // کالای استعلامی قیمت ندارد؛ در مرتب‌سازی قیمتی به انتها می‌رود
    const byPrice = (v?: number, fallback = Number.MAX_SAFE_INTEGER) => v ?? fallback

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return byPrice(a.price) - byPrice(b.price)
        case 'price_desc':
          return byPrice(b.price, -1) - byPrice(a.price, -1)
        case 'best_selling':
          return Number(b.isBestSeller ?? false) - Number(a.isBestSeller ?? false)
        default:
          return b.createdAt.localeCompare(a.createdAt)
      }
    })
  }, [products, searchTerm, category, brand, inStockOnly, sort])

  const resetFilters = () => {
    setSearchTerm('')
    setCategory('all')
    setBrand('all')
    setInStockOnly(false)
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ── فیلترها ────────────────────────────────────── */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="surface-3d sticky top-6 space-y-6 rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-base font-black text-foreground">
              <Filter className="size-4 text-primary" />
              فیلترها
            </h2>

            <div className="space-y-2">
              <label htmlFor="q" className="text-xs font-bold text-muted-foreground">
                جستجو
              </label>
              <div className="relative">
                <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام یا مدل دستگاه..."
                  className="pr-10"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-bold text-muted-foreground">دسته‌بندی</legend>
              <div className="space-y-1">
                <FilterChip
                  active={category === 'all'}
                  onClick={() => setCategory('all')}
                  label="همهٔ دسته‌ها"
                />
                {CATEGORIES.map((c) => (
                  <FilterChip
                    key={c.slug}
                    active={category === c.slug}
                    onClick={() => setCategory(c.slug)}
                    label={c.name}
                  />
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="brand" className="text-xs font-bold text-muted-foreground">
                برند
              </label>
              <select
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none focus-visible:border-primary/60"
              >
                <option value="all">همهٔ برندها</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.displayName} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="size-4 accent-[hsl(var(--primary))]"
              />
              فقط کالاهای موجود
            </label>

            <Button variant="secondary" className="w-full" onClick={resetFilters}>
              حذف فیلترها
            </Button>
          </div>
        </aside>

        {/* ── شبکهٔ محصولات ──────────────────────────────── */}
        <main className="flex-1">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-foreground">کاتالوگ محصولات</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLoading ? 'در حال بارگذاری…' : `${formatNumber(visible.length)} کالا یافت شد`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-xs font-bold text-muted-foreground">
                مرتب‌سازی
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="h-10 rounded-xl border border-border bg-input px-3 text-sm outline-none focus-visible:border-primary/60"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="surface-3d rounded-2xl">
              <EmptyState
                icon={PackageSearch}
                title="محصولی یافت نشد"
                description="با این فیلترها نتیجه‌ای پیدا نکردیم. می‌توانید عبارت جستجو یا برند را تغییر دهید."
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    حذف همهٔ فیلترها
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={() => addItem(p)} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'w-full rounded-xl px-3 py-2 text-right text-sm transition-all',
        active
          ? 'bg-primary/15 font-bold text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}

