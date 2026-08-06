'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { HeaderActions } from '@/components/layout/header-actions'
import { HeaderSearch } from '@/components/layout/header-search'
import { HeaderTopbar } from '@/components/layout/header-topbar'
import { MegaMenu } from '@/components/layout/mega-menu'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SITE } from '@/lib/constants'

/**
 * هدر سایت — ترکیب نوار تماس، ناوبری، جستجو و منوی موبایل.
 * منطق هر بخش در ماژول جداست.
 */
export function Header() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const closeMobile = React.useCallback(() => setMobileOpen(false), [])

  const submitSearch = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
      setMobileOpen(false)
    },
    [query, router]
  )

  return (
    <header className="sticky top-0 z-[85]">
      <HeaderTopbar />

      <div className="border-b border-border bg-surface-0/85 shadow-depth-2 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link href="/" className="shrink-0 text-xl font-black text-primary text-glow">
            {SITE.name}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="منوی اصلی">
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

          <HeaderSearch
            query={query}
            onQueryChange={setQuery}
            onSubmit={submitSearch}
            className="hidden max-w-sm flex-1 sm:block"
            inputClassName="h-10"
          />

          <HeaderActions
            mobileOpen={mobileOpen}
            onToggleMobile={() => setMobileOpen((v) => !v)}
          />
        </div>
      </div>

      <MobileNav
        open={mobileOpen}
        onClose={closeMobile}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={submitSearch}
      />
    </header>
  )
}
