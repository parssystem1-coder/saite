'use client'

import {
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu3D, Menu3DItem } from '@/components/ui/menu-3d'
import { CATEGORIES, SITE } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'

export function Header() {
  const router = useRouter()
  const hydrated = useHasHydrated()

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const logout = useAuthStore((s) => s.logout)
  const itemCount = useCartStore((s) => s.itemCount())

  const [query, setQuery] = React.useState('')
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50">
      {/* ── نوار بالایی ─────────────────────────────────── */}
      <div className="hidden border-b border-border bg-surface-0/90 backdrop-blur-md md:block">
        <div className="container mx-auto flex h-9 items-center justify-between px-4 text-xs">
          <p className="text-muted-foreground">{SITE.workingHours}</p>
          <a
            href={`tel:${SITE.phoneLtr}`}
            className="flex items-center gap-1.5 font-bold text-primary transition-colors hover:text-primary-bright"
          >
            <Phone className="size-3.5" />
            {SITE.phone}
          </a>
        </div>
      </div>

      {/* ── نوار اصلی ───────────────────────────────────── */}
      <div className="border-b border-border bg-surface-0/85 shadow-depth-2 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/" className="shrink-0 text-xl font-black text-primary text-glow">
            {SITE.name}
          </Link>

          {/* منوی دسته‌ها — سه‌بعدی */}
          <div className="hidden lg:block">
            <Menu3D
              trigger={
                <span className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
                  <Menu className="size-4" />
                  دسته‌بندی‌ها
                </span>
              }
            >
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/products?category=${c.slug}`}>
                  <Menu3DItem>{c.name}</Menu3DItem>
                </Link>
              ))}
            </Menu3D>
          </div>

          {/* جستجو — حالا واقعاً کار می‌کند */}
          <form onSubmit={submitSearch} className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام یا مدل دستگاه..."
              aria-label="جستجوی محصولات"
              className="h-10 pr-10"
            />
          </form>

          <nav className="ms-auto flex items-center gap-2">
            <Button size="icon" variant="ghost" asChild className="relative">
              <Link href="/cart" aria-label={`سبد خرید، ${itemCount} کالا`}>
                <ShoppingCart />
                {hydrated && itemCount > 0 && (
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
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </nav>
        </div>
      </div>

      {/* ── منوی موبایل ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-b border-border bg-surface-1 shadow-depth-3 lg:hidden">
          <div className="container mx-auto space-y-4 px-4 py-5">
            <form onSubmit={submitSearch} className="relative md:hidden">
              <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو..."
                aria-label="جستجوی محصولات"
                className="pr-10"
              />
            </form>

            <nav className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-border bg-surface-0/50 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </nav>

            {!isLoggedIn && (
              <Button className="w-full" asChild>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  ورود / ثبت‌نام
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
