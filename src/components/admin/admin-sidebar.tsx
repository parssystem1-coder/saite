'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { AdminNavGroupItem } from '@/components/admin/admin-nav-group'
import { AdminSignOut } from '@/components/admin/admin-sign-out'
import { Button } from '@/components/ui/button'
import { ADMIN_NAV, filterAdminNavByRole, isAdminGroupActive, type AdminNavGroup } from '@/lib/admin/nav'
import { roleLabel } from '@/lib/auth/rbac'
import { useAdminSessionStore } from '@/store/admin-session-store'
import { cn } from '@/lib/utils'

/** گروه دارای فرزند که مسیر فعلی زیر آن است */
function activeGroupIdFromPath(nav: AdminNavGroup[], pathname: string): string | null {
  const match = nav.find(
    (g) => (g.children?.length ?? 0) > 0 && isAdminGroupActive(g, pathname)
  )
  return match?.id ?? null
}

/**
 * بدنهٔ منو — state آکاردئون اینجا متمرکز است (فقط یک گروه باز).
 * با key=pathname از والد، هنگام تعویض مسیر state از نو با گروه فعال init می‌شود.
 */
function AdminNavBody({
  pathname,
  nav,
  role,
  initialOpenId,
  onNavigate,
}: {
  pathname: string
  nav: AdminNavGroup[]
  role: string | null
  initialOpenId: string | null
  onNavigate?: () => void
}) {
  const [openGroupId, setOpenGroupId] = React.useState<string | null>(initialOpenId)

  const handleOpenChange = React.useCallback((groupId: string) => {
    // همان گروه باز → ببند؛ گروه دیگر → فقط همان باز (قبلی بسته می‌شود)
    setOpenGroupId((current) => (current === groupId ? null : groupId))
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 px-1">
        <Link href="/admin" className="block" onClick={onNavigate}>
          <h2 className="text-lg font-black tracking-tight text-primary">پنل مدیریت</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {role ?? 'فروشگاه ماشین‌های اداری'}
          </p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pe-1" aria-label="منوی مدیریت">
        {nav.map((group) => (
          <AdminNavGroupItem
            key={group.id}
            group={group}
            pathname={pathname}
            open={openGroupId === group.id}
            onOpenChange={handleOpenChange}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-6 space-y-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
          <p className="text-center text-[10px] font-bold text-primary">وضعیت سیستم</p>
          <div className="mt-1.5 flex items-center justify-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-stock-in" />
            <span className="text-[10px] font-bold text-muted-foreground">
              نمایشی — آمادهٔ بک‌اند
            </span>
          </div>
        </div>

        <AdminSignOut onNavigate={onNavigate} />
      </div>
    </div>
  )
}

/**
 * سایدبار ماژولار — آکاردئون exclusive (فقط یک زیرمنو باز)
 */
export function AdminSidebar() {
  const pathname = usePathname() ?? '/admin'
  const [mobileOpen, setMobileOpen] = React.useState(false)

  /*
    نقش از store کلاینت می‌آید که خودش توسط AdminSessionProvider از
    نشست سرور پر شده. اگر هنوز خالی است (بین دو رندر)، منو خالی
    نشان داده می‌شود — بهتر از نشان دادن آیتم‌هایی که کاربر بعد
    از یک لحظه از دست می‌دهد.
  */
  const admin = useAdminSessionStore((s) => s.admin)
  const role = admin?.role ?? null

  const filteredNav = React.useMemo(() => filterAdminNavByRole(ADMIN_NAV, role), [role])
  const initialOpenId = activeGroupIdFromPath(filteredNav, pathname)
  const roleText = role ? roleLabel(role) : null

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
          <AdminNavBody
            key={pathname}
            pathname={pathname}
            nav={filteredNav}
            role={roleText}
            initialOpenId={initialOpenId}
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div id="admin-mobile-nav" className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
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
              <AdminNavBody
                key={`m-${pathname}`}
                pathname={pathname}
                nav={filteredNav}
                role={roleText}
                initialOpenId={initialOpenId}
                onNavigate={closeMobile}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
