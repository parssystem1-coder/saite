'use client'

import Link from 'next/link'
import Image from 'next/image'
import { History } from 'lucide-react'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { PriceDisplay } from '@/components/ui/price-display'
import { TechText } from '@/components/ui/tech-text'
import { SectionHeader } from '@/components/ui/section-header'

interface RecentlyViewedProps {
  excludeId?: string
  title?: string
}

/** نوار افقی اخیراً دیده‌شده — sessionStorage، بدون بک‌اند */
export function RecentlyViewed({
  excludeId,
  title = 'اخیراً دیده‌اید',
}: RecentlyViewedProps) {
  const items = useRecentlyViewed(excludeId)

  if (items.length === 0) return null

  return (
    <section className="mt-16">
      <SectionHeader
        title={title}
        description="برای مقایسه سریع بدون جستجوی دوباره"
        className="mb-5"
      />
      <ul className="scrollbar-neon -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {items.map((p) => (
          <li key={p.id} className="w-44 shrink-0 sm:w-48">
            <Link
              href={`/products/${p.slug}`}
              className="surface-3d block rounded-2xl p-3 transition-transform hover:-translate-y-0.5"
            >
              <span className="relative mx-auto mb-2 block aspect-square w-full overflow-hidden rounded-xl bg-surface-0/60">
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="192px"
                  className="object-contain p-2"
                />
              </span>
              <TechText className="line-clamp-1 text-xs font-bold text-primary">
                {p.model}
              </TechText>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {p.name}
              </p>
              <div className="mt-2">
                <PriceDisplay priceType={p.priceType} price={p.price} size="sm" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <History className="size-3" aria-hidden="true" />
        فقط در این مرورگر و تا پایان نشست ذخیره می‌شود
      </p>
    </section>
  )
}
