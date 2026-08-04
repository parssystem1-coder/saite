'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, AtSign, CheckCircle2, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { useLoginThrottle } from '@/hooks/use-login-throttle'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/schemas'

/**
 * بازیابی رمز عبور مشتری.
 *
 * ── قاعدهٔ امنیتی کلیدی این صفحه ──────────────────────────────
 * پیام موفقیت **همیشه یکسان** است — چه حساب وجود داشته باشد چه
 * نه. اگر بگوییم «این شماره ثبت نشده»، مهاجم می‌تواند با آزمون
 * پی‌درپی بفهمد چه شماره‌هایی در سیستم هستند (user enumeration)
 * و بعد فقط روی آن‌ها حملهٔ حدس رمز انجام دهد.
 *
 * ── فاز بک‌اند ────────────────────────────────────────────────
 *   POST /api/auth/forgot-password  { identifier }
 *   → همیشه 200 با همان پیام
 *
 * الزامات سمت سرور:
 *   • توکن بازیابی یک‌بارمصرف با انقضای کوتاه (۱۵ دقیقه)
 *   • توکن هش‌شده در دیتابیس ذخیره شود، نه متن ساده
 *   • rate limit روی شماره/ایمیل و IP
 *   • ابطال توکن‌های قبلی هنگام صدور توکن جدید
 *   • ابطال همهٔ نشست‌ها پس از تغییر موفق رمز
 */
export function ForgotPasswordClient() {
  const [sent, setSent] = React.useState(false)

  // جلوگیری از ارسال پی‌درپی — هم ضدهرزنامه، هم ضد شمارش حساب
  const throttle = useLoginThrottle({ maxAttempts: 3, lockoutSeconds: 60 })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  })

  const onSubmit = async () => {
    if (throttle.isLocked) return
    await new Promise((r) => setTimeout(r, 700))
    throttle.registerFailure() // هر ارسال یک «تلاش» شمرده می‌شود
    setSent(true)
  }

  if (sent) {
    return (
      <AuthCard
        title="درخواست ثبت شد"
        description="اگر حسابی با این مشخصات وجود داشته باشد، لینک بازیابی برایتان ارسال می‌شود."
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-stock-in/25 bg-stock-in/8 p-5 text-center">
            <CheckCircle2 className="size-9 text-stock-in" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              پیامک یا ایمیل بازیابی تا چند دقیقهٔ دیگر می‌رسد. اگر دریافت نکردید، پوشهٔ
              هرزنامه را هم بررسی کنید.
            </p>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              <ArrowRight />
              بازگشت به صفحهٔ ورود
            </Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="بازیابی رمز عبور"
      description="شمارهٔ موبایل یا ایمیل حساب خود را وارد کنید تا لینک بازیابی ارسال شود."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField
          id="identifier"
          label="ایمیل یا شمارهٔ موبایل"
          required
          error={errors.identifier?.message}
          hint="همان چیزی که با آن ثبت‌نام کرده‌اید"
        >
          <div className="relative">
            <AtSign
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              {...register('identifier')}
              {...fieldAria('identifier', !!errors.identifier, true)}
              dir="ltr"
              autoComplete="username"
              placeholder="09123456789"
              disabled={throttle.isLocked}
              className="pr-10 text-right font-mono"
            />
          </div>
        </FormField>

        {throttle.isLocked && (
          <p
            role="alert"
            className="rounded-xl border border-stock-low/30 bg-stock-low/10 p-3 text-xs leading-relaxed text-stock-low"
          >
            تعداد درخواست‌ها زیاد بود. لطفاً {throttle.secondsLeft} ثانیه صبر کنید.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || throttle.isLocked}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              در حال ارسال…
            </>
          ) : (
            <>
              <Send />
              ارسال لینک بازیابی
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          رمز را به یاد آوردید؟{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            بازگشت به ورود
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
