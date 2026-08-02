'use client'

import { useQuery } from '@tanstack/react-query'
import { GitCompareArrows, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { CompareTable } from '@/components/compare/compare-table'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { getProductsByIds } from '@/lib/api'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'

/**
 * صفحهٔ مقایسه — orchestration.
 * جدول و ستون‌ها در ماژول‌های جدا هستند.
 */
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
   * اگر کالایی مشخصه‌ای نداشته باشد، خط تیره نمایش داده می‌شود.
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
        <Breadcrumb
          className="mb-8"
          items={[{ label: 'خانه', href: '/' }, { label: 'مقایسه' }]}
        />
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
      <Breadcrumb
        className="mb-6"
        items={[{ label: 'خانه', href: '/' }, { label: 'مقایسه' }]}
      />

      <SectionHeader
        as="h1"
        title="مقایسهٔ محصولات"
        description="مشخصات فنی کالاهای انتخابی را کنار هم بررسی کنید."
        action={
          <Button variant="secondary" size="sm" onClick={clear}>
            <X />
            پاک کردن همه
          </Button>
        }
      />

      {!products ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <CompareTable
          products={products}
          specKeys={specKeys}
          onRemove={remove}
          onAdd={addItem}
        />
      )}
    </div>
  )
}
