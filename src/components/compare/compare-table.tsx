'use client'

import { CompareCell, CompareDash, CompareRow } from '@/components/compare/compare-cells'
import { CompareProductColumn } from '@/components/compare/compare-product-column'
import { PriceDisplay } from '@/components/ui/price-display'
import { RatingStars } from '@/components/ui/rating-stars'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { BRANDS, CONDITION_LABELS } from '@/lib/constants'
import { formatWarranty } from '@/lib/format'
import { getRatingSummary, type Product } from '@/types/product'

interface CompareTableProps {
  products: Product[]
  specKeys: string[]
  onRemove: (id: string) => void
  onAdd: (product: Product) => void
}

/** جدول مقایسهٔ مشخصات — ستون‌ها و ردیف‌های هم‌تراز */
export function CompareTable({ products, specKeys, onRemove, onAdd }: CompareTableProps) {
  return (
    <div className="scrollbar-neon overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <caption className="sr-only">جدول مقایسهٔ مشخصات فنی محصولات انتخاب‌شده</caption>

        <thead>
          <tr>
            <th scope="col" className="w-40 bg-surface-2 p-4 text-right align-top">
              <span className="text-xs text-muted-foreground">مشخصه</span>
            </th>
            {products.map((p) => (
              <th key={p.id} scope="col" className="min-w-56 bg-surface-1 p-4 align-top">
                <CompareProductColumn
                  product={p}
                  onRemove={() => onRemove(p.id)}
                  onAdd={() => onAdd(p)}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <CompareRow label="برند" surface>
            {products.map((p) => (
              <CompareCell key={p.id}>
                <TechText className="font-bold text-foreground">
                  {BRANDS.find((b) => b.slug === p.brand)?.displayName ?? p.brand}
                </TechText>
              </CompareCell>
            ))}
          </CompareRow>

          <CompareRow label="قیمت">
            {products.map((p) => (
              <CompareCell key={p.id}>
                <PriceDisplay priceType={p.priceType} price={p.price} size="sm" />
              </CompareCell>
            ))}
          </CompareRow>

          <CompareRow label="موجودی" surface>
            {products.map((p) => (
              <CompareCell key={p.id}>
                <StockBadge status={p.stockStatus} size="sm" />
              </CompareCell>
            ))}
          </CompareRow>

          <CompareRow label="امتیاز کاربران">
            {products.map((p) => {
              const r = getRatingSummary(p)
              return (
                <CompareCell key={p.id}>
                  {r ? <RatingStars value={r.average} count={r.count} /> : <CompareDash />}
                </CompareCell>
              )
            })}
          </CompareRow>

          <CompareRow label="ضمانت" surface>
            {products.map((p) => (
              <CompareCell key={p.id}>
                {formatWarranty(p.warrantyMonths) ?? <CompareDash />}
              </CompareCell>
            ))}
          </CompareRow>

          <CompareRow label="وضعیت">
            {products.map((p) => (
              <CompareCell key={p.id}>{CONDITION_LABELS[p.condition]}</CompareCell>
            ))}
          </CompareRow>

          {specKeys.map((key, i) => (
            <CompareRow key={key} label={key} surface={i % 2 === 0}>
              {products.map((p) => {
                const spec = p.specs.find((s) => s.key === key)
                return (
                  <CompareCell key={p.id}>
                    {spec ? (
                      spec.isTechnical ? (
                        <TechText>{spec.value}</TechText>
                      ) : (
                        spec.value
                      )
                    ) : (
                      <CompareDash />
                    )}
                  </CompareCell>
                )
              })}
            </CompareRow>
          ))}
        </tbody>
      </table>
    </div>
  )
}
