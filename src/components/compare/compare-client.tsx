'use client'

import { useQuery } from '@tanstack/react-query'
import { GitCompareArrows, ShoppingCart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PriceDisplay } from '@/components/ui/price-display'
import { RatingStars } from '@/components/ui/rating-stars'
import { Skeleton } from '@/components/ui/skeleton'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { getProductsByIds } from '@/lib/api'
import { BRANDS, CONDITION_LABELS } from '@/lib/constants'
import { formatWarranty } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { getRatingSummary, type Product } from '@/types/product'

export function CompareClient() {
  const hydrated = useHasHydrated()
  const items = useCompareStore((s) => s.items)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const addItem = useCartStore((s) => s.addItem)

  const ids = items.map((i) => i.id)

  const { data: products } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => getProductsByIds(ids),
    enabled: hydrated && ids.length > 0,
  })

  /**
   * اتحاد کلیدهای مشخصات در همهٔ کالاها.
   * اگر کالایی مشخصه‌ای نداشته باشد، خط تیره نمایش داده می‌شود تا
   * جدول همیشه هم‌تراز بماند.
   */
  const specKeys = React.useMemo(() => {
    if (!products) return []
    const seen: string[] = []
    for (const p of products) {
      for (const s of p.specs) if (!seen.includes(s.key)) seen.push(s.key)
    }
    return seen
  }, [products])

  if (!hydrated) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb className="mb-8" items={[{ label: 'خانه', href: '/' }, { label: 'مقایسه' }]} />
        <div className="surface-3d rounded-2xl">
          <EmptyState
            icon={GitCompareArrows}
            title="هنوز کالایی برای مقایسه انتخاب نکرده‌اید"
            description="از صفحهٔ محصولات، روی آیکون مقایسه در کارت هر کالا بزنید تا اینجا کنار هم ببینیدشان."
            action={
              <Button asChild>
                <Link href="/products">مشاهدهٔ محصولات</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb className="mb-6" items={[{ label: 'خانه', href: '/' }, { label: 'مقایسه' }]} />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">مقایسهٔ محصولات</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            مشخصات فنی کالاهای انتخابی را کنار هم بررسی کنید.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={clear}>
          <X />
          پاک کردن همه
        </Button>
      </header>

      {!products ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="scrollbar-neon overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-3xl border-collapse text-sm">
            <caption className="sr-only">جدول مقایسهٔ مشخصات فنی محصولات انتخاب‌شده</caption>

            <thead>
              <tr>
                <th scope="col" className="w-40 bg-surface-2 p-4 text-right align-top">
                  <span className="text-xs text-muted-foreground">مشخصه</span>
                </th>
                {products.map((p) => (
                  <th key={p.id} scope="col" className="min-w-56 bg-surface-1 p-4 align-top">
                    <ProductColumn product={p} onRemove={() => remove(p.id)} onAdd={() => addItem(p)} />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <Row label="برند" surface>
                {products.map((p) => (
                  <Cell key={p.id}>
                    <TechText className="font-bold text-foreground">
                      {BRANDS.find((b) => b.slug === p.brand)?.displayName ?? p.brand}
                    </TechText>
                  </Cell>
                ))}
              </Row>

              <Row label="قیمت">
                {products.map((p) => (
                  <Cell key={p.id}>
                    <PriceDisplay priceType={p.priceType} price={p.price} size="sm" />
                  </Cell>
                ))}
              </Row>

              <Row label="موجودی" surface>
                {products.map((p) => (
                  <Cell key={p.id}>
                    <StockBadge status={p.stockStatus} size="sm" />
                  </Cell>
                ))}
              </Row>

              <Row label="امتیاز کاربران">
                {products.map((p) => {
                  const r = getRatingSummary(p)
                  return (
                    <Cell key={p.id}>
                      {r ? (
                        <RatingStars value={r.average} count={r.count} />
                      ) : (
                        <Dash />
                      )}
                    </Cell>
                  )
                })}
              </Row>

              <Row label="ضمانت" surface>
                {products.map((p) => (
                  <Cell key={p.id}>{formatWarranty(p.warrantyMonths) ?? <Dash />}</Cell>
                ))}
              </Row>

              <Row label="وضعیت">
                {products.map((p) => (
                  <Cell key={p.id}>{CONDITION_LABELS[p.condition]}</Cell>
                ))}
              </Row>

              {specKeys.map((key, i) => (
                <Row key={key} label={key} surface={i % 2 === 0}>
                  {products.map((p) => {
                    const spec = p.specs.find((s) => s.key === key)
                    return (
                      <Cell key={p.id}>
                        {spec ? (
                          spec.isTechnical ? (
                            <TechText>{spec.value}</TechText>
                          ) : (
                            spec.value
                          )
                        ) : (
                          <Dash />
                        )}
                      </Cell>
                    )
                  })}
                </Row>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductColumn({
  product,
  onRemove,
  onAdd,
}: {
  product: Product
  onRemove: () => void
  onAdd: () => void
}) {
  const buyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'

  return (
    <div className="space-y-3 text-center font-normal">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`حذف ${product.name} از مقایسه`}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>

      <Link href={`/products/${product.slug}`} className="block">
        <span className="relative mx-auto block aspect-square w-24 overflow-hidden rounded-xl bg-surface-0">
          <Image src={product.images[0]} alt={product.name} fill className="object-contain p-1.5" />
        </span>
        <TechText className="mt-2 block text-xs font-bold text-primary">{product.model}</TechText>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
          {product.name}
        </span>
      </Link>

      {buyable ? (
        <Button size="sm" className="w-full" onClick={onAdd}>
          <ShoppingCart />
          افزودن
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href="/contact">استعلام</Link>
        </Button>
      )}
    </div>
  )
}

function Row({
  label,
  children,
  surface,
}: {
  label: string
  children: React.ReactNode
  surface?: boolean
}) {
  return (
    <tr className={cn(surface ? 'bg-surface-1/60' : 'bg-surface-0/40')}>
      <th scope="row" className="p-4 text-right align-top text-xs font-bold text-muted-foreground">
        {label}
      </th>
      {children}
    </tr>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="p-4 text-center align-top text-foreground">{children}</td>
}

function Dash() {
  return <span className="text-muted-foreground/40">—</span>
}
