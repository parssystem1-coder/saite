'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AtSign, Loader2, Lock, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { AuthCard } from '@/components/auth/auth-card'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { DEFAULT_REDIRECT, isAdminPath, resolveSafeRedirect } from '@/lib/auth/safe-redirect'
import { isDeviceTrusted, trustCurrentDevice } from '@/lib/auth/trusted-devices'
import { isMobileIdentifier, loginSchema, type LoginInput } from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'

export function LoginClient() {
  const login = useAuthStore((s) => s.login)
  const router = useRouter()
  const params = useSearchParams()

  /** آیا این مرورگر برای حساب واردشده تازه است؟ */
  const [isNewDevice, setIsNewDevice] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
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

    // مقصد بازگشت اعتبارسنجی می‌شود تا Open Redirect ممکن نباشد.
    // مسیرهای /admin هم رد می‌شوند چون این فرم نقش مدیر نمی‌دهد.
    const requested = params.get('redirect')
    const target = isAdminPath(requested)
      ? DEFAULT_REDIRECT.user
      : resolveSafeRedirect(requested, DEFAULT_REDIRECT.user)

    router.push(target)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <AuthCard
        title="ورود به حساب"
        description="برای پیگیری سفارش‌ها و مشاهدهٔ علاقه‌مندی‌ها وارد شوید."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-10"
              />
            </div>
          </FormField>

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

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
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

          <p className="text-center text-sm text-muted-foreground">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="font-bold text-primary hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>

          {/* راهنمای فاز mock — با اتصال بک‌اند حذف می‌شود */}
          <p className="rounded-xl border border-border bg-surface-0/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            نسخهٔ نمایشی: هر ایمیل/موبایل و رمزی پذیرفته می‌شود.
            <br />
            مدیر سایت هستید؟{' '}
            <Link href="/admin/login" className="font-bold text-primary hover:underline">
              ورود از مسیر مدیریت
            </Link>
          </p>
        </form>
      </AuthCard>
    </div>
  )
}
