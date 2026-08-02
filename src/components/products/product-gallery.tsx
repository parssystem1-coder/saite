'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card3D } from '@/components/ui/card-3d'
import { CONDITION_LABELS } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ProductCondition } from '@/types/product'

interface ProductGalleryProps {
  images: string[]
  name: string
  condition: ProductCondition
  activeIndex: number
  onSelect: (index: number) => void
}

/** گالری تصویر محصول — تصویر اصلی + بندانگشتی */
export function ProductGallery({
  images,
  name,
  condition,
  activeIndex,
  onSelect,
}: ProductGalleryProps) {
  const safeIndex = Math.min(activeIndex, Math.max(0, images.length - 1))
  const mainSrc = images[safeIndex] ?? images[0]

  return (
    <div className="space-y-4">
      <Card3D maxTilt={4}>
        <div className="relative aspect-square p-8">
          {mainSrc && (
            <Image
              src={mainSrc}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="layer-lift object-contain"
            />
          )}
          {condition === 'refurbished' && (
            <Badge variant="accent" className="absolute top-4 right-4">
              {CONDITION_LABELS.refurbished}
            </Badge>
          )}
        </div>
      </Card3D>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`تصویر ${formatNumber(i + 1)}`}
              aria-current={i === safeIndex}
              className={cn(
                'relative size-20 overflow-hidden rounded-xl border bg-surface-1 transition-all',
                i === safeIndex
                  ? 'border-primary shadow-glow-sm'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
