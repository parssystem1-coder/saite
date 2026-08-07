'use client'

import * as React from 'react'
import { TrendingUp, ShoppingBag, BadgeDollarSign, ArrowLeftRight } from 'lucide-react'
import { createMockReportsAdapter } from '@/lib/reports/mock-adapter'
import { MiniBarChart } from './mini-chart'
import { Stat, formatIRR } from '@/components/admin/finance/finance-shared'

export default function SalesReportClient() {
  const adapter = React.useMemo(() => createMockReportsAdapter(), [])
  const [range, setRange] = React.useState<'12m' | '6m' | '3m'>('12m')

  const series = adapter.salesSeries()
  const summary = adapter.salesSummary()

  const visibleSeries =
    range === '12m' ? series : range === '6m' ? series.slice(-6) : series.slice(-3)

  const trendPct = (() => {
    if (visibleSeries.length < 2) return 0
    const first = visibleSeries[0]?.value ?? 0
    const last = visibleSeries[visibleSeries.length - 1]?.value ?? 0
    if (first === 0) return 0
    return Math.round(((last - first) / first) * 100)
  })()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={BadgeDollarSign} label="جمع فروش" value={formatIRR(summary.inflow)} tone="success" />
        <Stat icon={ArrowLeftRight} label="خالص" value={formatIRR(summary.net)} />
        <Stat icon={ShoppingBag} label="تعداد سفارش" value={summary.orderCount.toLocaleString('fa-IR')} />
        <Stat icon={TrendingUp} label="میانگین سبد" value={formatIRR(summary.avgOrder)} />
      </div>

      <section className="surface-3d rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">روند فروش ماهانه</h3>
            <p className="text-xs text-muted-foreground">
              رشد بازه: {trendPct >= 0 ? '+' : ''}
              {trendPct.toLocaleString('fa-IR')}٪
            </p>
          </div>
          <div className="flex gap-1">
            {(['3m', '6m', '12m'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs ${range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {r === '3m' ? '۳ ماه' : r === '6m' ? '۶ ماه' : '۱۲ ماه'}
              </button>
            ))}
          </div>
        </div>
        <MiniBarChart data={visibleSeries} formatValue={formatIRR} />
      </section>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="border-b border-border p-4 text-sm font-semibold">جزئیات ماه‌ها</div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">ماه</th>
                <th className="p-3">فروش</th>
                <th className="p-3">درصد از کل</th>
              </tr>
            </thead>
            <tbody>
              {visibleSeries.map((p) => {
                const totalSum = visibleSeries.reduce((s, x) => s + x.value, 0)
                const pct = totalSum > 0 ? ((p.value / totalSum) * 100).toFixed(1) : '0'
                return (
                  <tr key={p.label} className="border-t border-border">
                    <td className="p-3">{p.label}</td>
                    <td className="p-3">{formatIRR(p.value)}</td>
                    <td className="p-3">{Number(pct).toLocaleString('fa-IR')}٪</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
