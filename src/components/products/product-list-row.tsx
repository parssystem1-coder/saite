'use client'

import { Check, GitCompareArrows, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { BRANDS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ProductCardData } from '@/types/product'

export interface ProductListRowProps {
  product: ProductCardData
  inCompare?: boolean
  inWishlist?: boolean
  onAddToCart?: (product: ProductCardData) => void
  onCompare?: (product: ProductCardData) => void
  onWishlist?: (product: ProductCardData) => void
  className?: string
}

/**
 * ردیف فشردهٔ کاتالوگ — برای اسکن سریع کارشناس خرید B2B.
 * pure UI مثل ProductCard.
 */
export function ProductListRow({
  product,
  inCompare = false,
  inWishlist = false,
  onAddToCart,
  onCompare,
  onWishlist,
  className,
}: ProductListRowProps) {
  const brand = BRANDS.find((b) => b.slug === product.brand)
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'
  const href = `/products/${product.slug}`

  return (
    <article
      className={cn(
        'surface-3d flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-5',
        className
      )}
    >
      <Link
        href={href}
        className="relative mx-auto size-24 shrink-0 overflow-hidden rounded-xl bg-surface-0/60 sm:mx-0"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="96px"
          className="object-contain p-1.5"
        />
      </Link>

      <div className="min-w-0 flex-1 space-y-1.5 text-center sm:text-right">
        <TechText className="text-[10px] font-bold tracking-widest text-primary uppercase">
          {brand?.displayName ?? product.brand}
        </TechText>
        <Link href={href} className="block">
          <TechText className="text-sm font-bold text-foreground hover:text-primary">
            {product.model}
          </TechText>
          <h3 className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.name}
          </h3>
        </Link>
        {product.keyFeatures.length > 0 && (
          <ul className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {product.keyFeatures.slice(0, 4).map((f) => (
              <li
                key={f}
                className="rounded-md border border-border bg-surface-0/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end sm:ps-2">
        <StockBadge status={product.stockStatus} size="sm" />
        <PriceDisplay
          priceType={product.priceType}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
          className="items-center sm:items-end"
        />
        <div className="flex items-center gap-2">
          {isBuyable ? (
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAddToCart?.(product)
              }}
              aria-label={`افزودن ${product.name} به سبد`}
            >
              <ShoppingCart />
              سبد
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href={`${href}#quote`}>استعلام</Link>
            </Button>
          )}
          {onCompare && (
            <Button
              type="button"
              size="icon-sm"
              variant={inCompare ? 'default' : 'secondary'}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCompare(product)
              }}
              aria-pressed={inCompare}
              aria-label={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
            >
              {inCompare ? <Check /> : <GitCompareArrows />}
            </Button>
          )}
          {onWishlist && (
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onWishlist(product)
              }}
              aria-pressed={inWishlist}
              aria-label={inWishlist ? 'حذف از علاقه‌مندی' : 'علاقه‌مندی'}
            >
              <Heart className={inWishlist ? 'fill-destructive text-destructive' : undefined} />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
