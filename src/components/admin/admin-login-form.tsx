'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Eye, EyeOff, Loader2, Lock, LogIn, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { requestAdminLogin } from '@/lib/auth/admin-login-client'
import {
  LOCKOUT_DURATION_MS,
  MAX_LOGIN_ATTEMPTS,
} from '@/lib/auth/admin-login-contract'
import { DEFAULT_REDIRECT, isAdminPath, resolveSafeRedirect } from '@/lib/auth/safe-redirect'
import { adminLoginSchema, type AdminLoginInput } from '@/lib/schemas'
import { useLoginThrottle } from '@/hooks/use-login-throttle'

/**
 * فرم ورود مدیر.
 *
 * تفاوت‌های عمدی با فرم مشتریان:
 *  • بدون لینک «ثبت‌نام» — حساب مدیر در پنل ساخته می‌شود
 *  • بدون «ورود با گوگل/گیت‌هاب»
 *  • بدون «رمز را فراموش کرده‌ام» خودکار — بازیابی از مسیر اداری
 *  • پیام خطای یکسان برای نام کاربری و رمز غلط
 *  • قفل موقت پس از چند تلاش ناموفق
 */
export function AdminLoginForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [formError, setFormError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)

  const throttle = useLoginThrottle({
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    lockoutSeconds: Math.round(LOCKOUT_DURATION_MS / 1000),
  })
  const { isLocked, secondsLeft } = throttle

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data: AdminLoginInput) => {
    if (isLocked) return
    setFormError(null)

    /*
      تأیید روی سرور انجام می‌شود. این تابع هیچ دانشی از رمز
      ندارد — فقط درخواست می‌فرستد و پاسخ را می‌خواند.
    */
    const result = await requestAdminLogin(data.username, data.password)

    if (!result.ok) {
      // رمز پاک می‌شود تا تلاش دوباره آگاهانه باشد، نه Enter پی‌درپی
      setValue('password', '')
      throttle.registerFailure()
      setFormError(result.message)
      return
    }

    throttle.reset()

    // مقصد فقط اگر مسیر داخلی معتبر باشد پذیرفته می‌شود
    const requested = params.get('redirect')
    const target = isAdminPath(requested)
      ? resolveSafeRedirect(requested, DEFAULT_REDIRECT.admin)
      : DEFAULT_REDIRECT.admin

    /*
      `refresh` پیش از `replace` لازم است: کوکی تازه ست شده و
      Server Componentها باید دوباره با نشست جدید اجرا شوند.
      بدون این، layout پنل همان نتیجهٔ «بدون نشست» را از کش
      برمی‌گرداند و کاربر به حلقهٔ ریدایرکت می‌افتد.
    */
    router.refresh()
    router.replace(target)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && !isLocked && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      {isLocked && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-stock-low/30 bg-stock-low/10 p-3 text-xs leading-relaxed text-stock-low"
        >
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          به دلیل تلاش‌های ناموفق، ورود موقتاً قفل شد. لطفاً {secondsLeft} ثانیه صبر کنید.
        </p>
      )}

      <FormField id="username" label="نام کاربری" required error={errors.username?.message}>
        <div className="relative">
          <User
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            {...register('username')}
            {...fieldAria('username', !!errors.username)}
            dir="ltr"
            autoComplete="username"
            placeholder="admin"
            disabled={isLocked}
            className="pr-10 text-right font-mono"
          />
        </div>
      </FormField>

      <FormField id="password" label="رمز عبور" required error={errors.password?.message}>
        <div className="relative">
          <Lock
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            {...register('password')}
            {...fieldAria('password', !!errors.password)}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isLocked}
            className="pr-10 pl-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
            aria-pressed={showPassword}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FormField>

      <div className="flex justify-end">
        <Link
          href="/admin/recover"
          className="text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          دسترسی خود را از دست داده‌اید؟
        </Link>
      </div>

      {throttle.showWarning && (
        <p className="text-[11px] text-stock-low" role="status">
          {throttle.remainingAttempts} تلاش باقی مانده تا قفل موقت.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || isLocked}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            در حال بررسی…
          </>
        ) : (
          <>
            <LogIn />
            ورود به پنل مدیریت
          </>
        )}
      </Button>
    </form>
  )
}
