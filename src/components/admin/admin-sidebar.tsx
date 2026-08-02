'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { AdminNavGroupItem } from '@/components/admin/admin-nav-group'
import { Button } from '@/components/ui/button'
import { ADMIN_NAV } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'

function AdminNavBody({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 px-1">
        <Link href="/admin" className="block" onClick={onNavigate}>
          <h2 className="text-lg font-black tracking-tight text-primary">پنل مدیریت</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">فروشگاه ماشین‌های اداری</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pe-1" aria-label="منوی مدیریت">
        {ADMIN_NAV.map((group) => (
          <AdminNavGroupItem
            key={group.id}
            group={group}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-3">
        <p className="text-center text-[10px] font-bold text-primary">وضعیت سیستم</p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-stock-in" />
          <span className="text-[10px] font-bold text-muted-foreground">نمایشی — آمادهٔ بک‌اند</span>
        </div>
      </div>
    </div>
  )
}

/**
 * سایدبار ماژولار — منبع داده: ADMIN_NAV
 */
export function AdminSidebar() {
  const pathname = usePathname() ?? '/admin'
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const closeMobile = React.useCallback(() => setMobileOpen(false), [])

  return (
    <>
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <p className="text-sm font-bold text-foreground">منوی مدیریت</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-nav"
        >
          <Menu className="size-4" />
          منو
        </Button>
      </div>

      <aside className="hidden w-full shrink-0 lg:block lg:w-72">
        <div className="surface-3d sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl p-4">
          <AdminNavBody pathname={pathname} />
        </div>
      </aside>

      {mobileOpen ? (
        <div id="admin-mobile-nav" className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="بستن منو"
            onClick={closeMobile}
          />
          <div
            className={cn(
              'absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col',
              'border-s border-border bg-surface-1 p-4 shadow-depth-4'
            )}
          >
            <div className="mb-2 flex justify-end">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={closeMobile}
                aria-label="بستن"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AdminNavBody pathname={pathname} onNavigate={closeMobile} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
