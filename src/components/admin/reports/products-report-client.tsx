'use client'

import * as React from 'react'
import { Package, TrendingUp, Boxes } from 'lucide-react'
import { createMockReportsAdapter } from '@/lib/reports/mock-adapter'
import { Stat, formatIRR } from '@/components/admin/finance/finance-shared'

export default function ProductsReportClient() {
  const adapter = React.useMemo(() => createMockReportsAdapter(), [])
  const rows = adapter.productLeaderboard()

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)
  const totalQty = rows.reduce((s, r) => s + r.soldQty, 0)
  const topCategory = (() => {
    const map = new Map<string, number>()
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + r.revenue)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  })()

  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const categories = Array.from(new Set(rows.map((r) => r.category)))
  const filtered = categoryFilter === 'all' ? rows : rows.filter((r) => r.category === categoryFilter)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={TrendingUp} label="جمع فروش کالا" value={formatIRR(totalRevenue)} tone="success" />
        <Stat icon={Boxes} label="جمع تعداد فروش" value={totalQty.toLocaleString('fa-IR')} />
        <Stat icon={Package} label="پرفروش‌ترین دسته" value={topCategory} />
        <Stat icon={Package} label="تعداد SKU" value={rows.length.toLocaleString('fa-IR')} />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            همه
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs ${categoryFilter === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">رتبه</th>
                <th className="p-3">کالا</th>
                <th className="p-3">دسته</th>
                <th className="p-3">تعداد فروش</th>
                <th className="p-3">درآمد</th>
                <th className="p-3">موجودی</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.sku} className="border-t border-border">
                  <td className="p-3 text-xs text-muted-foreground">{(i + 1).toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    <div>{r.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.sku}</div>
                  </td>
                  <td className="p-3 text-xs">{r.category}</td>
                  <td className="p-3">{r.soldQty.toLocaleString('fa-IR')}</td>
                  <td className="p-3">{formatIRR(r.revenue)}</td>
                  <td
                    className={`p-3 ${r.stock === 0 ? 'text-destructive' : r.stock < 5 ? 'text-amber-300' : ''}`}
                  >
                    {r.stock.toLocaleString('fa-IR')}
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
