'use client'

import { Clock, LayoutDashboard, LogOut, Menu, Phone, Search, ShoppingCart, User, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { MegaMenu } from '@/components/layout/mega-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu3D, Menu3DItem } from '@/components/ui/menu-3d'
import { BRANDS, CATEGORIES, SITE } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { useCartHydrated, useHasHydrated } from '@/hooks/use-has-hydrated'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'

export function Header() {
  const router = useRouter()
  const hydrated = useHasHydrated()
  const cartReady = useCartHydrated()

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
      {/* ── نوار بالایی: اطلاعات تماس ─────────────────────── */}
      <div className="hidden border-b border-border bg-surface-0/90 backdrop-blur-md md:block">
        <div className="container mx-auto flex h-9 items-center justify-between px-4 text-xs">
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            {SITE.workingHours}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              استعلام قیمت
            </Link>
            <a
              href={`tel:${SITE.phoneLtr}`}
              className="flex items-center gap-1.5 font-bold text-primary transition-colors hover:text-primary-bright"
            >
              <Phone className="size-3.5" />
              {SITE.phone}
            </a>
          </div>
        </div>
      </div>

      {/* ── نوار اصلی ─────────────────────────────────────── */}
      <div className="border-b border-border bg-surface-0/85 shadow-depth-2 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link href="/" className="shrink-0 text-xl font-black text-primary text-glow">
            {SITE.name}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <MegaMenu />
            <Link
              href="/products"
              className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              محصولات
            </Link>
            <Link
              href="/services"
              className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              خدمات
            </Link>
            <Link
              href="/contact"
              className="rounded-xl px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              تماس با ما
            </Link>
          </nav>

          <form onSubmit={submitSearch} className="relative hidden max-w-sm flex-1 md:block">
            <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام یا مدل دستگاه…"
              aria-label="جستجوی محصولات"
              className="h-10 pr-10"
            />
          </form>

          <nav className="ms-auto flex items-center gap-1.5">
            <Button size="icon" variant="ghost" asChild className="relative">
              <Link href="/cart" aria-label={`سبد خرید، ${itemCount} کالا`}>
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

      {/* ── منوی موبایل ───────────────────────────────────── */}
      {mobileOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-surface-1 shadow-depth-3 lg:hidden">
          <div className="container mx-auto space-y-5 px-4 py-5">
            <form onSubmit={submitSearch} className="relative md:hidden">
              <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو…"
                aria-label="جستجوی محصولات"
                className="pr-10"
              />
            </form>

            <div>
              <p className="mb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                دسته‌بندی‌ها
              </p>
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
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                برندها
              </p>
              <div className="flex flex-wrap gap-2">
                {BRANDS.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/products?brand=${b.slug}`}
                    onClick={() => setMobileOpen(false)}
                    dir="ltr"
                    className="rounded-lg border border-border bg-surface-0/50 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {b.displayName}
                  </Link>
                ))}
              </div>
            </div>

            <nav className="grid gap-2 border-t border-border pt-4">
              {[
                ['/services', 'خدمات'],
                ['/about', 'دربارهٔ ما'],
                ['/contact', 'تماس با ما'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <a
              href={`tel:${SITE.phoneLtr}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 py-2.5 text-sm font-bold text-primary"
            >
              <Phone className="size-4" />
              {SITE.phone}
            </a>

            {hydrated && !isLoggedIn && (
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
