'use client'

import { useQuery } from '@tanstack/react-query'
import { Filter, PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/ui/product-card'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { useProductFilters } from '@/hooks/use-product-filters'
import { getProducts } from '@/lib/api'
import {
  BRANDS,
  CATEGORIES,
  COLOR_SUPPORT_LABELS,
  SORT_OPTIONS,
  TECHNOLOGY_LABELS,
  USAGE_CLASS_LABELS,
  type SortOption,
} from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { applyFilters, countActiveFilters } from '@/lib/product-filters'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'

const PER_PAGE = 9

export function ProductsClient() {
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
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

  const filterPanel = (
    <div className="space-y-6">
      {/*
        prop «key» باعث می‌شود با تغییر q از بیرون (مثلاً جستجوی هدر)،
        کامپوننت از نو ساخته شود. این الگوی رسمی React برای همگام‌سازی
        state با prop است و جایگزین setState داخل useEffect می‌شود.
      */}
      <SearchField
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

  return (
    <div className="container mx-auto px-4 py-10">
      {/* عنوان پویا بر اساس دستهٔ انتخاب‌شده */}
      <header className="mb-8">
        <h1 className="text-2xl font-black text-foreground md:text-3xl">
          {activeCategory ? activeCategory.name : 'کاتالوگ محصولات'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {activeCategory
            ? activeCategory.description
            : 'پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی با ضمانت اصالت کالا.'}
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ── فیلترها: دسکتاپ ────────────────────────────── */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="surface-3d sticky top-28 rounded-2xl p-5">
            <h2 className="mb-5 flex items-center gap-2 text-base font-black text-foreground">
              <Filter className="size-4 text-primary" />
              فیلترها
            </h2>
            {filterPanel}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal />
                فیلترها
                {activeCount > 0 && (
                  <span className="ms-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {formatNumber(activeCount)}
                  </span>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'در حال بارگذاری…' : `${formatNumber(visible.length)} کالا`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-xs font-bold text-muted-foreground">
                مرتب‌سازی
              </label>
              <select
                id="sort"
                value={filters.sort ?? 'newest'}
                onChange={(e) => setParam('sort', e.target.value as SortOption)}
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

          {/* تراشه‌های فیلتر فعال */}
          {activeCount > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {filters.q && (
                <ActiveChip label={`جستجو: ${filters.q}`} onRemove={() => setParam('q', null)} />
              )}
              {activeCategory && (
                <ActiveChip
                  label={activeCategory.name}
                  onRemove={() => setParam('category', null)}
                />
              )}
              {filters.brand && filters.brand !== 'all' && (
                <ActiveChip
                  label={BRANDS.find((b) => b.slug === filters.brand)?.displayName ?? filters.brand}
                  onRemove={() => setParam('brand', null)}
                />
              )}
              {filters.inStock && (
                <ActiveChip label="فقط موجود" onRemove={() => setParam('inStock', false)} />
              )}
            </div>
          )}

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
                description="با این فیلترها نتیجه‌ای پیدا نکردیم. عبارت جستجو یا برند را تغییر دهید."
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    حذف همهٔ فیلترها
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={() => addItem(p)}
                    onCompare={() => toggleCompare(p)}
                    onWishlist={() => toggleWishlist(p)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── فیلترها: کشوی موبایل ───────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            aria-label="بستن فیلترها"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 w-[min(88vw,20rem)] overflow-y-auto border-s border-border bg-surface-1 p-5 shadow-depth-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                <Filter className="size-4 text-primary" />
                فیلترها
              </h2>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="بستن"
              >
                <X />
              </Button>
            </div>
            {filterPanel}
            <Button className="mt-6 w-full" onClick={() => setMobileFiltersOpen(false)}>
              نمایش {formatNumber(visible.length)} کالا
            </Button>
          </div>
        </div>
      )}
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

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none focus-visible:border-primary/60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
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

function SearchField({
  initialValue,
  onSubmit,
}: {
  initialValue: string
  onSubmit: (value: string) => void
}) {
  const [draft, setDraft] = React.useState(initialValue)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(draft.trim())
      }}
      className="space-y-2"
    >
      <label htmlFor="q" className="text-xs font-bold text-muted-foreground">
        جستجو
      </label>
      <div className="relative">
        <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="q"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="نام، مدل یا کد کالا…"
          className="pr-10"
        />
      </div>
    </form>
  )
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav aria-label="صفحه‌بندی نتایج" className="mt-10 flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        قبلی
      </Button>

      <ul className="flex items-center gap-1.5">
        {pages.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`صفحهٔ ${formatNumber(p)}`}
              className={cn(
                'size-9 rounded-lg text-sm font-bold transition-all',
                p === page
                  ? 'bg-primary text-primary-foreground shadow-glow-sm'
                  : 'border border-border bg-surface-1 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {formatNumber(p)}
            </button>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        بعدی
      </Button>
    </nav>
  )
}
