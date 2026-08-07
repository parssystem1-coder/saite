'use client'

import * as React from 'react'
import { Receipt, Search, Filter, FileText, CircleAlert, Wallet, CheckCircle2 } from 'lucide-react'
import { createMockFinanceAdapter } from '@/lib/finance/mock-adapter'
import type { Invoice, InvoiceStatus } from '@/types/finance'
import { Badge, Stat, formatIRR, formatJalaliDate } from './finance-shared'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'پیش‌نویس',
  issued: 'صادر شده',
  paid: 'پرداخت شده',
  partial: 'پرداخت جزئی',
  overdue: 'سررسید گذشته',
  cancelled: 'لغو شده',
}

const STATUS_TONE: Record<InvoiceStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  draft: 'default',
  issued: 'info',
  paid: 'success',
  partial: 'warn',
  overdue: 'danger',
  cancelled: 'default',
}

const FILTERS: { id: 'all' | InvoiceStatus; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'issued', label: 'صادر شده' },
  { id: 'paid', label: 'پرداخت شده' },
  { id: 'partial', label: 'جزئی' },
  { id: 'overdue', label: 'سررسید گذشته' },
  { id: 'draft', label: 'پیش‌نویس' },
]

export default function InvoicesClient() {
  const adapter = React.useMemo(() => createMockFinanceAdapter(), [])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [q, setQ] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | InvoiceStatus>('all')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync one-shot
    setInvoices(adapter.listInvoices())
  }, [adapter])

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    return invoices.filter((inv) => {
      if (filter !== 'all' && inv.status !== filter) return false
      if (!needle) return true
      return (
        inv.number.toLowerCase().includes(needle) ||
        inv.customerName.toLowerCase().includes(needle) ||
        (inv.customerTaxId?.includes(needle) ?? false)
      )
    })
  }, [invoices, q, filter])

  const stats = React.useMemo(() => {
    const total = invoices.reduce((s, i) => s + i.total, 0)
    const paid = invoices.reduce((s, i) => s + i.paidAmount, 0)
    const overdue = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + (i.total - i.paidAmount), 0)
    const issuedCount = invoices.filter((i) => i.status === 'issued' || i.status === 'partial').length
    return { total, paid, overdue, issuedCount }
  }, [invoices])

  const handleMarkPaid = (id: string) => {
    const target = invoices.find((i) => i.id === id)
    if (!target) return
    const updated: Invoice = { ...target, status: 'paid', paidAmount: target.total }
    setInvoices(adapter.saveInvoice(updated))
  }

  const handleCancel = (id: string) => {
    const target = invoices.find((i) => i.id === id)
    if (!target) return
    const updated: Invoice = { ...target, status: 'cancelled' }
    setInvoices(adapter.saveInvoice(updated))
  }

  const selected = selectedId ? invoices.find((i) => i.id === selectedId) : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Receipt} label="جمع صادره" value={formatIRR(stats.total)} />
        <Stat icon={CheckCircle2} label="پرداخت شده" value={formatIRR(stats.paid)} tone="success" />
        <Stat icon={CircleAlert} label="سررسید گذشته" value={formatIRR(stats.overdue)} tone="danger" />
        <Stat icon={Wallet} label="در انتظار پرداخت" value={String(stats.issuedCount)} tone="warn" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو در شماره، مشتری، شناسه ملی…"
              className="w-full rounded-lg border border-border bg-surface-1 py-2 pe-9 ps-3 text-sm"
              aria-label="جستجوی فاکتور"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Filter className="size-4 text-muted-foreground" aria-hidden />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs ${filter === f.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            هیچ فاکتوری با این فیلتر پیدا نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="p-4">شماره</th>
                  <th className="p-4">مشتری</th>
                  <th className="p-4">صدور</th>
                  <th className="p-4">سررسید</th>
                  <th className="p-4">مبلغ</th>
                  <th className="p-4">پرداخت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="p-4 font-mono text-xs">{inv.number}</td>
                    <td className="p-4">
                      <div>{inv.customerName}</div>
                      {inv.customerTaxId && (
                        <div className="text-xs text-muted-foreground">شناسه: {inv.customerTaxId}</div>
                      )}
                    </td>
                    <td className="p-4 text-xs">{formatJalaliDate(inv.issuedAt)}</td>
                    <td className="p-4 text-xs">
                      {inv.dueAt ? formatJalaliDate(inv.dueAt) : '—'}
                    </td>
                    <td className="p-4">{formatIRR(inv.total)}</td>
                    <td className="p-4">
                      {inv.paidAmount === 0 ? '—' : formatIRR(inv.paidAmount)}
                    </td>
                    <td className="p-4">
                      <Badge tone={STATUS_TONE[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedId(inv.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                        >
                          <FileText className="size-3.5" aria-hidden />
                          مشاهده
                        </button>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                            >
                              علامت پرداخت
                            </button>
                            <button
                              onClick={() => handleCancel(inv.id)}
                              className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              لغو
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && <InvoiceDetail invoice={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

function InvoiceDetail({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <section className="surface-3d rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          جزئیات فاکتور <span className="font-mono">{invoice.number}</span>
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-muted"
        >
          بستن
        </button>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">مشتری</div>
          <div>{invoice.customerName}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">صدور</div>
          <div>{formatJalaliDate(invoice.issuedAt)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">نوع</div>
          <div>
            {invoice.type === 'sale' ? 'فروش' : invoice.type === 'proforma' ? 'پیش‌فاکتور' : 'یادداشت اعتباری'}
          </div>
        </div>
      </div>
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="p-2">شرح</th>
            <th className="p-2">تعداد</th>
            <th className="p-2">قیمت واحد</th>
            <th className="p-2">جمع</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l) => (
            <tr key={l.id} className="border-t border-border">
              <td className="p-2">{l.description}</td>
              <td className="p-2">{l.quantity.toLocaleString('fa-IR')}</td>
              <td className="p-2">{formatIRR(l.unitPrice)}</td>
              <td className="p-2">{formatIRR(l.unitPrice * l.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border text-xs">
            <td className="p-2" colSpan={3}>
              جمع کل قبل از تخفیف
            </td>
            <td className="p-2">{formatIRR(invoice.subtotal)}</td>
          </tr>
          <tr className="text-xs">
            <td className="p-2" colSpan={3}>
              تخفیف
            </td>
            <td className="p-2">− {formatIRR(invoice.discountTotal)}</td>
          </tr>
          <tr className="text-xs">
            <td className="p-2" colSpan={3}>
              مالیات (۹٪)
            </td>
            <td className="p-2">+ {formatIRR(invoice.taxTotal)}</td>
          </tr>
          <tr className="border-t border-border font-semibold">
            <td className="p-2" colSpan={3}>
              مبلغ نهایی
            </td>
            <td className="p-2">{formatIRR(invoice.total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}
