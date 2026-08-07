'use client'

import * as React from 'react'
import { CheckCircle2, FileText, Save } from 'lucide-react'
import { createMockFinanceAdapter } from '@/lib/finance/mock-adapter'
import type { InvoiceSettings } from '@/types/finance'

export default function InvoiceSettingsClient() {
  const adapter = React.useMemo(() => createMockFinanceAdapter(), [])
  const [form, setForm] = React.useState<InvoiceSettings | null>(null)
  const [saved, setSaved] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage sync
    setForm(adapter.getInvoiceSettings())
  }, [adapter])

  if (!form) return null

  const setField = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    setSaved(false)
  }

  const validate = (s: InvoiceSettings): string[] => {
    const errs: string[] = []
    if (!s.legalName.trim()) errs.push('نام حقوقی الزامی است')
    if (!/^\d{11}$/.test(s.nationalId)) errs.push('شناسه ملی باید ۱۱ رقم باشد')
    if (!/^\d{10,14}$/.test(s.economicCode)) errs.push('شناسه اقتصادی باید ۱۰ تا ۱۴ رقم باشد')
    if (!/^\d{10}$/.test(s.postalCode)) errs.push('کد پستی باید ۱۰ رقم باشد')
    if (!s.address.trim()) errs.push('آدرس الزامی است')
    if (!/^0\d{10}$/.test(s.phone.replace(/[\s-]/g, ''))) errs.push('شمارهٔ تلفن معتبر نیست')
    if (s.defaultTaxPct < 0 || s.defaultTaxPct > 25) errs.push('مالیات باید بین ۰ تا ۲۵ باشد')
    if (!s.numberPattern.includes('{SEQ}')) errs.push('الگوی شماره باید شامل {SEQ} باشد')
    if (s.nextSequence < 1) errs.push('شمارهٔ آغاز باید ≥ ۱ باشد')
    return errs
  }

  const handleSave = () => {
    const errs = validate(form)
    setErrors(errs)
    if (errs.length > 0) return
    const updated = adapter.saveInvoiceSettings(form)
    setForm(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          role="alert"
        >
          <ul className="list-disc pr-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {saved && (
        <div
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
          role="status"
        >
          <CheckCircle2 className="size-4" aria-hidden />
          تنظیمات ذخیره شد
        </div>
      )}

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4" aria-hidden />
          مشخصات حقوقی صادرکننده
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="نام حقوقی">
            <input
              value={form.legalName}
              onChange={(e) => setField('legalName', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="شناسه ملی (۱۱ رقم)">
            <input
              value={form.nationalId}
              onChange={(e) => setField('nationalId', e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="شناسه اقتصادی">
            <input
              value={form.economicCode}
              onChange={(e) => setField('economicCode', e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="کد پستی (۱۰ رقم)">
            <input
              value={form.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="تلفن ثابت">
            <input
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              inputMode="tel"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="ایمیل رسمی">
            <input
              value={form.email ?? ''}
              onChange={(e) => setField('email', e.target.value || undefined)}
              type="email"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="آدرس" className="md:col-span-2">
            <textarea
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </section>

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold">شماره‌گذاری و مالیات</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="الگوی شماره">
            <input
              value={form.numberPattern}
              onChange={(e) => setField('numberPattern', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {'مثال: INV-{YY}-{SEQ}'}
            </p>
          </Field>
          <Field label="شمارهٔ سریال بعدی">
            <input
              value={form.nextSequence}
              onChange={(e) => setField('nextSequence', Number(e.target.value) || 0)}
              type="number"
              min={1}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="مالیات پیش‌فرض (٪)">
            <input
              value={form.defaultTaxPct}
              onChange={(e) => setField('defaultTaxPct', Number(e.target.value) || 0)}
              type="number"
              min={0}
              max={25}
              step={0.5}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </section>

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-4 text-sm font-semibold">چاپ و ظاهر</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.showLogo}
              onChange={(e) => setField('showLogo', e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-sm">نمایش لوگو در فاکتور چاپی</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.showStamp}
              onChange={(e) => setField('showStamp', e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-sm">نمایش مهر و امضا</span>
          </label>
          <Field label="یادداشت پایین فاکتور">
            <textarea
              value={form.footerNote ?? ''}
              onChange={(e) => setField('footerNote', e.target.value || undefined)}
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              placeholder="شرایط پرداخت، جریمهٔ تأخیر، …"
            />
          </Field>
        </div>
      </section>

      <div className="flex justify-start">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg"
        >
          <Save className="size-4" aria-hidden />
          ذخیرهٔ تنظیمات
        </button>
      </div>

    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
