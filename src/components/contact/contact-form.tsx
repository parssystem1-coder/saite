'use client'

import { CheckCircle2, Send } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Subject = 'consult' | 'quote' | 'repair' | 'other'

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'consult', label: 'مشاورهٔ خرید' },
  { value: 'quote', label: 'استعلام قیمت' },
  { value: 'repair', label: 'درخواست تعمیر' },
  { value: 'other', label: 'سایر موارد' },
]

interface Errors {
  name?: string
  phone?: string
  message?: string
}

/**
 * فرم تماس/استعلام قیمت.
 *
 * اعتبارسنجی فعلاً دستی و سبک است. در فاز بعد با Zod + React Hook Form
 * جایگزین می‌شود تا همان schema در Server Action هم بازاستفاده شود.
 * ارسال واقعی نیاز به بک‌اند دارد؛ اینجا فقط وضعیت موفقیت شبیه‌سازی می‌شود.
 */
export function ContactForm() {
  const [subject, setSubject] = React.useState<Subject>('consult')
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [deviceModel, setDeviceModel] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [errors, setErrors] = React.useState<Errors>({})
  const [sent, setSent] = React.useState(false)

  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 3) e.name = 'نام باید حداقل ۳ کاراکتر باشد'
    if (!/^09\d{9}$/.test(phone.trim()))
      e.phone = 'شمارهٔ موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد'
    if (message.trim().length < 10) e.message = 'توضیحات باید حداقل ۱۰ کاراکتر باشد'
    return e
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSent(true)
  }

  if (sent) {
    return (
      <div className="surface-3d flex flex-col items-center justify-center rounded-2xl p-10 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-stock-in/15">
          <CheckCircle2 className="size-8 text-stock-in" />
        </div>
        <h2 className="text-lg font-black text-foreground">درخواست شما ثبت شد</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          کارشناسان ما در اولین فرصت کاری با شما تماس می‌گیرند. از اعتماد شما سپاسگزاریم.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSent(false)
            setName('')
            setPhone('')
            setDeviceModel('')
            setMessage('')
          }}
        >
          ارسال درخواست دیگر
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="surface-3d rounded-2xl p-6 md:p-8">
      <h2 className="text-lg font-black text-foreground">فرم درخواست</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        فرم را پر کنید تا در سریع‌ترین زمان با شما تماس بگیریم.
      </p>

      {/* موضوع */}
      <fieldset className="mt-6">
        <legend className="mb-2.5 text-xs font-bold text-muted-foreground">موضوع درخواست</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSubject(s.value)}
              aria-pressed={subject === s.value}
              className={cn(
                'rounded-xl border px-3.5 py-2 text-xs font-bold transition-all',
                subject === s.value
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border bg-surface-0/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id="name" label="نام و نام خانوادگی" error={errors.name}>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام کامل"
            aria-invalid={!!errors.name}
          />
        </Field>

        <Field id="phone" label="شمارهٔ تماس" error={errors.phone}>
          <Input
            id="phone"
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09123456789"
            className="text-right font-mono"
            aria-invalid={!!errors.phone}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field id="device" label="مدل دستگاه (اختیاری)">
          <Input
            id="device"
            dir="ltr"
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder="Canon LBP-2900"
            className="text-right font-mono"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field id="message" label="توضیحات" error={errors.message}>
          <textarea
            id="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="نیاز خود را شرح دهید…"
            aria-invalid={!!errors.message}
            className="w-full rounded-xl border border-border bg-input p-3.5 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </Field>
      </div>

      <Button type="submit" size="lg" className="mt-7 w-full">
        <Send />
        ارسال درخواست
      </Button>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-bold text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
