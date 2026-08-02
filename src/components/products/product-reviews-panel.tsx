'use client'

import { Check } from 'lucide-react'
import { ProductEmptyPanel } from '@/components/products/product-empty-panel'
import { RatingStars } from '@/components/ui/rating-stars'
import { formatNumber } from '@/lib/format'
import { getRatingSummary, type Product } from '@/types/product'

interface ProductReviewsPanelProps {
  product: Product
}

/** پنل نظرات با خلاصهٔ امتیاز و توزیع ستاره */
export function ProductReviewsPanel({ product }: ProductReviewsPanelProps) {
  const rating = getRatingSummary(product)
  const reviews = product.reviews ?? []

  if (!rating || reviews.length === 0) {
    return (
      <ProductEmptyPanel
        title="هنوز نظری ثبت نشده است"
        body="اولین نفری باشید که تجربهٔ خود را از این محصول به اشتراک می‌گذارد."
      />
    )
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))

  return (
    <div className="grid max-w-4xl gap-8 lg:grid-cols-[16rem_1fr]">
      <aside className="surface-3d h-fit rounded-2xl p-6 text-center">
        <p className="text-4xl font-black text-foreground">{formatNumber(rating.average)}</p>
        <RatingStars value={rating.average} size="md" className="mt-2 justify-center" />
        <p className="mt-2 text-xs text-muted-foreground">
          از مجموع {formatNumber(rating.count)} نظر
        </p>

        <ul className="mt-5 space-y-1.5">
          {distribution.map((d) => (
            <li key={d.star} className="flex items-center gap-2">
              <span className="w-3 text-[11px] text-muted-foreground">
                {formatNumber(d.star)}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-0">
                <span
                  className="block h-full rounded-full bg-stock-low"
                  style={{
                    width: `${rating.count ? (d.count / rating.count) * 100 : 0}%`,
                  }}
                />
              </span>
              <span className="w-4 text-left text-[11px] text-muted-foreground">
                {formatNumber(d.count)}
              </span>
            </li>
          ))}
        </ul>
      </aside>

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
