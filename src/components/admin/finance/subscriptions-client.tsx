'use client'

import * as React from 'react'
import { CalendarClock, PauseCircle, PlayCircle, RefreshCw, XCircle } from 'lucide-react'
import { createMockFinanceAdapter } from '@/lib/finance/mock-adapter'
import type { Subscription, SubscriptionInterval, SubscriptionStatus } from '@/types/finance'
import { Badge, Stat, formatIRR, formatJalaliDate, formatRelative } from './finance-shared'

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'فعال',
  paused: 'متوقف',
  expired: 'منقضی',
  cancelled: 'لغو شده',
}

const STATUS_TONE: Record<SubscriptionStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  active: 'success',
  paused: 'warn',
  expired: 'danger',
  cancelled: 'default',
}

const INTERVAL_LABEL: Record<SubscriptionInterval, string> = {
  monthly: 'ماهانه',
  quarterly: 'فصلی',
  yearly: 'سالانه',
}

const INTERVAL_DAYS: Record<SubscriptionInterval, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
}

export default function SubscriptionsClient() {
  const adapter = React.useMemo(() => createMockFinanceAdapter(), [])
  const [subs, setSubs] = React.useState<Subscription[]>([])
  const [statusFilter, setStatusFilter] = React.useState<'all' | SubscriptionStatus>('all')

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync
    setSubs(adapter.listSubscriptions())
  }, [adapter])

  const filtered =
    statusFilter === 'all' ? subs : subs.filter((s) => s.status === statusFilter)

  /*
    زمان جاری از React state گرفته می‌شود چون React 19 در `useMemo`
    اجازهٔ فراخوانی `Date.now()` را نمی‌دهد (تابع ناخالص).
    یک بار موقع mount حساب می‌شود؛ برای شمارش‌های نمایشی «سررسید»
    این دقت کافی‌ست.
  */
  const [nowMs] = React.useState(() => Date.now())

  const stats = React.useMemo(() => {
    const active = subs.filter((s) => s.status === 'active').length
    const mrr = subs
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const monthly = s.interval === 'monthly' ? s.amount : s.interval === 'quarterly' ? s.amount / 3 : s.amount / 12
        return sum + monthly
      }, 0)
    const dueSoon = subs.filter((s) => {
      if (s.status !== 'active') return false
      const days = (new Date(s.nextRenewalAt).getTime() - nowMs) / 86400000
      return days > 0 && days < 30
    }).length
    const overdue = subs.filter((s) => {
      if (s.status !== 'active') return false
      return new Date(s.nextRenewalAt).getTime() < nowMs
    }).length
    return { active, mrr, dueSoon, overdue }
  }, [subs, nowMs])

  const handleAction = (id: string, action: 'pause' | 'resume' | 'renew' | 'cancel') => {
    const target = subs.find((s) => s.id === id)
    if (!target) return
    let updated: Subscription = target
    if (action === 'pause') updated = { ...target, status: 'paused' }
    if (action === 'resume') updated = { ...target, status: 'active' }
    if (action === 'cancel') updated = { ...target, status: 'cancelled', cancelledAt: new Date().toISOString() }
    if (action === 'renew') {
      const nextDate = new Date(target.nextRenewalAt)
      nextDate.setDate(nextDate.getDate() + INTERVAL_DAYS[target.interval])
      updated = { ...target, status: 'active', startedAt: new Date().toISOString(), nextRenewalAt: nextDate.toISOString() }
    }
    setSubs(adapter.saveSubscription(updated))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={PlayCircle} label="اشتراک فعال" value={String(stats.active)} tone="success" />
        <Stat icon={CalendarClock} label="MRR (تقریبی)" value={formatIRR(Math.round(stats.mrr))} />
        <Stat icon={RefreshCw} label="سررسید ۳۰ روز آینده" value={String(stats.dueSoon)} tone="warn" />
        <Stat icon={XCircle} label="سررسید گذشته" value={String(stats.overdue)} tone="danger" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {(['all', 'active', 'paused', 'expired', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {s === 'all' ? 'همه' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-4">پلن</th>
                <th className="p-4">مشتری</th>
                <th className="p-4">مبلغ / دوره</th>
                <th className="p-4">شروع</th>
                <th className="p-4">تمدید بعدی</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="font-medium">{s.planName}</div>
                    {s.planDescription && (
                      <div className="text-xs text-muted-foreground">{s.planDescription}</div>
                    )}
                  </td>
                  <td className="p-4">{s.customerName}</td>
                  <td className="p-4">
                    <div>{formatIRR(s.amount)}</div>
                    <div className="text-xs text-muted-foreground">{INTERVAL_LABEL[s.interval]}</div>
                  </td>
                  <td className="p-4 text-xs">{formatJalaliDate(s.startedAt)}</td>
                  <td className="p-4 text-xs">
                    <div>{formatJalaliDate(s.nextRenewalAt)}</div>
                    <div className="text-muted-foreground">{formatRelative(s.nextRenewalAt)}</div>
                  </td>
                  <td className="p-4">
                    <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {s.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleAction(s.id, 'pause')}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                          >
                            <PauseCircle className="size-3.5" aria-hidden />
                            توقف
                          </button>
                          <button
                            onClick={() => handleAction(s.id, 'cancel')}
                            className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                          >
                            لغو
                          </button>
                        </>
                      )}
                      {s.status === 'paused' && (
                        <button
                          onClick={() => handleAction(s.id, 'resume')}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                        >
                          <PlayCircle className="size-3.5" aria-hidden />
                          فعال
                        </button>
                      )}
                      {(s.status === 'active' || s.status === 'expired') && (
                        <button
                          onClick={() => handleAction(s.id, 'renew')}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-xs text-primary hover:bg-primary/25"
                        >
                          <RefreshCw className="size-3.5" aria-hidden />
                          تمدید
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            اشتراکی با این فیلتر یافت نشد.
          </div>
        )}
      </section>
    </div>
  )
}
