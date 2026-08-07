'use client'

import * as React from 'react'
import { Users, Trophy, AlertTriangle, UserPlus } from 'lucide-react'
import { createMockReportsAdapter } from '@/lib/reports/mock-adapter'
import { Badge, Stat, formatIRR } from '@/components/admin/finance/finance-shared'

const SEGMENT_LABEL = {
  vip: 'VIP',
  repeat: 'تکراری',
  at_risk: 'در معرض ریزش',
  new: 'جدید',
} as const

const SEGMENT_TONE = {
  vip: 'success',
  repeat: 'info',
  at_risk: 'danger',
  new: 'warn',
} as const

export default function CustomersReportClient() {
  const adapter = React.useMemo(() => createMockReportsAdapter(), [])
  const rows = adapter.customerLeaderboard()

  const stats = React.useMemo(() => {
    const vip = rows.filter((r) => r.segment === 'vip').length
    const atRisk = rows.filter((r) => r.segment === 'at_risk').length
    const newCount = rows.filter((r) => r.segment === 'new').length
    const totalLTV = rows.reduce((s, r) => s + r.lifetimeValue, 0)
    return { vip, atRisk, newCount, totalLTV }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Trophy} label="مشتریان VIP" value={stats.vip.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={AlertTriangle} label="در معرض ریزش" value={stats.atRisk.toLocaleString('fa-IR')} tone="danger" />
        <Stat icon={UserPlus} label="مشتریان جدید" value={stats.newCount.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={Users} label="ارزش کل عمر" value={formatIRR(stats.totalLTV)} />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="border-b border-border p-4 text-sm font-semibold">مشتریان برتر بر اساس LTV</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">رتبه</th>
                <th className="p-3">مشتری</th>
                <th className="p-3">تعداد سفارش</th>
                <th className="p-3">ارزش عمر</th>
                <th className="p-3">آخرین خرید</th>
                <th className="p-3">سگمنت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 text-xs text-muted-foreground">{(i + 1).toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    <div>{r.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
                  </td>
                  <td className="p-3">{r.orderCount.toLocaleString('fa-IR')}</td>
                  <td className="p-3">{formatIRR(r.lifetimeValue)}</td>
                  <td className="p-3 text-xs">
                    {r.lastOrderDaysAgo.toLocaleString('fa-IR')} روز پیش
                  </td>
                  <td className="p-3">
                    <Badge tone={SEGMENT_TONE[r.segment]}>{SEGMENT_LABEL[r.segment]}</Badge>
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
