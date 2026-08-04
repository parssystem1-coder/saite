'use client'

import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { HeaderCountAction } from '@/components/layout/header-count-action'
import { Button } from '@/components/ui/button'
import { Menu3D, Menu3DItem } from '@/components/ui/menu-3d'
import {
  useCartHydrated,
  useHasHydrated,
  useWishlistHydrated,
} from '@/hooks/use-has-hydrated'
import { selectIsAdmin, useAuthStore } from '@/store/auth-store'
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
  const wishlistReady = useWishlistHydrated()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const isAdmin = useAuthStore(selectIsAdmin)
  const logout = useAuthStore((s) => s.logout)
  const itemCount = useCartStore((s) => s.itemCount())
  const wishlistCount = useWishlistStore((s) => s.items.length)

  return (
    <nav className="ms-auto flex items-center gap-1.5" aria-label="میانبرهای حساب و سبد">
      <HeaderCountAction
        href="/wishlist"
        icon={Heart}
        label="علاقه‌مندی‌ها"
        count={wishlistCount}
        ready={wishlistReady}
        badgeClassName="bg-destructive text-destructive-foreground"
        className="hidden sm:inline-flex"
      />

      <HeaderCountAction
        href="/cart"
        icon={ShoppingCart}
        label="سبد خرید"
        count={itemCount}
        ready={cartReady}
        badgeClassName="bg-primary text-primary-foreground shadow-glow-sm"
      />

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
          {isAdmin && (
            <Link href="/admin">
              <Menu3DItem>
                <ShieldCheck className="size-4 text-primary" />
                پنل مدیریت
              </Menu3DItem>
            </Link>
          )}
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
