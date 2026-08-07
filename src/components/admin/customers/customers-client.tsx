'use client'

import * as React from 'react'
import { Search, ShieldCheck, Star, Users, AlertTriangle, X } from 'lucide-react'
import { deriveCustomerSegments } from '@/lib/customers/customer-segmentation'
import { createMockCustomersAdapter } from '@/lib/customers/mock-adapter'
import type { CustomerProfile, CustomerSegment } from '@/types/customer'

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  vip: 'VIP',
  repeat_buyer: 'تکراری',
  business: 'سازمانی',
  new: 'جدید',
  at_risk: 'در معرض ریزش',
  no_purchase: 'بدون خرید',
}

const STATUS_LABEL: Record<CustomerProfile['status'], string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  blocked: 'مسدود',
  pending_followup: 'پیگیری',
}

export default function CustomersClient() {
  const adapter = React.useMemo(() => createMockCustomersAdapter(), [])
  const [customers, setCustomers] = React.useState<CustomerProfile[]>([])
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<CustomerProfile['status'] | 'all'>('all')
  const [segment, setSegment] = React.useState<CustomerSegment | 'all'>('all')
  const [selected, setSelected] = React.useState<CustomerProfile | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with localStorage
    setCustomers(adapter.list())
  }, [adapter])

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    return customers.filter((c) => {
      const matchesStatus = status === 'all' || c.status === status
      const matchesSegment = segment === 'all' || c.segments.includes(segment)
      const hay = [c.name, c.phone, c.email ?? '', c.companyName ?? '', c.id].join(' ').toLowerCase()
      const matchesQ = !needle || hay.includes(needle)
      return matchesStatus && matchesSegment && matchesQ
    })
  }, [customers, q, status, segment])

  const kpiTotal = customers.length
  const kpiActive = customers.filter((c) => c.status === 'active').length
  const kpiRepeat = customers.filter((c) => c.segments.includes('repeat_buyer')).length
  const kpiRisk = customers.filter((c) => c.segments.includes('at_risk')).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} label="کل مشتریان" value={String(kpiTotal)} />
        <Kpi icon={ShieldCheck} label="فعال" value={String(kpiActive)} />
        <Kpi icon={Star} label="تکراری" value={String(kpiRepeat)} />
        <Kpi icon={AlertTriangle} label="در معرض ریزش" value={String(kpiRisk)} />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 p-4 md:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="نام، موبایل، ایمیل یا شناسه"
              className="w-full rounded-xl border border-border bg-surface-1 py-2 pr-9 pl-3 text-sm"
            />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value as CustomerProfile['status'] | 'all')} className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm">
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select value={segment} onChange={(e) => setSegment(e.target.value as CustomerSegment | 'all')} className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm">
            <option value="all">همه سگمنت‌ها</option>
            {Object.entries(SEGMENT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 overflow-auto border-y border-border px-2 py-2">
          {(['all', 'vip', 'business', 'repeat_buyer', 'at_risk'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s as CustomerSegment | 'all')}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${segment === s ? 'bg-primary text-primary-foreground' : 'bg-surface-1 text-muted-foreground'}`}
            >
              {s === 'all' ? 'همه' : SEGMENT_LABEL[s as CustomerSegment]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">مشتری</th>
                <th className="p-3">سگمنت</th>
                <th className="p-3">سفارش‌ها</th>
                <th className="p-3">ارزش کل</th>
                <th className="p-3">آخرین فعالیت</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-surface-1/60">
                  <td className="p-3">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {c.phone} {c.companyName ? `· ${c.companyName}` : ''}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.segments.map((s) => (
                        <span key={s} className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
                          {SEGMENT_LABEL[s]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs">{c.orderCount}</td>
                  <td className="p-3 font-mono text-xs">{c.lifetimeValue.toLocaleString('fa-IR')} ت</td>
                  <td className="p-3 text-xs text-muted-foreground">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('fa-IR') : '—'}</td>
                  <td className="p-3">
                    <button onClick={() => setSelected(c)} className="rounded-lg border border-border px-3 py-1 text-xs">
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">
                    مشتری با این فیلتر پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4">
      <Icon className="size-5 text-primary" />
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function CustomerDrawer({ customer, onClose }: { customer: CustomerProfile; onClose: () => void }) {
  const segments = deriveCustomerSegments(customer)
  return (
    <div className="fixed inset-0 z-50 flex">
      <button aria-label="بستن" onClick={onClose} className="flex-1 bg-black/40 backdrop-blur-sm" />
      <div className="h-full w-[min(96vw,560px)] overflow-y-auto border-s border-border bg-surface-1 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-1 px-4 py-3">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">CUSTOMER PROFILE</div>
            <div className="font-bold">{customer.name}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">
              {customer.phone}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[10px] text-muted-foreground">ارزش طول عمر</div>
              <div className="font-mono text-sm font-bold">{customer.lifetimeValue.toLocaleString('fa-IR')} ت</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[10px] text-muted-foreground">امتیاز وفاداری</div>
              <div className="font-mono text-sm font-bold">{customer.loyaltyPoints}</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[10px] text-muted-foreground">سگمنت‌ها</div>
              <div className="text-xs">{segments.map((s) => SEGMENT_LABEL[s]).join('، ')}</div>
            </div>
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-black">آدرس‌ها — ADDRESS BOOK</h3>
            {customer.addresses.map((a) => (
              <div key={a.id} className="rounded-xl border border-border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{a.label}</span>
                  {a.isDefault && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">پیش‌فرض</span>}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {a.province}، {a.city} — {a.addressLine} — {a.postalCode}
                </div>
                <div className="text-muted-foreground" dir="ltr">
                  {a.phone} — {a.recipientName}
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-black">یادداشت‌ها — NOTES</h3>
            {customer.notes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">یادداشتی ثبت نشده</div>
            ) : (
              customer.notes.map((n) => (
                <div key={n.id} className="rounded-xl border border-border p-3 text-xs">
                  <div className="text-muted-foreground">
                    {n.visibility === 'internal' ? 'داخلی' : 'قابل مشاهده برای مشتری'} · {new Date(n.createdAt).toLocaleDateString('fa-IR')} · {n.createdBy}
                  </div>
                  <div className="mt-1">{n.body}</div>
                </div>
              ))
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-black">رضایت‌نامه — CONSENTS</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 rounded-xl border border-border p-2">
                <input type="checkbox" checked={customer.consents.sms} readOnly /> SMS
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border p-2">
                <input type="checkbox" checked={customer.consents.email} readOnly /> Email
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border p-2">
                <input type="checkbox" checked={customer.consents.whatsapp} readOnly /> WhatsApp
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border p-2">
                <input type="checkbox" checked={customer.consents.marketing} readOnly /> بازاریابی
              </label>
            </div>
            <div className="text-[10px] text-muted-foreground">منبع: {customer.consents.source ?? '—'} · {customer.consents.consentedAt ? new Date(customer.consents.consentedAt).toLocaleDateString('fa-IR') : '—'}</div>
          </section>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
            <b>حریم خصوصی</b>
            <p className="mt-1 text-muted-foreground">کد ملی و آدرس کامل فقط در drawer نمایش داده می‌شود، هرگز در جدول یا URL قرار نمی‌گیرد. خروجی CSV باید audit شود.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
