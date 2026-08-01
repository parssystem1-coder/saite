'use client'

import { Check, GitCompareArrows, Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { BRANDS, CONDITION_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import type { ProductCardData } from '@/types/product'

interface ProductCardProps {
  product: ProductCardData
  onAddToCart?: (product: ProductCardData) => void
  onCompare?: (product: ProductCardData) => void
  onWishlist?: (product: ProductCardData) => void
  className?: string
}

/**
 * کارت محصول — بازطراحی‌شده برای دامنهٔ تجهیزات اداری.
 *
 * تفاوت کلیدی با نسخهٔ قبل: چگالی اطلاعات.
 * کارت قبلی ۳۸۴ پیکسل ارتفاع داشت و فقط ۳ داده نشان می‌داد. این کارت
 * کوتاه‌تر است اما ۷ داده دارد: برند، مدل، عنوان، ۳ ویژگی کلیدی،
 * وضعیت موجودی، قیمت و وضعیت نو/بازسازی‌شده — چون خریدار تجهیزات
 * اداری قبل از کلیک باید بتواند چند گزینه را کنار هم بسنجد.
 */
export function ProductCard({
  product,
  onAddToCart,
  onCompare,
  onWishlist,
  className,
}: ProductCardProps) {
  const brand = BRANDS.find((b) => b.slug === product.brand)
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'
  const href = `/products/${product.slug}`

  // وضعیت مقایسه فقط پس از hydration خوانده می‌شود تا HTML سرور و کلاینت یکی بماند
  const hydrated = useHasHydrated()
  const compareItems = useCompareStore((s) => s.items)
  const wishlistItems = useWishlistStore((s) => s.items)
  const inCompare = hydrated && compareItems.some((i) => i.id === product.id)
  const inWishlist = hydrated && wishlistItems.some((i) => i.id === product.id)

  return (
    <Card3D className={cn('h-full', className)}>
      <div className="flex h-full flex-col p-4">
        {/* ── تصویر ──────────────────────────────────────── */}
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

        {/* ── هویت محصول ─────────────────────────────────── */}
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

          {/* ── سه ویژگی کلیدی — همان چیزی که خریدار می‌سنجد ── */}
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

        {/* ── قیمت و کنش‌ها ──────────────────────────────── */}
        <div className="layer-lift-sm mt-4 border-t border-border pt-3">
          <PriceDisplay
            priceType={product.priceType}
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="md"
          />

          <div className="mt-3 flex items-center gap-2">
            {isBuyable ? (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAddToCart?.(product)}
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

            <Button
              size="icon-sm"
              variant={inCompare ? 'default' : 'secondary'}
              onClick={() => onCompare?.(product)}
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
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => onWishlist?.(product)}
              aria-pressed={inWishlist}
              aria-label={
                inWishlist
                  ? `حذف ${product.name} از علاقه‌مندی‌ها`
                  : `افزودن ${product.name} به علاقه‌مندی‌ها`
              }
              title={inWishlist ? 'در علاقه‌مندی‌ها' : 'علاقه‌مندی'}
            >
              <Heart className={inWishlist ? 'fill-destructive text-destructive' : undefined} />
            </Button>
          </div>
        </div>
      </div>
    </Card3D>
  )
}
