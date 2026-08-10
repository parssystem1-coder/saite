'use client'

import { useQuery } from '@tanstack/react-query'

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATS = [
  { label: 'فروش ماه', value: '۴۵۸,۰۰۰,۰۰۰ ت', icon: DollarSign, trend: '+۱۲.۵٪', up: true },
  { label: 'سفارش جدید', value: '۱۲۸', icon: Package, trend: '+۵.۲٪', up: true },
  { label: 'مشتری فعال', value: '۱,۴۲۰', icon: Users, trend: '+۱۸.۷٪', up: true },
  { label: 'نرخ تبدیل', value: '۳.۸٪', icon: Activity, trend: '−۱.۲٪', up: false },
] as const

const ACTIVITY = [
  { user: 'علی محمدی', action: 'سفارش پرینتر LBP-2900', time: '۲ دقیقه پیش' },
  { user: 'سارا رضایی', action: 'ثبت‌نام سازمانی', time: '۱۵ دقیقه پیش' },
  { user: 'سیستم', action: 'به‌روزرسانی موجودی تونر', time: '۱ ساعت پیش' },
  { user: 'رضا علوی', action: 'استعلام قیمت bizhub', time: '۳ ساعت پیش' },
] as const

const QUICK = [
  { href: '/admin/orders', label: 'سفارش‌ها' },
  { href: '/admin/products', label: 'محصولات' },
  { href: '/admin/finance/invoices', label: 'صورت‌حساب‌ها' },
  { href: '/admin/marketing/coupons', label: 'کد تخفیف' },
  { href: '/admin/communications/inquiries', label: 'استعلام‌ها' },
  { href: '/admin/pages/new', label: 'صفحهٔ جدید' },
] as const

/**
 * داشبورد مدیریت — ماژول جدا از shell.
 * داده‌ها نمایشی‌اند تا اتصال API.
 */
export function AdminDashboard() {
  const { data: lowStock } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => { const response = await fetch('/api/inventory/alerts'); if (!response.ok) throw new Error('inventory alerts'); return response.json() as Promise<{ total: number; items: { id: string; name: string; sku: string; quantityAvailable: number; reorderPoint: number }[] }> },
  })
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="داشبورد مدیریت"
        description="خلاصهٔ وضعیت کسب‌وکار (داده‌های نمایشی تا اتصال بک‌اند)"
        actions={
          <Button size="sm" asChild>
            <Link href="/admin/products">مدیریت محصولات</Link>
          </Button>
        }
      />

      {lowStock && lowStock.total > 0 && <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4"><div className="flex items-center gap-2 text-amber-300"><AlertTriangle className="size-5" /><b>{lowStock.total.toLocaleString('fa-IR')} کالا نیاز به تامین یا بررسی دارد</b><Link className="mr-auto text-sm underline" href="/admin/reports/inventory">مشاهده انبار</Link></div><div className="mt-3 flex flex-wrap gap-2">{lowStock.items.slice(0, 5).map((item) => <span key={item.id} className="rounded-lg bg-background/40 px-2 py-1 text-xs">{item.name}: {item.quantityAvailable.toLocaleString('fa-IR')} / حد {item.reorderPoint.toLocaleString('fa-IR')}</span>)}</div></section>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="surface-3d relative overflow-hidden rounded-2xl p-5">
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <stat.icon className="size-5" aria-hidden />
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-bold',
                  stat.up
                    ? 'bg-stock-in/15 text-stock-in'
                    : 'bg-destructive/15 text-destructive'
                )}
              >
                {stat.trend}
                {stat.up ? (
                  <ArrowUpRight className="size-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3" aria-hidden />
                )}
              </span>
            </div>
            <p className="relative z-10 mt-4 text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="relative z-10 mt-1 text-xl font-black text-foreground">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="surface-3d rounded-2xl p-6 xl:col-span-3">
          <h2 className="text-lg font-bold text-foreground">آخرین فعالیت‌ها</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            رویدادهای اخیر سیستم — بعداً از API خوانده می‌شود
          </p>
          <ul className="mt-5 space-y-4">
            {ACTIVITY.map((act) => (
              <li
                key={act.time + act.user}
                className="flex items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-xs font-bold text-primary">
                    {act.user.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{act.user}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{act.action}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{act.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-3d rounded-2xl p-6 xl:col-span-2">
          <h2 className="text-lg font-bold text-foreground">دسترسی سریع</h2>
          <p className="mt-1 text-xs text-muted-foreground">میانبر به بخش‌های پرکاربرد</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {QUICK.map((q) => (
              <Button key={q.href} variant="secondary" size="sm" className="justify-start" asChild>
                <Link href={q.href}>{q.label}</Link>
              </Button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface-0/50 p-4">
            <p className="text-xs font-bold text-foreground">فروش لحظه‌ای</p>
            <div className="mt-4 flex h-24 items-end gap-1.5 opacity-60">
              {[40, 70, 45, 90, 65, 80, 50, 85, 100, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-primary"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              نمودار پس از اتصال بک‌اند فعال می‌شود
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
