'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MonitorSmartphone,
  ShoppingBag,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard } from '@/components/auth/auth-card'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { IS_DEMO_MODE } from '@/lib/auth/demo-mode'
import { getLoginContextMessage } from '@/lib/auth/login-context'
import { DEFAULT_REDIRECT, isAdminPath, resolveSafeRedirect } from '@/lib/auth/safe-redirect'
import { isDeviceTrusted, trustCurrentDevice } from '@/lib/auth/trusted-devices'
import { isMobileIdentifier, loginSchema, type LoginInput } from '@/lib/schemas'
import { useLoginThrottle } from '@/hooks/use-login-throttle'
import { useRedirectIfAuthenticated } from '@/hooks/use-redirect-if-authenticated'
import { useAuthStore } from '@/store/auth-store'

export function LoginClient() {
  const login = useAuthStore((s) => s.login)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const router = useRouter()
  const params = useSearchParams()

  /** آیا این مرورگر برای حساب واردشده تازه است؟ */
  const [isNewDevice, setIsNewDevice] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  /*
    محدودیت تلاش — همان هوکی که فرم مدیر استفاده می‌کند.
    حساب مشتری هم نشانی و تاریخچهٔ خرید دارد، پس حدس رمز روی آن
    هم باید کند شود. سقف بالاتر از مدیر است چون کاربر عادی
    بیشتر رمز را اشتباه می‌زند.
  */
  const throttle = useLoginThrottle({ maxAttempts: 8, lockoutSeconds: 30 })

  /*
    مقصد بازگشت — همین‌جا یک بار محاسبه می‌شود تا هم برای ریدایرکت
    کاربرِ از قبل واردشده و هم پس از ورود موفق یکسان باشد.
    مسیرهای /admin رد می‌شوند چون این فرم نقش مدیر نمی‌دهد.
  */
  const requestedRedirect = params.get('redirect')
  const destination = isAdminPath(requestedRedirect)
    ? DEFAULT_REDIRECT.user
    : resolveSafeRedirect(requestedRedirect, DEFAULT_REDIRECT.user)

  // کاربری که وارد است نباید فرم ورود ببیند
  const shouldRender = useRedirectIfAuthenticated(isLoggedIn, destination)

  // چرا کاربر به این صفحه آمده؟ — از مقصد استنتاج می‌شود
  const contextMessage = getLoginContextMessage(requestedRedirect)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
    if (throttle.isLocked) return

    /*
      ⚠️ ورود شبیه‌سازی‌شده. رمز بررسی نمی‌شود چون بک‌اندی وجود ندارد.

      نکتهٔ امنیتی: این فرم همیشه نقش `user` می‌دهد. ورود مدیر مسیر
      جداگانهٔ خودش را دارد (/admin/login).
    */
    await new Promise((r) => setTimeout(r, 400))

    const identifier = data.identifier.trim()
    const usedMobile = isMobileIdentifier(identifier)

    // ثبت این مرورگر تا دفعهٔ بعد رمز نخواهد
    const wasTrusted = isDeviceTrusted(identifier)
    trustCurrentDevice(identifier)
    setIsNewDevice(!wasTrusted)

    login({
      id: 'demo-user',
      name: 'کاربر آزمایشی',
      email: usedMobile ? '' : identifier,
      role: 'user',
    })

    throttle.reset()
    router.push(destination)
  }

  if (!shouldRender) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <p role="status" className="text-sm text-muted-foreground">
          در حال انتقال…
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <AuthCard
        title="ورود به حساب"
        description="برای پیگیری سفارش‌ها و مشاهدهٔ علاقه‌مندی‌ها وارد شوید."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {contextMessage && (
            <div
              role="status"
              className="rounded-xl border border-primary/25 bg-primary/10 p-3.5"
            >
              <p className="flex items-center gap-2 text-xs font-bold text-primary">
                <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
                {contextMessage.title}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {contextMessage.description}
              </p>
            </div>
          )}

          <FormField
            id="identifier"
            label="ایمیل یا شمارهٔ موبایل"
            required
            error={errors.identifier?.message}
            hint="مثلاً ۰۹۱۲۳۴۵۶۷۸۹ یا name@example.com"
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
                disabled={throttle.isLocked}
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
              href="/forgot-password"
              className="text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              رمز عبور را فراموش کرده‌اید؟
            </Link>
          </div>

          {throttle.isLocked && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-stock-low/30 bg-stock-low/10 p-3 text-xs leading-relaxed text-stock-low"
            >
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              به دلیل تلاش‌های ناموفق، ورود موقتاً قفل شد. لطفاً {throttle.secondsLeft} ثانیه
              صبر کنید.
            </p>
          )}

          {throttle.showWarning && (
            <p role="status" className="text-[11px] text-stock-low">
              {throttle.remainingAttempts} تلاش باقی مانده تا قفل موقت.
            </p>
          )}

          {isNewDevice && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/10 p-3 text-[11px] leading-relaxed text-muted-foreground"
            >
              <MonitorSmartphone
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              این دستگاه به فهرست دستگاه‌های شما اضافه شد. دفعهٔ بعد از همین مرورگر، رمز
              خواسته نمی‌شود.
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
                در حال ورود…
              </>
            ) : (
              'ورود'
            )}
          </Button>

          <SocialAuthButtons />

          {/*
            ثبت‌نام یک «کنش» است نه یک پانویس.
            پیش از این متن ریز و کم‌رنگ بود و کاربر تازه آن را
            نمی‌دید — یعنی همان لحظه‌ای که می‌خواست حساب بسازد،
            مسیرش پیدا نبود. حالا دکمهٔ تمام‌عرض با مرز مشخص است.
          */}
          <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4 text-center">
            <p className="text-sm font-bold text-foreground">هنوز حساب ندارید؟</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              ساخت حساب کمتر از یک دقیقه طول می‌کشد.
            </p>
            <Button variant="outline" size="lg" className="mt-3.5 w-full" asChild>
              <Link href="/register">
                <UserPlus />
                ساخت حساب کاربری
              </Link>
            </Button>
          </div>

          {/* راهنمای فاز mock — فقط در توسعهٔ محلی */}
          {IS_DEMO_MODE && (
            <p className="rounded-xl border border-border bg-surface-0/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              محیط توسعه: هر ایمیل/موبایل و رمزی پذیرفته می‌شود.
              <br />
              مدیر سایت هستید؟{' '}
              <Link href="/admin/login" className="font-bold text-primary hover:underline">
                ورود از مسیر مدیریت
              </Link>
            </p>
          )}
        </form>
      </AuthCard>
    </div>
  )
}
