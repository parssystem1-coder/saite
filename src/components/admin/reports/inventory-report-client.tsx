'use client'

import * as React from 'react'
import { Boxes, PackageX, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createMockReportsAdapter } from '@/lib/reports/mock-adapter'
import { Badge, Stat } from '@/components/admin/finance/finance-shared'

const STATUS_LABEL = { ok: 'موجود', low: 'رو به اتمام', out: 'ناموجود' } as const
const STATUS_TONE = { ok: 'success', low: 'warn', out: 'danger' } as const

export default function InventoryReportClient() {
  const adapter = React.useMemo(() => createMockReportsAdapter(), [])
  const rows = adapter.inventoryStatus()

  const stats = React.useMemo(() => {
    const ok = rows.filter((r) => r.status === 'ok').length
    const low = rows.filter((r) => r.status === 'low').length
    const out = rows.filter((r) => r.status === 'out').length
    return { ok, low, out, total: rows.length }
  }, [rows])

  const [filter, setFilter] = React.useState<'all' | 'ok' | 'low' | 'out'>('all')
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Boxes} label="کل SKU" value={stats.total.toLocaleString('fa-IR')} />
        <Stat icon={CheckCircle2} label="موجود" value={stats.ok.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={AlertTriangle} label="رو به اتمام" value={stats.low.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={PackageX} label="ناموجود" value={stats.out.toLocaleString('fa-IR')} tone="danger" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {(['all', 'out', 'low', 'ok'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs ${filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {s === 'all' ? 'همه' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">کالا</th>
                <th className="p-3">موجودی</th>
                <th className="p-3">نقطهٔ سفارش</th>
                <th className="p-3">فروش ۳۰ روز</th>
                <th className="p-3">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.sku} className="border-t border-border">
                  <td className="p-3">
                    <div>{r.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.sku}</div>
                  </td>
                  <td className="p-3">{r.onHand.toLocaleString('fa-IR')}</td>
                  <td className="p-3 text-muted-foreground">
                    {r.reorderPoint.toLocaleString('fa-IR')}
                  </td>
                  <td className="p-3">{r.turnover30d.toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            هیچ کالایی با این فیلتر پیدا نشد.
          </div>
        )}
      </section>
    </div>
  )
}
