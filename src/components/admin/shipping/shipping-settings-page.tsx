'use client'

import * as React from 'react'
import { MapPinned, Plus, Settings2, ShieldCheck, Truck } from 'lucide-react'
import { isMethodEligible, quoteShipping } from '@/lib/shipping/eligibility'
import { validateShippingMethod } from '@/lib/shipping/validation'
import { createMockShippingAdapter } from '@/lib/shipping/mock-adapter'
import type { ShippingMethod } from '@/types/shipping'

const tabs = [
  ['methods', 'روش‌های ارسال'],
  ['carriers', 'شرکت‌های حمل'],
  ['zones', 'مناطق پوشش'],
  ['rules', 'قوانین قیمت‌گذاری'],
] as const

const sampleContext = {
  orderTotal: 1000000,
  itemCount: 1,
  weightGrams: 2000,
  province: 'تهران',
  city: 'تهران',
  categorySlugs: ['printer'],
  customerSegments: ['new'],
  carrierSupportsCashOnDelivery: true,
}

export default function ShippingSettingsClient() {
  const adapter = React.useMemo(() => createMockShippingAdapter(), [])
  const [methods, setMethods] = React.useState<ShippingMethod[]>([])
  const [tab, setTab] = React.useState<(typeof tabs)[number][0]>('methods')
  const [errors, setErrors] = React.useState<string[]>([])
  const [newName, setNewName] = React.useState('')
  const [newCarrier, setNewCarrier] = React.useState('post')
  const [newMode, setNewMode] = React.useState<ShippingMethod['paymentMode']>('prepaid')

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mock-adapter sync with localStorage
    setMethods(adapter.list())
  }, [adapter])

  const handleAdd = () => {
    const draft: ShippingMethod = {
      id: `m-${Date.now()}`,
      name: newName.trim() || 'روش جدید',
      carrierId: newCarrier,
      serviceName: newName.trim() || 'سرویس جدید',
      paymentMode: newMode,
      pricingModel: newMode === 'free' ? 'free' : 'flat_rate',
      flatRate: newMode === 'free' ? 0 : 85000,
      zones: ['zone-national'],
      estimatedMinDays: 2,
      estimatedMaxDays: 3,
      customerLabel: newName.trim() || 'روش جدید',
      customerDescription: 'توضیح پیش‌فرض',
      active: true,
      priority: methods.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const validation = validateShippingMethod(draft)
    if (validation.length > 0) {
      setErrors(validation)
      return
    }
    setErrors([])
    const next = adapter.save(draft)
    setMethods(next)
    setNewName('')
  }

  const handleToggle = (id: string) => {
    const target = methods.find((m) => m.id === id)
    if (!target) return
    const updated = { ...target, active: !target.active }
    const validation = validateShippingMethod(updated)
    if (validation.length) {
      setErrors(validation)
      return
    }
    setMethods(adapter.save(updated))
  }

  const handleRemove = (id: string) => {
    setMethods(adapter.remove(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Truck} label="روش‌های فعال" value={String(methods.filter((m) => m.active).length)} />
        <Stat icon={MapPinned} label="مناطق پوشش" value="۱۸" />
        <Stat icon={ShieldCheck} label="پس‌کرایه فعال" value={String(methods.filter((m) => m.paymentMode === 'cash_on_delivery').length)} />
        <Stat icon={Settings2} label="قوانین قیمت" value="۱۴" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex overflow-auto border-b border-border">
          {tabs.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm ${tab === k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {tab === 'methods' ? (
          <div className="overflow-x-auto">
            <div className="flex flex-wrap gap-3 p-4">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="نام روش جدید"
                className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              />
              <select
                value={newCarrier}
                onChange={(e) => setNewCarrier(e.target.value)}
                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              >
                <option value="post">پست</option>
                <option value="tipax">تیپاکس</option>
                <option value="chapar">چاپار</option>
              </select>
              <select
                value={newMode}
                onChange={(e) => setNewMode(e.target.value as ShippingMethod['paymentMode'])}
                className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              >
                <option value="prepaid">پیش‌کرایه</option>
                <option value="cash_on_delivery">پس‌کرایه</option>
                <option value="free">رایگان</option>
              </select>
              <button
                onClick={handleAdd}
                className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                <Plus className="me-2 size-4" />
                افزودن روش
              </button>
            </div>

            {errors.length > 0 && (
              <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <ul className="list-disc pr-5">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <table className="w-full min-w-[850px] text-right text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="p-4">روش</th>
                  <th className="p-4">مدل پرداخت</th>
                  <th className="p-4">قابل پرداخت (نمونه)</th>
                  <th className="p-4">واجد شرایط؟</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => {
                  const eligible = isMethodEligible(m, sampleContext)
                  let payable: string
                  try {
                    const q = quoteShipping(m, sampleContext)
                    payable = `${q.customerPayable.toLocaleString('fa-IR')} ﷼`
                  } catch {
                    payable = '—'
                  }
                  return (
                    <tr key={m.id} className="border-t border-border">
                      <td className="p-4">
                        <b>{m.name}</b>
                        <small className="block text-muted-foreground">{m.carrierId}</small>
                      </td>
                      <td className="p-4">
                        <Badge
                          t={m.paymentMode === 'prepaid' ? 'پیش‌کرایه' : m.paymentMode === 'cash_on_delivery' ? 'پس‌کرایه' : 'رایگان'}
                          tone={m.paymentMode === 'cash_on_delivery' ? 'amber' : m.paymentMode === 'free' ? 'green' : 'primary'}
                        />
                      </td>
                      <td className="p-4 text-xs">{payable}</td>
                      <td className="p-4">
                        <Badge t={eligible ? 'بله' : 'خیر'} tone={eligible ? 'green' : 'gray'} />
                      </td>
                      <td className="p-4">
                        <Badge t={m.active ? 'فعال' : 'غیرفعال'} tone={m.active ? 'green' : 'gray'} />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggle(m.id)}
                            className="rounded-lg border border-border px-2 py-1 text-xs"
                          >
                            {m.active ? 'غیرفعال' : 'فعال'}
                          </button>
                          <button
                            onClick={() => handleRemove(m.id)}
                            className="rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="p-4 text-xs text-muted-foreground">
              پیش‌نمایش «قابل پرداخت» با سفارش نمونه ۱٬۰۰۰٬۰۰۰ ﷼ و وزن ۲kg (تهران) محاسبه شده — منطق از <code className="font-mono">isMethodEligible</code> و <code className="font-mono">quoteShipping</code> می‌آید.
            </p>
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="text-lg font-bold">{tabs.find((x) => x[0] === tab)?.[1]}</p>
            <p className="mt-2 text-sm text-muted-foreground">این بخش برای تعریف و ویرایش داده‌های همین حوزه آماده است.</p>
            <button className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">افزودن مورد جدید</button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm">
        <b className="text-amber-200">قاعده مهم پس‌کرایه</b>
        <p className="mt-2 text-muted-foreground">
          پس‌کرایه «ارسال رایگان» نیست. مبلغ پرداختی مشتری در checkout صفر است، اما پیام «هزینه حمل هنگام تحویل به شرکت حمل پرداخت می‌شود» (از <code className="font-mono">customerShippingMessage</code>) باید نمایش داده شود و هزینه واقعی در سفارش مدیر حفظ شود.
        </p>
      </section>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4">
      <Icon className="size-5 text-primary" />
      <span className="mt-3 block text-xs text-muted-foreground">{label}</span>
      <b className="text-2xl">{value}</b>
    </div>
  )
}

function Badge({ t, tone }: { t: string; tone: string }) {
  const c =
    tone === 'green'
      ? 'bg-stock-in/15 text-stock-in'
      : tone === 'amber'
        ? 'bg-stock-low/15 text-stock-low'
        : tone === 'gray'
          ? 'bg-muted text-muted-foreground'
          : 'bg-primary/15 text-primary'
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] ${c}`}>{t}</span>
}
