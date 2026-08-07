'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, CircleAlert, CreditCard, Filter, Search } from 'lucide-react'
import { createMockFinanceAdapter } from '@/lib/finance/mock-adapter'
import type { Transaction, TransactionChannel, TransactionKind, TransactionStatus } from '@/types/finance'
import { Badge, Stat, formatIRR, formatJalaliDate } from './finance-shared'

const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: 'در انتظار',
  succeeded: 'موفق',
  failed: 'ناموفق',
  reversed: 'بازگردانده',
}

const STATUS_TONE: Record<TransactionStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  pending: 'warn',
  succeeded: 'success',
  failed: 'danger',
  reversed: 'info',
}

const CHANNEL_LABEL: Record<TransactionChannel, string> = {
  gateway: 'درگاه اینترنتی',
  pos: 'کارتخوان',
  cash: 'نقدی',
  transfer: 'انتقال بانکی',
  wallet: 'کیف پول',
}

export default function TransactionsClient() {
  const adapter = React.useMemo(() => createMockFinanceAdapter(), [])
  const [txs, setTxs] = React.useState<Transaction[]>([])
  const [q, setQ] = React.useState('')
  const [channel, setChannel] = React.useState<'all' | TransactionChannel>('all')
  const [kind, setKind] = React.useState<'all' | TransactionKind>('all')

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync
    setTxs(adapter.listTransactions())
  }, [adapter])

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    return txs.filter((t) => {
      if (channel !== 'all' && t.channel !== channel) return false
      if (kind !== 'all' && t.kind !== kind) return false
      if (!needle) return true
      return (
        t.reference.toLowerCase().includes(needle) ||
        (t.customerName?.toLowerCase().includes(needle) ?? false) ||
        (t.providerRef?.toLowerCase().includes(needle) ?? false)
      )
    })
  }, [txs, q, channel, kind])

  const stats = React.useMemo(() => {
    const inflow = txs.filter((t) => t.kind === 'inflow' && t.status === 'succeeded').reduce((s, t) => s + t.amount, 0)
    const outflow = txs.filter((t) => t.kind === 'outflow' && t.status === 'succeeded').reduce((s, t) => s + t.amount, 0)
    const pending = txs.filter((t) => t.status === 'pending').length
    const net = inflow - outflow
    return { inflow, outflow, net, pending }
  }, [txs])

  const handleMarkStatus = (id: string, status: TransactionStatus) => {
    const target = txs.find((t) => t.id === id)
    if (!target) return
    setTxs(adapter.saveTransaction({ ...target, status }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={ArrowDownRight} label="جمع ورودی" value={formatIRR(stats.inflow)} tone="success" />
        <Stat icon={ArrowUpRight} label="جمع خروجی" value={formatIRR(stats.outflow)} tone="danger" />
        <Stat icon={CreditCard} label="خالص" value={formatIRR(stats.net)} />
        <Stat icon={CircleAlert} label="در انتظار" value={String(stats.pending)} tone="warn" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو در شمارهٔ پیگیری، مشتری، ref درگاه…"
              className="w-full rounded-lg border border-border bg-surface-1 py-2 pe-9 ps-3 text-sm"
              aria-label="جستجوی تراکنش"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="size-4 text-muted-foreground" aria-hidden />
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
              className="rounded-lg border border-border bg-surface-1 px-2 py-1.5 text-xs"
              aria-label="فیلتر کانال"
            >
              <option value="all">همهٔ کانال‌ها</option>
              {(Object.keys(CHANNEL_LABEL) as TransactionChannel[]).map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL[c]}
                </option>
              ))}
            </select>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as typeof kind)}
              className="rounded-lg border border-border bg-surface-1 px-2 py-1.5 text-xs"
              aria-label="فیلتر نوع"
            >
              <option value="all">همه</option>
              <option value="inflow">ورودی</option>
              <option value="outflow">خروجی</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-4">پیگیری</th>
                <th className="p-4">نوع</th>
                <th className="p-4">مبلغ</th>
                <th className="p-4">کانال / درگاه</th>
                <th className="p-4">مشتری</th>
                <th className="p-4">تاریخ</th>
                <th className="p-4">وضعیت</th>
                <th className="p-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-4 font-mono text-xs">{t.reference}</td>
                  <td className="p-4">
                    {t.kind === 'inflow' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <ArrowDownRight className="size-3.5" aria-hidden />
                        ورودی
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <ArrowUpRight className="size-3.5" aria-hidden />
                        خروجی
                      </span>
                    )}
                  </td>
                  <td className="p-4">{formatIRR(t.amount)}</td>
                  <td className="p-4 text-xs">
                    <div>{CHANNEL_LABEL[t.channel]}</div>
                    {t.providerName && (
                      <div className="text-muted-foreground">
                        {t.providerName}{t.providerRef ? ` • ${t.providerRef}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs">{t.customerName ?? '—'}</td>
                  <td className="p-4 text-xs">{formatJalaliDate(t.occurredAt)}</td>
                  <td className="p-4">
                    <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </td>
                  <td className="p-4">
                    {t.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkStatus(t.id, 'succeeded')}
                          className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                        >
                          تایید
                        </button>
                        <button
                          onClick={() => handleMarkStatus(t.id, 'failed')}
                          className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          رد
                        </button>
                      </div>
                    )}
                    {t.status === 'succeeded' && t.kind === 'inflow' && (
                      <button
                        onClick={() => handleMarkStatus(t.id, 'reversed')}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        بازگرداندن
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            هیچ تراکنشی با این فیلتر پیدا نشد.
          </div>
        )}
      </section>
    </div>
  )
}
