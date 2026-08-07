'use client'

import * as React from 'react'
import { Percent, Tag, CalendarClock, TrendingUp, Plus, Trash2 } from 'lucide-react'
import { createMockMarketingAdapter, deriveCouponStatus } from '@/lib/marketing/mock-adapter'
import type { Coupon, CouponKind, CouponStatus } from '@/types/marketing'
import { Badge, Stat, formatIRR, formatJalaliDate } from '@/components/admin/finance/finance-shared'

const STATUS_LABEL: Record<CouponStatus, string> = {
  active: 'فعال',
  expired: 'منقضی',
  exhausted: 'به سقف رسیده',
  disabled: 'غیرفعال',
}
const STATUS_TONE: Record<CouponStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  active: 'success',
  expired: 'danger',
  exhausted: 'warn',
  disabled: 'default',
}

export default function CouponsClient() {
  const adapter = React.useMemo(() => createMockMarketingAdapter(), [])
  const [coupons, setCoupons] = React.useState<Coupon[]>([])
  const [nowMs] = React.useState(() => Date.now())

  const [code, setCode] = React.useState('')
  const [kind, setKind] = React.useState<CouponKind>('percent')
  const [value, setValue] = React.useState('10')
  const [days, setDays] = React.useState('30')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync
    setCoupons(adapter.listCoupons())
  }, [adapter])

  const withStatus = React.useMemo(
    () => coupons.map((c) => ({ ...c, status: deriveCouponStatus(c, nowMs) })),
    [coupons, nowMs]
  )

  const stats = React.useMemo(() => {
    const active = withStatus.filter((c) => c.status === 'active').length
    const totalUsed = withStatus.reduce((s, c) => s + c.usedCount, 0)
    const expiringSoon = withStatus.filter((c) => {
      if (c.status !== 'active') return false
      const daysLeft = (new Date(c.expiresAt).getTime() - nowMs) / 86400000
      return daysLeft < 7 && daysLeft > 0
    }).length
    return { active, totalUsed, expiringSoon, total: withStatus.length }
  }, [withStatus, nowMs])

  const handleAdd = () => {
    const codeTrim = code.trim().toUpperCase()
    const valNum = Number(value)
    const daysNum = Number(days)
    if (!/^[A-Z0-9_-]{3,20}$/.test(codeTrim)) {
      setError('کد باید ۳ تا ۲۰ حرف انگلیسی/عدد/خط تیره باشد')
      return
    }
    if (coupons.some((c) => c.code === codeTrim)) {
      setError('این کد قبلاً استفاده شده است')
      return
    }
    if (!Number.isFinite(valNum) || valNum <= 0) {
      setError('مقدار باید عدد مثبت باشد')
      return
    }
    if (kind === 'percent' && valNum > 100) {
      setError('درصد باید ≤ ۱۰۰ باشد')
      return
    }
    if (!Number.isFinite(daysNum) || daysNum <= 0) {
      setError('مدت اعتبار باید مثبت باشد')
      return
    }
    setError(null)
    const now = new Date().toISOString()
    const expires = new Date(nowMs + daysNum * 86400000).toISOString()
    const draft: Coupon = {
      id: `cp-${Date.now()}`,
      code: codeTrim,
      kind,
      value: valNum,
      usedCount: 0,
      startsAt: now,
      expiresAt: expires,
      status: 'active',
      createdAt: now,
    }
    setCoupons(adapter.saveCoupon(draft))
    setCode('')
  }

  const handleToggle = (id: string) => {
    const target = coupons.find((c) => c.id === id)
    if (!target) return
    setCoupons(
      adapter.saveCoupon({
        ...target,
        status: target.status === 'disabled' ? 'active' : 'disabled',
      })
    )
  }

  const handleRemove = (id: string) => {
    setCoupons(adapter.removeCoupon(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Tag} label="کوپن‌های فعال" value={stats.active.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={TrendingUp} label="کل استفاده" value={stats.totalUsed.toLocaleString('fa-IR')} />
        <Stat icon={CalendarClock} label="در حال انقضا (۷ روز)" value={stats.expiringSoon.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={Percent} label="کل کوپن‌ها" value={stats.total.toLocaleString('fa-IR')} />
      </div>

      <section className="surface-3d rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="size-4" aria-hidden />
          کوپن جدید
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="کد (مثال: SUMMER25)"
            className="min-w-[160px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-mono"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as CouponKind)}
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          >
            <option value="percent">درصدی</option>
            <option value="fixed">مبلغ ثابت (ریال)</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === 'percent' ? 'درصد' : 'مبلغ ریال'}
            inputMode="numeric"
            className="min-w-[100px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <input
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="مدت (روز)"
            inputMode="numeric"
            className="min-w-[100px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="me-2 size-4" aria-hidden />
            افزودن
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">کد</th>
                <th className="p-3">نوع / مقدار</th>
                <th className="p-3">شرایط</th>
                <th className="p-3">استفاده</th>
                <th className="p-3">انقضا</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {withStatus.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-mono text-sm">{c.code}</td>
                  <td className="p-3">
                    {c.kind === 'percent' ? `${c.value.toLocaleString('fa-IR')}٪` : formatIRR(c.value)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {c.minCartValue ? `حداقل ${formatIRR(c.minCartValue)}` : '—'}
                    {c.maxDiscount ? ` • سقف ${formatIRR(c.maxDiscount)}` : ''}
                  </td>
                  <td className="p-3 text-xs">
                    {c.usedCount.toLocaleString('fa-IR')}
                    {c.usageLimit ? ` / ${c.usageLimit.toLocaleString('fa-IR')}` : ''}
                  </td>
                  <td className="p-3 text-xs">{formatJalaliDate(c.expiresAt)}</td>
                  <td className="p-3">
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggle(c.id)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        {c.status === 'disabled' ? 'فعال' : 'غیرفعال'}
                      </button>
                      <button
                        onClick={() => handleRemove(c.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
