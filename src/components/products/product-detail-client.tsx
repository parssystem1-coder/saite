'use client'

import { GitCompareArrows, Heart, PackageCheck, ShieldCheck, ShoppingCart, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { PriceDisplay } from '@/components/ui/price-display'
import { ProductCard } from '@/components/ui/product-card'
import { SpecTable } from '@/components/ui/spec-table'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { BRANDS, CATEGORIES, CONDITION_LABELS } from '@/lib/constants'
import { formatWarranty } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import type { Product } from '@/types/product'

interface Props {
  product: Product
  related: Product[]
}

export function ProductDetailClient({ product, related }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [activeImage, setActiveImage] = React.useState(0)
  const [tab, setTab] = React.useState<'specs' | 'features'>('specs')

  const brand = BRANDS.find((b) => b.slug === product.brand)
  const category = CATEGORIES.find((c) => c.slug === product.category)
  const isBuyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'
  const warranty = formatWarranty(product.warrantyMonths)

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
            </div>
          </Card3D>

          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`تصویر ${i + 1}`}
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

        {/* ── اطلاعات ───────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <TechText className="text-xs font-bold tracking-widest text-primary uppercase">
                {brand?.displayName ?? product.brand}
              </TechText>
              <span className="text-muted-foreground/40">•</span>
              <Badge variant="secondary">{category?.name}</Badge>
              {product.condition === 'refurbished' && (
                <Badge variant="accent">{CONDITION_LABELS.refurbished}</Badge>
              )}
            </div>

            <h1 className="mt-3 text-2xl leading-snug font-black text-balance text-foreground md:text-3xl">
              {product.name}
            </h1>

            <TechText className="mt-2 block text-sm text-muted-foreground">
              مدل {product.model} — کد {product.sku}
            </TechText>
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

          {/* ── جعبهٔ خرید ──────────────────────────────── */}
          <div className="surface-3d rounded-2xl p-6" id="quote">
            <PriceDisplay
              priceType={product.priceType}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              size="lg"
            />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isBuyable ? (
                <Button size="lg" className="flex-1" onClick={() => addItem(product)}>
                  <ShoppingCart />
                  افزودن به سبد خرید
                </Button>
              ) : (
                <Button size="lg" variant="outline" className="flex-1" asChild>
                  <Link href="/contact">درخواست استعلام قیمت</Link>
                </Button>
              )}

              <Button size="icon" variant="secondary" aria-label="افزودن به مقایسه" title="مقایسه">
                <GitCompareArrows />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                aria-label="افزودن به علاقه‌مندی‌ها"
                title="علاقه‌مندی"
              >
                <Heart />
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

          {/* ── ویژگی‌های کلیدی ─────────────────────────── */}
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
      <section className="mt-16">
        <div role="tablist" className="flex gap-2 border-b border-border">
          {(
            [
              ['specs', 'مشخصات فنی'],
              ['features', 'توضیحات'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                '-mb-px border-b-2 px-5 py-3 text-sm font-bold transition-colors',
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pt-8">
          {tab === 'specs' ? (
            <SpecTable specs={product.specs} />
          ) : (
            <div className="max-w-3xl space-y-4 leading-loose text-muted-foreground">
              <p>{product.description ?? product.shortDescription}</p>
              {product.compatibleWith && product.compatibleWith.length > 0 && (
                <div className="surface-3d rounded-2xl p-5">
                  <h4 className="mb-3 text-sm font-bold text-foreground">
                    سازگار با دستگاه‌های زیر
                  </h4>
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
        </div>
      </section>

      {/* ── محصولات مرتبط ───────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-xl font-black text-foreground">محصولات مرتبط</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={() => addItem(p)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
