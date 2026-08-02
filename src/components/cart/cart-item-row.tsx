'use client'

import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { TechText } from '@/components/ui/tech-text'
import { formatPriceWithUnit } from '@/lib/format'
import type { CartItem } from '@/store/cart-store'

interface CartItemRowProps {
  item: CartItem
  onRemove: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
}

export function CartItemRow({ item, onRemove, onQuantityChange }: CartItemRowProps) {
  return (
    <article className="surface-3d flex items-center gap-4 rounded-2xl p-4 md:p-5">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-0/60 md:h-28 md:w-28"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="112px"
          className="object-contain p-2"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${item.slug}`} className="block">
              <h2 className="line-clamp-2 text-base font-bold text-foreground transition-colors hover:text-primary md:text-lg">
                {item.name}
              </h2>
            </Link>
            <TechText className="mt-1 block text-sm text-muted-foreground">{item.model}</TechText>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRemove(item.id)}
            aria-label={`حذف ${item.name} از سبد`}
          >
            <Trash2 />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <QuantityStepper
            value={item.quantity}
            onChange={(q) => onQuantityChange(item.id, q)}
            aria-label={`تعداد ${item.name}`}
          />
          <p className="text-left text-base font-black text-primary md:text-lg">
            {formatPriceWithUnit(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </article>
  )
}
