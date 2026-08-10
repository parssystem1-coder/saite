'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, PackageX, AlertTriangle, CheckCircle2, RefreshCw, Pencil, History } from 'lucide-react'
import { Badge, Stat } from '@/components/admin/finance/finance-shared'
import { Button } from '@/components/ui/button'

type Status = 'all' | 'ok' | 'low' | 'out'
type Adjustment = { id: string; delta: number; reason: string; note: string | null; actorId: string; createdAt: string }

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

  const [adjusting, setAdjusting] = React.useState<InventoryRow | null>(null)
  const [deltaText, setDeltaText] = React.useState('')
  const [reason, setReason] = React.useState('correction')
  const [note, setNote] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [historyFor, setHistoryFor] = React.useState<InventoryRow | null>(null)
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-adjustments', historyFor?.productId], enabled: Boolean(historyFor),
    queryFn: async () => { const response = await fetch(`/api/products/${historyFor!.productId}/inventory/adjustments`); if (!response.ok) throw new Error('دریافت تاریخچه ناموفق بود'); return (await response.json() as { items: Adjustment[] }).items },
  })

  const adjust = async () => {
    if (!adjusting) return
    const delta = Number(deltaText)
    if (!Number.isSafeInteger(delta) || delta === 0) {
      window.alert('تغییر موجودی باید عدد صحیح غیرصفر باشد.')
      return
    }
    setSaving(true)
    const response = await fetch(`/api/products/${adjusting.productId}/inventory/adjust`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, reason, note: note || undefined }),
    })
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: string } | null
      window.alert(detail?.error || 'ثبت تغییر موجودی ناموفق بود.')
      setSaving(false)
      return
    }
    setSaving(false)
    setAdjusting(null)
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
                return <tr key={row.productId} className="border-t border-border"><td className="p-3"><div>{row.name}</div><div className="font-mono text-xs text-muted-foreground">{row.sku}</div></td><td className="p-3">{row.quantityOnHand.toLocaleString('fa-IR')}</td><td className="p-3 text-amber-300">{row.quantityReserved.toLocaleString('fa-IR')}</td><td className="p-3 font-semibold">{row.quantityAvailable.toLocaleString('fa-IR')}</td><td className="p-3">{row.activeReservations.toLocaleString('fa-IR')}</td><td className="p-3"><Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge></td><td className="p-3"><Button size="sm" variant="outline" onClick={() => { setAdjusting(row); setDeltaText(''); setReason('correction'); setNote('') }} className="gap-1.5"><Pencil className="size-3.5" />اصلاح</Button><Button size="sm" variant="ghost" onClick={() => setHistoryFor(row)} title="تاریخچه"><History className="size-4" /></Button></td></tr>
              })}</tbody>
            </table>
            {!loading && rows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">رکورد موجودی یافت نشد.</div>}
          </div>
        )}
      </section>
      {historyFor && <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="تاریخچه موجودی"><div className="surface-3d w-full max-w-lg rounded-2xl p-5"><div className="mb-4 flex items-center"><div><h2 className="font-bold">تاریخچهٔ موجودی</h2><p className="text-sm text-muted-foreground">{historyFor.name}</p></div><span className="flex-1" /><Button variant="outline" size="sm" onClick={() => setHistoryFor(null)}>بستن</Button></div>{historyLoading ? <p className="text-sm text-muted-foreground">در حال دریافت…</p> : <div className="max-h-80 overflow-y-auto">{history.length === 0 ? <p className="text-sm text-muted-foreground">تغییری ثبت نشده است.</p> : history.map((item) => <div key={item.id} className="border-t border-border py-3 text-sm"><div className="flex gap-3"><b className={item.delta > 0 ? 'text-emerald-400' : 'text-destructive'}>{item.delta > 0 ? '+' : ''}{item.delta}</b><span>{item.reason}</span><span className="mr-auto text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('fa-IR')}</span></div>{item.note && <p className="mt-1 text-muted-foreground">{item.note}</p>}</div>)}</div>}</div></div>}
      {adjusting && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="اصلاح موجودی">
        <div className="surface-3d w-full max-w-md rounded-2xl p-5">
          <div className="mb-4"><h2 className="font-bold">اصلاح موجودی</h2><p className="mt-1 text-sm text-muted-foreground">{adjusting.name} — موجودی قابل فروش: {adjusting.quantityAvailable.toLocaleString('fa-IR')}</p></div>
          <label className="mb-3 block text-sm">تغییر موجودی<input autoFocus value={deltaText} onChange={(e) => setDeltaText(e.target.value)} inputMode="numeric" placeholder="مثلاً ۱۰ یا ‎-۲" className="mt-1 w-full rounded-lg border border-border bg-background p-2" /></label>
          <label className="mb-3 block text-sm">دلیل<select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2"><option value="receipt">ورود کالا</option><option value="correction">اصلاح دستی</option><option value="damaged">آسیب‌دیدگی</option><option value="returned">بازگشت کالا</option><option value="stocktake">انبارگردانی</option></select></label>
          <label className="mb-4 block text-sm">یادداشت <span className="text-muted-foreground">(اختیاری)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1 min-h-20 w-full rounded-lg border border-border bg-background p-2" /></label>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAdjusting(null)} disabled={saving}>انصراف</Button><Button onClick={() => void adjust()} disabled={saving}>{saving ? 'در حال ثبت…' : 'ثبت تغییر'}</Button></div>
        </div>
      </div>}
    </div>
  )
}
