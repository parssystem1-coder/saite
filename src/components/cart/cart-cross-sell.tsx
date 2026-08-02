'use client'

import { useQueries } from '@tanstack/react-query'
import { Droplets } from 'lucide-react'
import * as React from 'react'
import { ProductGrid } from '@/components/products/product-grid'
import { SectionHeader } from '@/components/ui/section-header'
import { getCompatibleItems } from '@/lib/api'
import type { CartItem } from '@/store/cart-store'
import type { Product } from '@/types/product'

interface CartCrossSellProps {
  items: CartItem[]
}

/**
 * پیشنهاد مصرفی سازگار با دستگاه‌های داخل سبد — موتور تبدیل تکرارشونده.
 */
export function CartCrossSell({ items }: CartCrossSellProps) {
  const models = React.useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const item of items) {
      const m = item.model.trim()
      if (m && !seen.has(m)) {
        seen.add(m)
        list.push(m)
      }
    }
    return list
  }, [items])

  const cartIds = React.useMemo(() => new Set(items.map((i) => i.id)), [items])

  const results = useQueries({
    queries: models.map((model) => ({
      queryKey: ['compatible', model] as const,
      queryFn: () => getCompatibleItems(model),
      staleTime: 60_000,
    })),
  })

  const suggestions = React.useMemo(() => {
    const map = new Map<string, Product>()
    for (const r of results) {
      for (const p of r.data ?? []) {
        if (!cartIds.has(p.id) && !map.has(p.id)) map.set(p.id, p)
      }
    }
    return [...map.values()].slice(0, 4)
  }, [results, cartIds])

  const loading = results.some((r) => r.isLoading)
  if (!loading && suggestions.length === 0) return null

  return (
    <section className="mt-12 border-t border-border pt-10">
      <SectionHeader
        title="مواد مصرفی پیشنهادی برای اقلام سبد"
        description="بر اساس مدل دستگاه‌هایی که انتخاب کرده‌اید — خرید همراه، توقف بعدی را کم می‌کند."
        className="mb-6"
      />
      {loading ? (
        <ProductGrid products={[]} columns={4} isLoading skeletonCount={4} />
      ) : (
        <>
          <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Droplets className="size-3.5 text-primary" aria-hidden="true" />
            تونر، کارتریج و قطعات سازگار
          </p>
          <ProductGrid products={suggestions} columns={4} />
        </>
      )}
    </section>
  )
}
