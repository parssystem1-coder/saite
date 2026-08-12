'use client'

import { useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { formatPriceWithUnit } from '@/lib/format'
import { useCartStore } from '@/store/cart-store'
import type { ProductCardData } from '@/types/product'

/**
 * کارت فشردهٔ محصول در گفتگوی مشاور.
 *
 * ── مرز امنیتی ───────────────────────────────────────────────
 * دادهٔ این کارت فقط از `done` رویداد SSE می‌آید — یعنی سرور قبلاً
 * شناسه‌ها را با دیتابیس اعتبارسنجی کرده. «افزودن به سبد» یک اکشن
 * کاملاً کلاینتی روی استور cart است؛ AI هیچ نقشی در آن ندارد
 * (قرارداد امنیتی: AI فقط توصیه می‌کند، کاربر تصمیم می‌گیرد).
 */
export function ChatProductCard({ product }: { product: ProductCardData }) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const href = `/products/${product.slug}`
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'

  const handleAdd = () => {
    addItem(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1_800)
  }

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-surface-1/70 p-3">
      <Link
        href={href}
        className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-surface-0/60"
        aria-label={`مشاهده ${product.name}`}
      >
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="64px"
            className="object-contain p-1"
          />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={href} className="block">
          <TechText className="text-[10px] font-bold tracking-widest text-primary uppercase">
            {product.brand} · {product.model}
          </TechText>
          <span className="mt-0.5 block truncate text-xs font-bold text-foreground">
            {product.name}
          </span>
        </Link>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <StockBadge status={product.stockStatus} size="sm" />
          {isBuyable && product.price !== undefined ? (
            <span className="text-xs font-black text-foreground">
              {formatPriceWithUnit(product.price)}
            </span>
          ) : (
            <Link href={href} className="text-[10px] font-semibold text-primary hover:underline">
              استعلام قیمت
            </Link>
          )}
        </div>

        {isBuyable && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-8 flex-1 text-[11px]" onClick={handleAdd} disabled={added}>
              {added ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
              {added ? 'به سبد اضافه شد' : 'افزودن به سبد'}
            </Button>
            <Link href={href}>
              <Button variant="secondary" size="sm" className="h-8 text-[11px]">
                مشاهده
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
