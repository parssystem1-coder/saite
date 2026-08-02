'use client'

import {
  Check,
  FileText,
  GitCompareArrows,
  Heart,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PriceDisplay } from '@/components/ui/price-display'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { RatingStars } from '@/components/ui/rating-stars'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import { formatWarranty } from '@/lib/format'
import { openWhatsAppHref, productQuoteMessage } from '@/lib/whatsapp'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { getRatingSummary, type Product } from '@/types/product'

interface ProductBuyBoxProps {
  product: Product
  /** رفتن به تب نظرات */
  onOpenReviews?: () => void
}

/**
 * ستون اطلاعات + جعبهٔ خرید صفحهٔ محصول.
 * شامل قیمت، موجودی، تعداد، CTA، مقایسه و علاقه‌مندی.
 */
export function ProductBuyBox({ product, onOpenReviews }: ProductBuyBoxProps) {
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const compareItems = useCompareStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const wishlistItems = useWishlistStore((s) => s.items)
  const hydrated = useHasHydrated()

  const [quantity, setQuantity] = React.useState(1)

  const brand = BRANDS.find((b) => b.slug === product.brand)
  const category = CATEGORIES.find((c) => c.slug === product.category)
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'
  const warranty = formatWarranty(product.warrantyMonths)
  const rating = getRatingSummary(product)
  const inCompare = hydrated && compareItems.some((i) => i.id === product.id)
  const inWishlist = hydrated && wishlistItems.some((i) => i.id === product.id)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <TechText className="text-xs font-bold tracking-widest text-primary uppercase">
            {brand?.displayName ?? product.brand}
          </TechText>
          <span className="text-muted-foreground/40">•</span>
          <Link href={`/products?category=${product.category}`}>
            <Badge variant="secondary">{category?.name}</Badge>
          </Link>
        </div>

        <h1 className="mt-3 text-2xl leading-snug font-black text-balance text-foreground md:text-3xl">
          {product.name}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <TechText className="text-sm text-muted-foreground">
            مدل {product.model} — کد {product.sku}
          </TechText>
          {rating && (
            <button
              type="button"
              onClick={onOpenReviews}
              className="transition-opacity hover:opacity-80"
            >
              <RatingStars value={rating.average} count={rating.count} />
            </button>
          )}
        </div>
      </div>

      <p className="leading-relaxed text-muted-foreground">{product.shortDescription}</p>

      <div className="flex flex-wrap items-center gap-3">
        <StockBadge status={product.stockStatus} />
        {warranty && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            {warranty}
          </span>
        )}
        {product.datasheetUrl && (
          <a
            href={product.datasheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary-bright"
          >
            <FileText className="size-4" />
            دانلود دیتاشیت
          </a>
        )}
      </div>

      <div className="surface-3d rounded-2xl p-6" id="quote">
        <PriceDisplay
          priceType={product.priceType}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="lg"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isBuyable && (
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              aria-label={`تعداد ${product.name}`}
            />
          )}

          {isBuyable ? (
            <Button size="lg" className="flex-1" onClick={() => addItem(product, quantity)}>
              <ShoppingCart />
              افزودن به سبد خرید
            </Button>
          ) : (
            <Button size="lg" variant="outline" className="flex-1" asChild>
              <Link href={`/contact?subject=quote&model=${encodeURIComponent(product.model)}`}>
                درخواست استعلام قیمت
              </Link>
            </Button>
          )}

          <Button
            size="lg"
            className="flex-1 border-0 bg-[#25D366] text-white shadow-[0_4px_0_0_#1da851,0_6px_16px_rgba(37,211,102,0.35)] hover:bg-[#20bd5a] hover:shadow-[0_4px_0_0_#1da851,0_8px_20px_rgba(37,211,102,0.45)] active:shadow-[0_1px_0_0_#1da851] sm:flex-none"
            asChild
          >
            <a
              href={openWhatsAppHref(productQuoteMessage(product.model, product.name))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="گفتگو در واتساپ برای این محصول"
            >
              <MessageCircle />
              واتساپ
            </a>
          </Button>

          <Button
            size="icon"
            variant={inCompare ? 'default' : 'secondary'}
            onClick={() => toggleCompare(product)}
            aria-pressed={inCompare}
            aria-label={inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه'}
            title={inCompare ? 'در حال مقایسه' : 'مقایسه'}
          >
            {inCompare ? <Check /> : <GitCompareArrows />}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => toggleWishlist(product)}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          >
            <Heart className={inWishlist ? 'fill-destructive text-destructive' : undefined} />
          </Button>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <Truck className="size-4 text-primary" />
            ارسال به سراسر کشور
          </li>
          <li className="flex items-center gap-2">
            <PackageCheck className="size-4 text-primary" />
            ضمانت اصالت کالا
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            پشتیبانی فنی
          </li>
        </ul>
      </div>

      {product.keyFeatures.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {product.keyFeatures.map((f) => (
            <li
              key={f}
              className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground"
            >
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
