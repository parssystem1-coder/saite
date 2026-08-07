'use client'

import * as React from 'react'
import { Inbox, Phone, MessageCircle, Mail, CheckCircle2, UserCheck, Archive } from 'lucide-react'
import { createMockCommunicationsAdapter } from '@/lib/communications/mock-adapter'
import type { Inquiry, InquiryChannel, InquiryStatus } from '@/types/communications'
import { Badge, Stat, formatRelative } from '@/components/admin/finance/finance-shared'

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'جدید',
  in_progress: 'در حال پیگیری',
  contacted: 'تماس گرفته شد',
  converted: 'تبدیل به مشتری',
  archived: 'بایگانی',
}
const STATUS_TONE: Record<InquiryStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  new: 'danger',
  in_progress: 'warn',
  contacted: 'info',
  converted: 'success',
  archived: 'default',
}

const CHANNEL_ICON: Record<InquiryChannel, React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  contact_form: Inbox,
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
}
const CHANNEL_LABEL: Record<InquiryChannel, string> = {
  contact_form: 'فرم تماس',
  whatsapp: 'واتساپ',
  phone: 'تلفن',
  email: 'ایمیل',
}

export default function InquiriesClient() {
  const adapter = React.useMemo(() => createMockCommunicationsAdapter(), [])
  const [inqs, setInqs] = React.useState<Inquiry[]>([])
  const [statusFilter, setStatusFilter] = React.useState<'all' | InquiryStatus>('all')
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInqs(adapter.listInquiries())
  }, [adapter])

  const filtered = statusFilter === 'all' ? inqs : inqs.filter((i) => i.status === statusFilter)

  const stats = React.useMemo(() => {
    const newCount = inqs.filter((i) => i.status === 'new').length
    const inProg = inqs.filter((i) => i.status === 'in_progress' || i.status === 'contacted').length
    const converted = inqs.filter((i) => i.status === 'converted').length
    return { newCount, inProg, converted, total: inqs.length }
  }, [inqs])

  const handleStatusChange = (id: string, status: InquiryStatus) => {
    const target = inqs.find((i) => i.id === id)
    if (!target) return
    setInqs(adapter.saveInquiry({ ...target, status }))
  }

  const handleAssign = (id: string, assignee: string) => {
    const target = inqs.find((i) => i.id === id)
    if (!target) return
    setInqs(adapter.saveInquiry({ ...target, assignedTo: assignee }))
  }

  const handleNoteChange = (id: string, note: string) => {
    const target = inqs.find((i) => i.id === id)
    if (!target) return
    setInqs(adapter.saveInquiry({ ...target, internalNote: note }))
  }

  const selected = selectedId ? inqs.find((i) => i.id === selectedId) : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Inbox} label="جدید" value={stats.newCount.toLocaleString('fa-IR')} tone="danger" />
        <Stat icon={UserCheck} label="در پیگیری" value={stats.inProg.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={CheckCircle2} label="تبدیل شده" value={stats.converted.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={Archive} label="کل" value={stats.total.toLocaleString('fa-IR')} />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {(['all', 'new', 'in_progress', 'contacted', 'converted', 'archived'] as const).map((s) => (
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
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">مشتری</th>
                <th className="p-3">کانال</th>
                <th className="p-3">علاقه‌مندی</th>
                <th className="p-3">دریافت</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const Icon = CHANNEL_ICON[i.channel]
                return (
                  <tr
                    key={i.id}
                    className={`border-t border-border ${selectedId === i.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-3">
                      <div>{i.customerName}</div>
                      <div className="font-mono text-xs text-muted-foreground">{i.phone}</div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Icon className="size-3.5" aria-hidden />
                        {CHANNEL_LABEL[i.channel]}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{i.productInterest ?? '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">{formatRelative(i.receivedAt)}</td>
                    <td className="p-3">
                      <Badge tone={STATUS_TONE[i.status]}>{STATUS_LABEL[i.status]}</Badge>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedId(selectedId === i.id ? null : i.id)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                      >
                        {selectedId === i.id ? 'بستن' : 'باز کردن'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="surface-3d rounded-2xl p-5">
          <h3 className="mb-4 text-base font-semibold">جزئیات درخواست — {selected.customerName}</h3>

          <div className="mb-4 rounded-lg bg-surface-1 p-4 text-sm">{selected.message}</div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">وضعیت</span>
              <select
                value={selected.status}
                onChange={(e) => handleStatusChange(selected.id, e.target.value as InquiryStatus)}
                className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              >
                {(Object.keys(STATUS_LABEL) as InquiryStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">ارجاع به</span>
              <input
                value={selected.assignedTo ?? ''}
                onChange={(e) => handleAssign(selected.id, e.target.value)}
                placeholder="نام کارشناس"
                className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-xs text-muted-foreground">یادداشت داخلی</span>
            <textarea
              value={selected.internalNote ?? ''}
              onChange={(e) => handleNoteChange(selected.id, e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              placeholder="یادداشت برای همکاران دیگر…"
            />
          </label>
        </section>
      )}
    </div>
  )
}
