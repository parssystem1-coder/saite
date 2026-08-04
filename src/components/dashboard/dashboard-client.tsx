'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { TrustedDevicesPanel } from '@/components/dashboard/trusted-devices-panel'
import { RecentlyViewed } from '@/components/products/recently-viewed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { useSignOut } from '@/hooks/use-sign-out'
import { useAuthStore } from '@/store/auth-store'

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">در حال بارگذاری پنل کاربری…</span>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <Skeleton className="h-96 rounded-2xl lg:col-span-1" />
        <div className="space-y-6 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * orchestration پنل کاربری.
 * سایدبار و شاخص‌ها در ماژول‌های جدا هستند.
 */
export function DashboardClient() {
  const router = useRouter()
  const hydrated = useHasHydrated()

  // selector به‌جای useAuthStore() — تنها جایی در پروژه بود که کل
  // store را subscribe می‌کرد و با هر تغییر، کل داشبورد re-render می‌شد
  const user = useAuthStore((s) => s.user)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)


  React.useEffect(() => {
    if (hydrated && !isLoggedIn) router.replace('/login?redirect=/dashboard')
  }, [hydrated, isLoggedIn, router])

  const handleLogout = useSignOut('/')

  // اسکلتون به‌جای null — پیش از این صفحه لحظه‌ای سفید می‌شد
  if (!hydrated || !isLoggedIn) return <DashboardSkeleton />

  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <DashboardSidebar user={user} onLogout={handleLogout} />

        <main className="space-y-8 lg:col-span-3">
          <section className="surface-3d relative overflow-hidden rounded-2xl p-8 md:p-10">
            <div
              aria-hidden="true"
              className="absolute -bottom-20 -left-20 size-64 rounded-full bg-primary/10 blur-[80px]"
            />
            <div className="relative z-10">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                خوش آمدید{firstName ? `، ${firstName}` : ''}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                از این بخش سبد خرید، علاقه‌مندی‌ها و کالاهای در حال مقایسهٔ خود را دنبال
                کنید. پیگیری سفارش‌ها پس از اتصال سامانهٔ فروش فعال می‌شود.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/products">مشاهدهٔ محصولات</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">درخواست مشاوره</Link>
                </Button>
              </div>
            </div>
          </section>

          <DashboardStats />

          <TrustedDevicesPanel accountKey={user?.email || user?.id || ''} />

          <RecentlyViewed title="اخیراً دیده‌اید" />
        </main>
      </div>
    </div>
  )
}
