'use client'

import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu3D, Menu3DItem } from '@/components/ui/menu-3d'
import { formatNumber } from '@/lib/format'
import { useCartHydrated, useHasHydrated } from '@/hooks/use-has-hydrated'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'

interface HeaderActionsProps {
  mobileOpen: boolean
  onToggleMobile: () => void
}

/** آیکون‌های سبد، علاقه‌مندی، حساب و دکمهٔ منوی موبایل */
export function HeaderActions({ mobileOpen, onToggleMobile }: HeaderActionsProps) {
  const hydrated = useHasHydrated()
  const cartReady = useCartHydrated()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const logout = useAuthStore((s) => s.logout)
  const itemCount = useCartStore((s) => s.itemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)

  return (
    <nav className="ms-auto flex items-center gap-1.5" aria-label="میانبرهای حساب و سبد">
      <Button size="icon" variant="ghost" asChild className="relative hidden sm:inline-flex">
        <Link href="/wishlist" aria-label={`علاقه‌مندی‌ها، ${formatNumber(wishlistCount)} کالا`}>
          <Heart />
          {hydrated && wishlistCount > 0 && (
            <span className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {formatNumber(wishlistCount)}
            </span>
          )}
        </Link>
      </Button>

      <Button size="icon" variant="ghost" asChild className="relative">
        <Link href="/cart" aria-label={`سبد خرید، ${formatNumber(itemCount)} کالا`}>
          <ShoppingCart />
          {cartReady && itemCount > 0 && (
            <span className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-glow-sm">
              {formatNumber(itemCount)}
            </span>
          )}
        </Link>
      </Button>

      {hydrated && isLoggedIn ? (
        <Menu3D
          trigger={
            <span className="inline-flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-primary">
              <User className="size-5" />
            </span>
          }
        >
          <Link href="/dashboard">
            <Menu3DItem>
              <LayoutDashboard className="size-4 text-primary" />
              پنل کاربری
            </Menu3DItem>
          </Link>
          <Link href="/wishlist">
            <Menu3DItem>
              <Heart className="size-4 text-primary" />
              علاقه‌مندی‌ها
            </Menu3DItem>
          </Link>
          <div className="my-1 h-px bg-border" />
          <Menu3DItem
            onClick={logout}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            خروج
          </Menu3DItem>
        </Menu3D>
      ) : (
        <Button size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/login">ورود / ثبت‌نام</Link>
        </Button>
      )}

      <Button
        size="icon"
        variant="ghost"
        className="lg:hidden"
        onClick={onToggleMobile}
        aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>
    </nav>
  )
}
