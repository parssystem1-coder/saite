'use client'

import { Phone } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { HeaderSearch } from '@/components/layout/header-search'
import { Button } from '@/components/ui/button'
import { BRANDS, CATEGORIES, SITE } from '@/lib/constants'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { useAuthStore } from '@/store/auth-store'

const MOBILE_LINKS = [
  ['/wishlist', 'علاقه‌مندی‌ها'],
  ['/compare', 'مقایسه'],
  ['/brands', 'برندها'],
  ['/services', 'خدمات'],
  ['/blog', 'مجلهٔ آموزشی'],
  ['/about', 'دربارهٔ ما'],
  ['/contact', 'تماس با ما'],
] as const

interface MobileNavProps {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
}

/**
 * کشوی ناوبری موبایل.
 * با Escape بسته می‌شود و اسکرول body قفل می‌گردد.
 */
export function MobileNav({
  open,
  onClose,
  query,
  onQueryChange,
  onSearchSubmit,
}: MobileNavProps) {
  const hydrated = useHasHydrated()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  React.useEffect(() => {
    if (!open) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      id="mobile-nav"
      className="max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-surface-1 shadow-depth-3 lg:hidden"
    >
      <div className="container mx-auto space-y-5 px-4 py-5">
        <HeaderSearch
          query={query}
          onQueryChange={onQueryChange}
          onSubmit={onSearchSubmit}
          className="md:hidden"
          placeholder="جستجو…"
        />

        <div>
          <p className="mb-2 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            دسته‌بندی‌ها
          </p>
          <nav className="grid grid-cols-2 gap-2" aria-label="دسته‌بندی‌های موبایل">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                onClick={onClose}
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
                href={`/brands/${b.slug}`}
                onClick={onClose}
                dir="ltr"
                className="rounded-lg border border-border bg-surface-0/50 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {b.displayName}
              </Link>
            ))}
          </div>
        </div>

        <nav className="grid gap-2 border-t border-border pt-4" aria-label="لینک‌های بیشتر">
          {MOBILE_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
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
          <Phone className="size-4" aria-hidden="true" />
          {SITE.phone}
        </a>

        {hydrated && !isLoggedIn && (
          <Button className="w-full" asChild>
            <Link href="/login" onClick={onClose}>
              ورود / ثبت‌نام
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
