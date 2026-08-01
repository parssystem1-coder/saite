'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { CONTACT_SUBJECTS, contactSchema, type ContactInput, type ContactSubject } from '@/lib/schemas'
import { cn } from '@/lib/utils'

const SUBJECT_LABELS: Record<ContactSubject, string> = {
  consult: 'مشاورهٔ خرید',
  quote: 'استعلام قیمت',
  repair: 'درخواست تعمیر',
  other: 'سایر موارد',
}

/**
 * فرم تماس / استعلام قیمت / درخواست تعمیر.
 *
 * اعتبارسنجی با Zod انجام می‌شود و همان schema بعداً در Server Action
 * بازاستفاده خواهد شد.
 *
 * موضوع و مدل دستگاه از query string خوانده می‌شوند تا دکمهٔ
 * «استعلام قیمت» در صفحهٔ محصول، فرم را از پیش پر کند.
 */
export function ContactForm() {
  const params = useSearchParams()
  const [sent, setSent] = React.useState(false)

  const subjectParam = params.get('subject')
  const defaultSubject: ContactSubject = CONTACT_SUBJECTS.includes(subjectParam as ContactSubject)
    ? (subjectParam as ContactSubject)
    : 'consult'

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: defaultSubject,
      name: '',
      phone: '',
      email: '',
      deviceModel: params.get('model') ?? '',
      message: '',
    },
  })

  // useWatch به‌جای watch: قابل memoize شدن است و با React Compiler سازگار
  const subject = useWatch({ control, name: 'subject' })

  const onSubmit = async (data: ContactInput) => {
    // شبیه‌سازی ارسال — در فاز بک‌اند به Server Action وصل می‌شود
    await new Promise((r) => setTimeout(r, 600))
    console.info('contact request', data)
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
            reset()
            setSent(false)
          }}
        >
          ارسال درخواست دیگر
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="surface-3d rounded-2xl p-6 md:p-8"
    >
      <h2 className="text-lg font-black text-foreground">فرم درخواست</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        فرم را پر کنید تا در سریع‌ترین زمان با شما تماس بگیریم.
      </p>

      <fieldset className="mt-6">
        <legend className="mb-2.5 text-xs font-bold text-muted-foreground">موضوع درخواست</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue('subject', s, { shouldValidate: true })}
              aria-pressed={subject === s}
              className={cn(
                'rounded-xl border px-3.5 py-2 text-xs font-bold transition-all',
                subject === s
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border bg-surface-0/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <FormField id="name" label="نام و نام خانوادگی" required error={errors.name?.message}>
          <Input
            {...register('name')}
            {...fieldAria('name', !!errors.name)}
            placeholder="نام کامل"
          />
        </FormField>

        <FormField id="phone" label="شمارهٔ تماس" required error={errors.phone?.message}>
          <Input
            {...register('phone')}
            {...fieldAria('phone', !!errors.phone)}
            dir="ltr"
            inputMode="tel"
            placeholder="09123456789"
            className="text-right font-mono"
          />
        </FormField>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <FormField id="email" label="پست الکترونیک (اختیاری)" error={errors.email?.message}>
          <Input
            {...register('email')}
            {...fieldAria('email', !!errors.email)}
            dir="ltr"
            type="email"
            placeholder="name@example.com"
            className="text-right font-mono"
          />
        </FormField>

        <FormField
          id="deviceModel"
          label="مدل دستگاه (اختیاری)"
          error={errors.deviceModel?.message}
          hint="مثلاً Canon LBP-2900"
        >
          <Input
            {...register('deviceModel')}
            {...fieldAria('deviceModel', !!errors.deviceModel, true)}
            dir="ltr"
            placeholder="Canon LBP-2900"
            className="text-right font-mono"
          />
        </FormField>
      </div>

      <div className="mt-5">
        <FormField id="message" label="توضیحات" required error={errors.message?.message}>
          <textarea
            {...register('message')}
            {...fieldAria('message', !!errors.message)}
            rows={5}
            placeholder="نیاز خود را شرح دهید…"
            className="w-full rounded-xl border border-border bg-input p-3.5 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25"
          />
        </FormField>
      </div>

      <Button type="submit" size="lg" className="mt-7 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            در حال ارسال…
          </>
        ) : (
          <>
            <Send />
            ارسال درخواست
          </>
        )}
      </Button>
    </form>
  )
}
