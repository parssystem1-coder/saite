'use client'

import {
  Check,
  GitCompareArrows,
  Heart,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { Accordion } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { PriceDisplay } from '@/components/ui/price-display'
import { ProductCard } from '@/components/ui/product-card'
import { RatingStars } from '@/components/ui/rating-stars'
import { SpecTable } from '@/components/ui/spec-table'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { BRANDS, CATEGORIES, CONDITION_LABELS } from '@/lib/constants'
import { formatNumber, formatWarranty } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { getRatingSummary, type Product } from '@/types/product'

interface Props {
  product: Product
  related: Product[]
  /** مصرفی و قطعات سازگار با این دستگاه — مسیر فروش مکمل */
  consumables: Product[]
}

type TabKey = 'specs' | 'description' | 'reviews' | 'faq'

export function ProductDetailClient({ product, related, consumables }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const toggleCompare = useCompareStore((s) => s.toggle)
  const compareItems = useCompareStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const wishlistItems = useWishlistStore((s) => s.items)
  const hydrated = useHasHydrated()

  const [activeImage, setActiveImage] = React.useState(0)
  const [quantity, setQuantity] = React.useState(1)
  const [tab, setTab] = React.useState<TabKey>('specs')

  const brand = BRANDS.find((b) => b.slug === product.brand)
  const category = CATEGORIES.find((c) => c.slug === product.category)
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'
  const warranty = formatWarranty(product.warrantyMonths)
  const rating = getRatingSummary(product)
  const inCompare = hydrated && compareItems.some((i) => i.id === product.id)
  const inWishlist = hydrated && wishlistItems.some((i) => i.id === product.id)

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'specs', label: 'مشخصات فنی' },
    { key: 'description', label: 'توضیحات' },
    { key: 'reviews', label: 'نظرات', badge: product.reviews?.length },
    { key: 'faq', label: 'سوالات متداول', badge: product.faqs?.length },
  ]

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: 'خانه', href: '/' },
          { label: category?.name ?? 'محصولات', href: `/products?category=${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* ── گالری ─────────────────────────────────────── */}
        <div className="space-y-4">
          <Card3D maxTilt={4}>
            <div className="relative aspect-square p-8">
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="layer-lift object-contain"
              />
              {product.condition === 'refurbished' && (
                <Badge variant="accent" className="absolute top-4 right-4">
                  {CONDITION_LABELS.refurbished}
                </Badge>
              )}
            </div>
          </Card3D>

          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`تصویر ${formatNumber(i + 1)}`}
                  aria-current={i === activeImage}
                  className={cn(
                    'relative size-20 overflow-hidden rounded-xl border bg-surface-1 transition-all',
                    i === activeImage
                      ? 'border-primary shadow-glow-sm'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <Image src={src} alt="" fill className="object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── اطلاعات و خرید ────────────────────────────── */}
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
                  onClick={() => {
                    setTab('reviews')
                    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' })
                  }}
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
          </div>

          {/* جعبهٔ خرید */}
          <div className="surface-3d rounded-2xl p-6" id="quote">
            <PriceDisplay
              priceType={product.priceType}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="lg"
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isBuyable && (
                <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-0/60 p-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="کاهش تعداد"
                  >
                    −
                  </Button>
                  <span
                    aria-live="polite"
                    className="w-9 text-center text-sm font-bold text-foreground"
                  >
                    {formatNumber(quantity)}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="افزایش تعداد"
                  >
                    +
                  </Button>
                </div>
              )}

              {isBuyable ? (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => addItem(product, quantity)}
                >
                  <ShoppingCart />
                  افزودن به سبد خرید
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="flex-1" asChild>
                  <Link
                    href={`/contact?subject=quote&model=${encodeURIComponent(product.model)}`}
                  >
                    درخواست استعلام قیمت
                  </Link>
                </Button>
              )}

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
      </div>

      {/* ── تب‌ها ───────────────────────────────────────── */}
      <section className="mt-16" id="product-tabs">
        <div role="tablist" aria-label="اطلاعات محصول" className="flex flex-wrap gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              id={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 px-5 py-3 text-sm font-bold transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {t.badge ? (
                <span className="rounded-full bg-surface-2 px-1.5 text-[10px] text-muted-foreground">
                  {formatNumber(t.badge)}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="pt-8"
        >
          {tab === 'specs' && <SpecTable specs={product.specs} />}

          {tab === 'description' && (
            <div className="max-w-3xl space-y-5 leading-loose text-muted-foreground">
              <p>{product.description ?? product.shortDescription}</p>

              {product.compatibleWith && product.compatibleWith.length > 0 && (
                <div className="surface-3d rounded-2xl p-5">
                  <h3 className="mb-3 text-sm font-bold text-foreground">
                    سازگار با دستگاه‌های زیر
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {product.compatibleWith.map((m) => (
                      <li key={m}>
                        <TechText className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary">
                          {m}
                        </TechText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === 'reviews' && <ReviewsPanel product={product} />}

          {tab === 'faq' &&
            (product.faqs && product.faqs.length > 0 ? (
              <Accordion
                className="max-w-3xl"
                defaultOpenId="faq-0"
                items={product.faqs.map((f, i) => ({
                  id: `faq-${i}`,
                  title: f.question,
                  content: f.answer,
                }))}
              />
            ) : (
              <EmptyPanel
                title="هنوز سوالی ثبت نشده است"
                body="اگر دربارهٔ این محصول سوالی دارید، با کارشناسان ما تماس بگیرید."
              />
            ))}
        </div>
      </section>

      {/* ── مصرفی سازگار: موتور فروش مکمل ───────────────── */}
      {consumables.length > 0 && (
        <section className="mt-16">
          <header className="mb-6">
            <h2 className="text-xl font-black text-foreground">
              مواد مصرفی و قطعات سازگار با این دستگاه
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              این اقلام مخصوص همین مدل هستند و می‌توانید همراه دستگاه سفارش دهید.
            </p>
          </header>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {consumables.map((c) => (
              <ProductCard
                key={c.id}
                product={c}
                onAddToCart={() => addItem(c)}
                onCompare={() => toggleCompare(c)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── محصولات مرتبط ───────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-black text-foreground">محصولات مرتبط</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={() => addItem(p)}
                onCompare={() => toggleCompare(p)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ReviewsPanel({ product }: { product: Product }) {
  const rating = getRatingSummary(product)
  const reviews = product.reviews ?? []

  if (!rating || reviews.length === 0) {
    return (
      <EmptyPanel
        title="هنوز نظری ثبت نشده است"
        body="اولین نفری باشید که تجربهٔ خود را از این محصول به اشتراک می‌گذارد."
      />
    )
  }

  // توزیع امتیازها برای نمودار میله‌ای
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))

  return (
    <div className="grid max-w-4xl gap-8 lg:grid-cols-[16rem_1fr]">
      {/* خلاصهٔ امتیاز */}
      <aside className="surface-3d h-fit rounded-2xl p-6 text-center">
        <p className="text-4xl font-black text-foreground">{formatNumber(rating.average)}</p>
        <RatingStars value={rating.average} size="md" className="mt-2 justify-center" />
        <p className="mt-2 text-xs text-muted-foreground">
          از مجموع {formatNumber(rating.count)} نظر
        </p>

        <ul className="mt-5 space-y-1.5">
          {distribution.map((d) => (
            <li key={d.star} className="flex items-center gap-2">
              <span className="w-3 text-[11px] text-muted-foreground">{formatNumber(d.star)}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                <span
                  className="block h-full rounded-full bg-stock-low"
                  style={{ width: `${rating.count ? (d.count / rating.count) * 100 : 0}%` }}
                />
              </span>
              <span className="w-4 text-left text-[11px] text-muted-foreground">
                {formatNumber(d.count)}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {/* فهرست نظرات */}
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="surface-3d rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {r.author.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{r.author}</p>
                  {r.verifiedPurchase && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-stock-in">
                      <Check className="size-3" />
                      خرید تأییدشده
                    </span>
                  )}
                </div>
              </div>
              <RatingStars value={r.rating} />
            </div>

            {r.title && <p className="mt-3 text-sm font-bold text-foreground">{r.title}</p>}
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface-3d max-w-2xl rounded-2xl p-8 text-center">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
      <Button variant="outline" size="sm" className="mt-5" asChild>
        <Link href="/contact">تماس با کارشناسان</Link>
      </Button>
    </div>
  )
}
