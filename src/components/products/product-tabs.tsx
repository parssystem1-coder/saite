'use client'

import * as React from 'react'
import { ProductEmptyPanel } from '@/components/products/product-empty-panel'
import { ProductReviewsPanel } from '@/components/products/product-reviews-panel'
import { Accordion } from '@/components/ui/accordion'
import { SpecTable } from '@/components/ui/spec-table'
import { TabPanel, Tabs, type TabItem } from '@/components/ui/tabs'
import { TechText } from '@/components/ui/tech-text'
import type { Product } from '@/types/product'

export type ProductTabKey = 'specs' | 'description' | 'reviews' | 'faq'

const VALID_TABS = new Set<ProductTabKey>(['specs', 'description', 'reviews', 'faq'])

function parseTabHash(hash: string): ProductTabKey | null {
  const raw = hash.replace(/^#/, '')
  return VALID_TABS.has(raw as ProductTabKey) ? (raw as ProductTabKey) : null
}

interface ProductTabsProps {
  product: Product
  /** کنترل خارجی از orchestration — مثلاً کلیک ستاره */
  activeTab: ProductTabKey
  onTabChange: (tab: ProductTabKey) => void
}

/**
 * تب‌های اطلاعات محصول.
 * hash URL (#reviews و …) با تب همگام است تا deep-link کار کند.
 */
export function ProductTabs({ product, activeTab, onTabChange }: ProductTabsProps) {
  // همگام‌سازی با hash هنگام mount و دکمهٔ Back مرورگر
  React.useEffect(() => {
    const applyFromLocation = () => {
      const fromHash = parseTabHash(window.location.hash)
      if (fromHash) onTabChange(fromHash)
    }

    applyFromLocation()
    window.addEventListener('hashchange', applyFromLocation)
    return () => window.removeEventListener('hashchange', applyFromLocation)
    // فقط یک‌بار subscribe؛ onTabChange پایدار از والد است
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + hashchange only
  }, [])

  const setTab = (next: ProductTabKey) => {
    onTabChange(next)
    if (typeof window !== 'undefined') {
      const url = `${window.location.pathname}${window.location.search}#${next}`
      window.history.replaceState(null, '', url)
    }
  }

  const items: TabItem<ProductTabKey>[] = [
    { key: 'specs', label: 'مشخصات فنی' },
    { key: 'description', label: 'توضیحات' },
    { key: 'reviews', label: 'نظرات', badge: product.reviews?.length },
    { key: 'faq', label: 'سوالات متداول', badge: product.faqs?.length },
  ]

  return (
    <section className="mt-16" id="product-tabs">
      <Tabs
        items={items}
        value={activeTab}
        onValueChange={setTab}
        idPrefix="panel"
        aria-label="اطلاعات محصول"
      />

      <TabPanel id={`panel-${activeTab}`} tabId={`tab-${activeTab}`} active>
        {activeTab === 'specs' && <SpecTable specs={product.specs} />}

        {activeTab === 'description' && (
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

        {activeTab === 'reviews' && <ProductReviewsPanel product={product} />}

        {activeTab === 'faq' &&
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
            <ProductEmptyPanel
              title="هنوز سوالی ثبت نشده است"
              body="اگر دربارهٔ این محصول سوالی دارید، با کارشناسان ما تماس بگیرید."
            />
          ))}
      </TabPanel>
    </section>
  )
}
