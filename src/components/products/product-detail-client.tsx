'use client'

import * as React from 'react'
import { ProductBuyBox } from '@/components/products/product-buy-box'
import { ProductGallery } from '@/components/products/product-gallery'
import { ProductGrid } from '@/components/products/product-grid'
import { ProductTabs, type ProductTabKey } from '@/components/products/product-tabs'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { SectionHeader } from '@/components/ui/section-header'
import { CATEGORIES } from '@/lib/constants'
import type { Product } from '@/types/product'

interface Props {
  product: Product
  related: Product[]
  /** مصرفی و قطعات سازگار با این دستگاه — مسیر فروش مکمل */
  consumables: Product[]
}

function initialTabFromHash(): ProductTabKey {
  if (typeof window === 'undefined') return 'specs'
  const raw = window.location.hash.replace(/^#/, '')
  if (raw === 'specs' || raw === 'description' || raw === 'reviews' || raw === 'faq') {
    return raw
  }
  return 'specs'
}

/**
 * orchestration صفحهٔ جزئیات محصول.
 * گالری، خرید، تب‌ها و بخش‌های مکمل در ماژول‌های جدا هستند.
 */
export function ProductDetailClient({ product, related, consumables }: Props) {
  const [activeImage, setActiveImage] = React.useState(0)
  const [tab, setTab] = React.useState<ProductTabKey>(initialTabFromHash)

  const category = CATEGORIES.find((c) => c.slug === product.category)

  const openReviews = React.useCallback(() => {
    setTab('reviews')
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}${window.location.search}#reviews`
      window.history.replaceState(null, '', url)
    }
    document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[
          { label: 'خانه', href: '/' },
          {
            label: category?.name ?? 'محصولات',
            href: `/products?category=${product.category}`,
          },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          name={product.name}
          condition={product.condition}
          activeIndex={activeImage}
          onSelect={setActiveImage}
        />

        <ProductBuyBox product={product} onOpenReviews={openReviews} />
      </div>

      <ProductTabs product={product} activeTab={tab} onTabChange={setTab} />

      {consumables.length > 0 && (
        <section className="mt-16">
          <SectionHeader
            title="مواد مصرفی و قطعات سازگار با این دستگاه"
            description="این اقلام مخصوص همین مدل هستند و می‌توانید همراه دستگاه سفارش دهید."
            className="mb-6"
          />
          <ProductGrid products={consumables} columns={4} />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="محصولات مرتبط" className="mb-6" />
          <ProductGrid products={related} columns={4} />
        </section>
      )}
    </div>
  )
}
