'use client'

import { ShoppingCart, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TechText } from '@/components/ui/tech-text'
import type { Product } from '@/types/product'

interface CompareProductColumnProps {
  product: Product
  onRemove: () => void
  onAdd: () => void
}

/** سرستون جدول مقایسه — تصویر، مدل، CTA */
export function CompareProductColumn({ product, onRemove, onAdd }: CompareProductColumnProps) {
  const buyable = product.priceType === 'fixed' && product.stockStatus !== 'out_of_stock'

  return (
    <div className="space-y-3 text-center font-normal">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`حذف ${product.name} از مقایسه`}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>

      <Link href={`/products/${product.slug}`} className="block">
        <span className="relative mx-auto block aspect-square w-24 overflow-hidden rounded-xl bg-surface-0">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="96px"
            className="object-contain p-1.5"
          />
        </span>
        <TechText className="mt-2 block text-xs font-bold text-primary">{product.model}</TechText>
        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
          {product.name}
        </span>
      </Link>

      {buyable ? (
        <Button size="sm" className="w-full" onClick={onAdd}>
          <ShoppingCart />
          افزودن
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href="/contact">استعلام</Link>
        </Button>
      )}
    </div>
  )
}
