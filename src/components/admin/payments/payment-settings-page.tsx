'use client'

import * as React from 'react'
import { Activity, CreditCard, Plus, ShieldCheck } from 'lucide-react'
import { chooseProvider, validateProvider } from '@/lib/payments/payment-rules'
import { createMockPaymentAdapter } from '@/lib/payments/mock-adapter'
import type { PaymentProvider } from '@/types/payment'

export default function PaymentSettingsClient() {
  const adapter = React.useMemo(() => createMockPaymentAdapter(), [])
  const [providers, setProviders] = React.useState<PaymentProvider[]>([])
  const [tab, setTab] = React.useState<'gateways' | 'transactions' | 'refunds' | 'settings'>('gateways')
  const [errors, setErrors] = React.useState<string[]>([])
  const [name, setName] = React.useState('')
  const [code, setCode] = React.useState<PaymentProvider['code']>('zarinpal')
  const [env, setEnv] = React.useState<PaymentProvider['environment']>('sandbox')
  const [chosen, setChosen] = React.useState<string>('—')

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mock-adapter sync with localStorage
    setProviders(adapter.list())
  }, [adapter])

  const handleAdd = () => {
    const draft: PaymentProvider = {
      id: `prov-${Date.now()}`,
      name: name.trim() || 'درگاه جدید',
      code,
      environment: env,
      active: true,
      priority: providers.length + 1,
      callbackUrl: '/checkout/callback',
      supportsRefund: true,
      supportsPartialRefund: false,
      supportsVerify: true,
      currency: 'IRT',
      minAmount: 10000,
      maxAmount: 100000000,
      timeoutSeconds: 30,
      healthStatus: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const validation = validateProvider(draft)
    if (validation.length) {
      setErrors(validation)
      return
    }
    setErrors([])
    setProviders(adapter.save(draft))
    setName('')
  }

  const handleToggle = (id: string) => {
    const p = providers.find((x) => x.id === id)
    if (!p) return
    const updated = { ...p, active: !p.active }
    const v = validateProvider(updated)
    if (v.length) {
      setErrors(v)
      return
    }
    setProviders(adapter.save(updated))
  }

  const handleRemove = (id: string) => {
    setProviders(adapter.remove(id))
  }

  const handleChooseDemo = () => {
    try {
      const c = chooseProvider(providers, 50000)
      setChosen(`${c.name} (${c.code})`)
    } catch (e) {
      setChosen(e instanceof Error ? e.message : 'خطا')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={CreditCard} label="درگاه فعال" value={String(providers.filter((p) => p.active).length)} />
        <Stat icon={Activity} label="وضعیت سلامت" value={providers.some((p) => p.healthStatus === 'healthy') ? 'سالم' : 'نامشخص'} />
        <Stat icon={ShieldCheck} label="تراکنش موفق امروز" value="۲۸۴" />
        <Stat icon={CreditCard} label="در انتظار verify" value="۳" />
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex overflow-auto border-b border-border">
          <Tab active={tab === 'gateways'} onClick={() => setTab('gateways')}>
            درگاه‌ها
          </Tab>
          <Tab active={tab === 'transactions'} onClick={() => setTab('transactions')}>
            تراکنش‌ها
          </Tab>
          <Tab active={tab === 'refunds'} onClick={() => setTab('refunds')}>
            بازپرداخت‌ها
          </Tab>
          <Tab active={tab === 'settings'} onClick={() => setTab('settings')}>
            تنظیمات عمومی
          </Tab>
        </div>

        {tab === 'gateways' ? (
          <div className="overflow-x-auto">
            <div className="flex flex-wrap gap-3 p-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام درگاه"
                className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              />
              <select value={code} onChange={(e) => setCode(e.target.value as PaymentProvider['code'])} className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm">
                <option value="zarinpal">zarinpal</option>
                <option value="idpay">idpay</option>
                <option value="nextpay">nextpay</option>
                <option value="custom">custom</option>
              </select>
              <select value={env} onChange={(e) => setEnv(e.target.value as PaymentProvider['environment'])} className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm">
                <option value="sandbox">sandbox</option>
                <option value="production">production</option>
              </select>
              <button onClick={handleAdd} className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                <Plus className="me-2 size-4" />
                افزودن درگاه
              </button>
              <button onClick={handleChooseDemo} className="rounded-xl border border-border px-4 py-2 text-sm">
                انتخاب خودکار برای ۵۰٬۰۰۰ ﷼: {chosen}
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

            <table className="w-full min-w-[820px] text-right text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="p-4">درگاه</th>
                  <th className="p-4">محیط</th>
                  <th className="p-4">اولویت</th>
                  <th className="p-4">سلامت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">اعتبارسنجی</th>
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => {
                  const v = validateProvider(p)
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-4">
                        <b>{p.name}</b>
                        <small className="block font-mono text-xs text-muted-foreground">{p.code}</small>
                      </td>
                      <td className="p-4">{p.environment === 'production' ? <Badge t="production" c="green" /> : <Badge t="sandbox" c="amber" />}</td>
                      <td className="p-4">{p.priority}</td>
                      <td className="p-4">
                        <Badge t={p.healthStatus} c={p.healthStatus === 'healthy' ? 'green' : p.healthStatus === 'degraded' ? 'amber' : 'gray'} />
                      </td>
                      <td className="p-4">
                        <Badge t={p.active ? 'فعال' : 'غیرفعال'} c={p.active ? 'green' : 'gray'} />
                      </td>
                      <td className="p-4 text-xs">
                        {v.length === 0 ? <span className="text-stock-in">بدون خطا</span> : <span className="text-destructive">{v[0]}</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleToggle(p.id)} className="rounded-lg border border-border px-2 py-1 text-xs">
                            {p.active ? 'غیرفعال' : 'فعال'}
                          </button>
                          <button onClick={() => handleRemove(p.id)} className="rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">
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
              اعتبارسنجی از <code className="font-mono">validateProvider</code> و انتخاب خودکار از <code className="font-mono">chooseProvider</code> می‌آید. هدر «انتخاب خودکار» کم‌اولویت‌ترین درگاهِ واجدِ مبلغ را نشان می‌دهد.
            </p>
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="text-lg font-bold">{tab === 'transactions' ? 'تراکنش‌ها' : tab === 'refunds' ? 'بازپرداخت‌ها' : 'تنظیمات عمومی'}</p>
            <p className="mt-2 text-sm text-muted-foreground">این بخش باید به API امن و داده واقعی PaymentIntent متصل شود، نه state مرورگر.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm">
        <b className="text-amber-200">قانون امنیتی</b>
        <p className="mt-2 text-muted-foreground">
          API key و secret هرگز در دیتابیس plaintext یا Client Component قرار نگیرند. فقط secret reference ذخیره شود و <code className="font-mono">create/verify/refund</code> از سرور اجرا شود (قرارداد <code className="font-mono">PaymentGatewayAdapter</code>).
        </p>
      </section>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`border-b-2 px-5 py-4 text-sm ${active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
      {children}
    </button>
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

function Badge({ t, c }: { t: string; c: string }) {
  const cls = c === 'green' ? 'bg-stock-in/15 text-stock-in' : c === 'amber' ? 'bg-stock-low/15 text-stock-low' : c === 'gray' ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] ${cls}`}>{t}</span>
}
