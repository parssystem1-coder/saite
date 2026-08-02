'use client'

import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { CartCrossSell } from '@/components/cart/cart-cross-sell'
import { CartItemRow } from '@/components/cart/cart-item-row'
import { CartSkeleton } from '@/components/cart/cart-skeleton'
import { CartSummary } from '@/components/cart/cart-summary'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useCartHydrated } from '@/hooks/use-has-hydrated'
import { useCartStore } from '@/store/cart-store'

export function CartClient() {
  const hydrated = useCartHydrated()
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const itemCount = useCartStore((s) => s.itemCount)

  if (!hydrated) return <CartSkeleton />

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Breadcrumb
          className="mb-8"
          items={[{ label: 'خانه', href: '/' }, { label: 'سبد خرید' }]}
        />
        <div className="surface-3d rounded-2xl">
          <EmptyState
            icon={ShoppingBag}
            title="سبد خرید شما خالی است"
            description="هنوز کالایی اضافه نکرده‌اید. از کاتالوگ محصولات، دستگاه یا مواد مصرفی مورد نیازتان را انتخاب کنید."
            action={
              <Button size="lg" asChild>
                <Link href="/products">مشاهدهٔ فروشگاه</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb
        className="mb-8"
        items={[{ label: 'خانه', href: '/' }, { label: 'سبد خرید' }]}
      />

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <div className="min-w-0 flex-1 space-y-5">
          <header className="mb-2 flex items-center gap-3">
            <ShoppingBag className="size-7 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-black text-foreground md:text-3xl">سبد خرید شما</h1>
          </header>

          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <CartItemRow
                  item={item}
                  onRemove={removeItem}
                  onQuantityChange={updateQuantity}
                />
              </li>
            ))}
          </ul>
        </div>

        <CartSummary items={items} itemCount={itemCount()} total={totalPrice()} />
      </div>

      <CartCrossSell items={items} />
    </div>
  )
}
