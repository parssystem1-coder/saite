'use client'

import { Check, GitCompareArrows, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { BRANDS, CONDITION_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ProductCardData } from '@/types/product'

export interface ProductCardProps {
  product: ProductCardData
  /** وضعیت فعال مقایسه — از لایهٔ دامنه پاس داده می‌شود */
  inCompare?: boolean
  /** وضعیت فعال علاقه‌مندی — از لایهٔ دامنه پاس داده می‌شود */
  inWishlist?: boolean
  onAddToCart?: (product: ProductCardData) => void
  onCompare?: (product: ProductCardData) => void
  onWishlist?: (product: ProductCardData) => void
  className?: string
  /**
   * 🆕 اگر true، تصویر با priority لود می‌شود (بدون lazy).
   *
   * روی تصاویر بالای fold صفحه اول بگذارید — معمولاً چهار کارت
   * اول grid. این باعث می‌شود Next.js آن‌ها را در HTML اولیه
   * preload کند و LCP بهبود یابد. Next خودش هشدار می‌دهد اگر
   * LCP یک تصویر بدون priority باشد.
   */
  priority?: boolean
}

/**
 * کارت محصول — pure UI، بدون store.
 *
 * وضعیت compare/wishlist و callbackها از والد (مثلاً ProductGrid) می‌آید
 * تا لایهٔ ui از منطق دامنه جدا بماند و قابل تست/Storybook باشد.
 */
export function ProductCard({
  product,
  inCompare = false,
  inWishlist = false,
  onAddToCart,
  onCompare,
  onWishlist,
  className,
  priority = false,
}: ProductCardProps) {
  const brand = BRANDS.find((b) => b.slug === product.brand)
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'
  const href = `/products/${product.slug}`

  return (
    <Card3D className={cn('h-full', className)}>
      <div className="flex h-full flex-col p-4">
        <div className="relative">
          <Link
            href={href}
            className="layer-lift-sm relative block aspect-4/3 overflow-hidden rounded-xl bg-surface-0/60"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              // priority فقط روی چند کارت اول grid — کاهش LCP
              priority={priority}
            />
          </Link>

          <div className="absolute top-2 left-2 z-10">
            <StockBadge status={product.stockStatus} size="sm" />
          </div>

          {product.condition === 'refurbished' && (
            <span className="absolute top-2 right-2 z-10 rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
              {CONDITION_LABELS.refurbished}
            </span>
          )}
        </div>

        <div className="layer-lift-sm mt-3 flex-1">
          <div className="flex items-center justify-between gap-2">
            <TechText className="text-[10px] font-bold tracking-widest text-primary uppercase">
              {brand?.displayName ?? product.brand}
            </TechText>
          </div>

          <Link href={href} className="mt-1 block">
            <TechText className="block text-sm font-bold text-foreground transition-colors group-hover:text-primary">
              {product.model}
            </TechText>
            <h3 className="text-balance-fa mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {product.name}
            </h3>
          </Link>

          {product.keyFeatures.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {product.keyFeatures.slice(0, 3).map((f) => (
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

        <div className="relative z-20 mt-4 border-t border-border pt-3">
          <PriceDisplay
            priceType={product.priceType}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="md"
          />

          <div className="relative z-20 mt-3 flex items-center gap-2">
            {isBuyable ? (
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAddToCart?.(product)
                }}
                aria-label={`افزودن ${product.name} به سبد خرید`}
              >
                <ShoppingCart />
                افزودن به سبد
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                asChild
                aria-label={`استعلام قیمت ${product.name}`}
              >
                <Link href={`${href}#quote`}>استعلام قیمت</Link>
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
                aria-label={
                  inCompare
                    ? `حذف ${product.name} از مقایسه`
                    : `افزودن ${product.name} به مقایسه`
                }
                title={inCompare ? 'در حال مقایسه' : 'مقایسه'}
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
                aria-label={
                  inWishlist
                    ? `حذف ${product.name} از علاقه‌مندی‌ها`
                    : `افزودن ${product.name} به علاقه‌مندی‌ها`
                }
                title={inWishlist ? 'در علاقه‌مندی‌ها' : 'علاقه‌مندی'}
              >
                <Heart
                  className={inWishlist ? 'fill-destructive text-destructive' : undefined}
                />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card3D>
  )
}
