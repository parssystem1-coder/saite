'use client'

import { GitCompareArrows, Home, LayoutGrid, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useCartHydrated,
  useCompareHydrated,
  useHasHydrated,
} from '@/hooks/use-has-hydrated'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'
import { useCompareStore } from '@/store/compare-store'

/**
 * نوار ناوبری پایینی برای موبایل و تبلت (زیر 1024 پیکسل).
 *
 * دسترسی سریع به اصلی‌ترین بخش‌های فروشگاه بدون نیاز به اسکرول به بالای صفحه.
 * در دسکتاپ (lg و بالاتر) مخفی می‌شود.
 */
export function MobileBottomNav() {
  const pathname = usePathname() ?? '/'
  const hydrated = useHasHydrated()
  const cartReady = useCartHydrated()
  const compareReady = useCompareHydrated()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const cartCount = useCartStore((s) => s.itemCount())
  const compareCount = useCompareStore((s) => s.items.length)

  const isHome = pathname === '/'
  const isProducts = pathname.startsWith('/products') || pathname.startsWith('/categories')
  const isCart = pathname.startsWith('/cart')
  const isCompare = pathname.startsWith('/compare')
  const isAccount =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  const accountHref = hydrated && isLoggedIn ? '/dashboard' : '/login'

  type NavItem = {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    active: boolean
    badge?: number
    badgeColor?: string
  }

  const NAV_ITEMS: NavItem[] = [
    {
      href: '/',
      label: 'خانه',
      icon: Home,
      active: isHome,
    },
    {
      href: '/products',
      label: 'محصولات',
      icon: LayoutGrid,
      active: isProducts,
    },
    {
      href: '/cart',
      label: 'سبد خرید',
      icon: ShoppingCart,
      active: isCart,
      badge: cartReady && cartCount > 0 ? cartCount : undefined,
      badgeColor: 'bg-primary text-primary-foreground shadow-glow-sm',
    },
    {
      href: '/compare',
      label: 'مقایسه',
      icon: GitCompareArrows,
      active: isCompare,
      badge: compareReady && compareCount > 0 ? compareCount : undefined,
      badgeColor: 'bg-surface-3 border border-border text-foreground',
    },
    {
      href: accountHref,
      label: 'حساب',
      icon: User,
      active: isAccount,
    },
  ]

  return (
    <nav
      aria-label="ناوبری سریع موبایل"
      className={cn(
        'fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-surface-1/95 shadow-depth-4 backdrop-blur-xl lg:hidden',
        'supports-[backdrop-filter]:bg-surface-1/85'
      )}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center justify-items-center px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.active

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex w-full flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-center transition-all duration-150',
                active
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground font-medium'
              )}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon
                  className={cn(
                    'size-5 transition-transform duration-150 group-active:scale-95',
                    active && 'scale-110'
                  )}
                  aria-hidden="true"
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none',
                      item.badgeColor
                    )}
                  >
                    {formatNumber(item.badge)}
                  </span>
                )}
              </span>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-primary shadow-glow-sm" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
