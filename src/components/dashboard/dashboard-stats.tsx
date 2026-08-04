'use client'

import { GitCompareArrows, Heart, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useCartHydrated, useCompareHydrated, useWishlistHydrated } from '@/hooks/use-has-hydrated'
import { formatNumber } from '@/lib/format'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'
import { useWishlistStore } from '@/store/wishlist-store'

interface StatCard {
  label: string
  value: number
  ready: boolean
  icon: LucideIcon
  href: string
  emptyHint: string
}

/**
 * شاخص‌های داشبورد — از storeهای واقعی، نه عدد ثابت.
 *
 * پیش از این «علاقه‌مندی‌ها: ۱۲» hardcode بود در حالی که فهرست
 * واقعی کاربر می‌توانست خالی باشد. عدد دروغ در داشبورد، اعتماد
 * کاربر به بقیهٔ اعداد سایت را هم از بین می‌برد.
 *
 * «سفارش‌ها» عمداً اینجا نیست: بدون بک‌اند هیچ منبع صادقی برایش
 * نداریم و ساختن عدد جعلی همان اشتباه قبلی است.
 */
export function DashboardStats() {
  const cartReady = useCartHydrated()
  const wishlistReady = useWishlistHydrated()
  const compareReady = useCompareHydrated()

  const cartCount = useCartStore((s) => s.itemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const compareCount = useCompareStore((s) => s.items.length)

  const stats: StatCard[] = [
    {
      label: 'کالا در سبد خرید',
      value: cartCount,
      ready: cartReady,
      icon: ShoppingCart,
      href: '/cart',
      emptyHint: 'سبد شما خالی است',
    },
    {
      label: 'علاقه‌مندی‌ها',
      value: wishlistCount,
      ready: wishlistReady,
      icon: Heart,
      href: '/wishlist',
      emptyHint: 'هنوز کالایی ذخیره نکرده‌اید',
    },
    {
      label: 'در حال مقایسه',
      value: compareCount,
      ready: compareReady,
      icon: GitCompareArrows,
      href: '/compare',
      emptyHint: 'کالایی برای مقایسه نیست',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="surface-3d group rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary/20">
              <stat.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-3xl font-black text-foreground">
              {stat.ready ? formatNumber(stat.value) : '—'}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground">{stat.label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {stat.ready && stat.value === 0 ? stat.emptyHint : 'مشاهده و مدیریت'}
          </p>
        </Link>
      ))}
    </div>
  )
}
