'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, PackageX, AlertTriangle, CheckCircle2, RefreshCw, Pencil } from 'lucide-react'
import { Badge, Stat } from '@/components/admin/finance/finance-shared'
import { Button } from '@/components/ui/button'

type Status = 'all' | 'ok' | 'low' | 'out'
type InventoryRow = {
  productId: string
  sku: string
  name: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  activeReservations: number
}

const STATUS_LABEL: Record<Exclude<Status, 'all'>, string> = { ok: 'موجود', low: 'رو به اتمام', out: 'ناموجود' }
const STATUS_TONE = { ok: 'success', low: 'warn', out: 'danger' } as const

function statusFor(available: number): Exclude<Status, 'all'> {
  if (available <= 0) return 'out'
  if (available <= 5) return 'low'
  return 'ok'
}

export default function InventoryReportClient() {
  const [filter, setFilter] = React.useState<Status>('all')
  const { data: rows = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['inventory-report', filter],
    queryFn: async (): Promise<InventoryRow[]> => {
      const query = filter === 'all' ? '' : `?status=${filter}`
      const response = await fetch(`/api/inventory${query}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('دریافت دادهٔ واقعی انبار ناموفق بود')
      const data = await response.json() as { items: InventoryRow[] }
      return data.items
    },
  })

  const adjust = async (row: InventoryRow) => {
    const raw = window.prompt(`تغییر موجودی «${row.name}» را وارد کنید.
مثبت = ورود کالا | منفی = خروج/کسری`, '0')
    if (raw === null) return
    const delta = Number(raw)
    if (!Number.isSafeInteger(delta) || delta === 0) {
      window.alert('تغییر موجودی باید عدد صحیح غیرصفر باشد.')
      return
    }
    const note = window.prompt('یادداشت تغییر (اختیاری):', '')
    const response = await fetch(`/api/products/${row.productId}/inventory/adjust`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, reason: 'correction', note: note ?? undefined }),
    })
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: string } | null
      window.alert(detail?.error || 'ثبت تغییر موجودی ناموفق بود.')
      return
    }
    void refetch()
  }

  const stats = React.useMemo(() => ({
    total: rows.length,
    ok: rows.filter((r) => statusFor(r.quantityAvailable) === 'ok').length,
    low: rows.filter((r) => statusFor(r.quantityAvailable) === 'low').length,
    out: rows.filter((r) => statusFor(r.quantityAvailable) === 'out').length,
  }), [rows])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Boxes} label="کل SKU" value={stats.total.toLocaleString('fa-IR')} />
        <Stat icon={CheckCircle2} label="موجود" value={stats.ok.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={AlertTriangle} label="رو به اتمام" value={stats.low.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={PackageX} label="ناموجود" value={stats.out.toLocaleString('fa-IR')} tone="danger" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          {(['all', 'out', 'low', 'ok'] as const).map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`rounded-lg px-3 py-1.5 text-xs ${filter === status ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              {status === 'all' ? 'همه' : STATUS_LABEL[status]}
            </button>
          ))}
          <span className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={loading} className="gap-2">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> به‌روزرسانی
          </Button>
        </div>

        {error ? <div className="p-8 text-center text-sm text-destructive">{error.message}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-right text-sm">
              <thead><tr className="text-xs text-muted-foreground"><th className="p-3">کالا</th><th className="p-3">موجودی فیزیکی</th><th className="p-3">رزرو شده</th><th className="p-3">قابل فروش</th><th className="p-3">رزرو فعال</th><th className="p-3">وضعیت</th><th className="p-3">عملیات</th></tr></thead>
              <tbody>{rows.map((row) => {
                const status = statusFor(row.quantityAvailable)
                return <tr key={row.productId} className="border-t border-border"><td className="p-3"><div>{row.name}</div><div className="font-mono text-xs text-muted-foreground">{row.sku}</div></td><td className="p-3">{row.quantityOnHand.toLocaleString('fa-IR')}</td><td className="p-3 text-amber-300">{row.quantityReserved.toLocaleString('fa-IR')}</td><td className="p-3 font-semibold">{row.quantityAvailable.toLocaleString('fa-IR')}</td><td className="p-3">{row.activeReservations.toLocaleString('fa-IR')}</td><td className="p-3"><Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge></td><td className="p-3"><Button size="sm" variant="outline" onClick={() => void adjust(row)} className="gap-1.5"><Pencil className="size-3.5" />اصلاح</Button></td></tr>
              })}</tbody>
            </table>
            {!loading && rows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">رکورد موجودی یافت نشد.</div>}
          </div>
        )}
      </section>
    </div>
  )
}
