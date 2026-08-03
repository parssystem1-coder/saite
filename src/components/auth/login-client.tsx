'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { GitBranch, Globe, Loader2, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { DEMO_ADMIN_EMAIL, resolveDemoRole } from '@/lib/auth/demo-account'
import { loginSchema, type LoginInput } from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'

export function LoginClient() {
  const login = useAuthStore((s) => s.login)
  const router = useRouter()
  const params = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
    // ⚠️ ورود شبیه‌سازی‌شده. رمز عبور بررسی نمی‌شود چون بک‌اندی وجود ندارد.
    // در فاز بک‌اند با NextAuth (Credentials + bcrypt) جایگزین می‌شود
    // و نقش کاربر باید از پاسخ سرور بیاید، نه از ایمیل واردشده.
    await new Promise((r) => setTimeout(r, 400))

    const role = resolveDemoRole(data.email)
    login({
      id: role === 'admin' ? 'demo-admin' : 'demo-user',
      name: role === 'admin' ? 'مدیر آزمایشی' : 'کاربر آزمایشی',
      email: data.email,
      role,
    })

    const redirect = params.get('redirect')
    router.push(redirect ?? (role === 'admin' ? '/admin' : '/dashboard'))
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <AuthCard
        title="ورود به حساب"
        description="برای پیگیری سفارش‌ها و مشاهدهٔ علاقه‌مندی‌ها وارد شوید."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormField id="email" label="پست الکترونیک" required error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...register('email')}
                {...fieldAria('email', !!errors.email)}
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="name@example.com"
                className="pr-10 text-right font-mono"
              />
            </div>
          </FormField>

          <FormField id="password" label="رمز عبور" required error={errors.password?.message}>
            <div className="relative">
              <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
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

          <div className="relative py-2">
            <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            <span className="relative mx-auto block w-fit bg-surface-1 px-3 text-[11px] font-bold text-muted-foreground">
              یا ورود با
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" disabled>
              <Globe />
              Google
            </Button>
            <Button type="button" variant="secondary" disabled>
              <GitBranch />
              GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="font-bold text-primary hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>

          {/* راهنمای فاز mock — با اتصال بک‌اند حذف می‌شود */}
          <p className="rounded-xl border border-border bg-surface-0/50 p-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            نسخهٔ نمایشی: هر رمزی پذیرفته می‌شود. برای دیدن پنل مدیریت با{' '}
            <span dir="ltr" className="font-mono text-primary">
              {DEMO_ADMIN_EMAIL}
            </span>{' '}
            وارد شوید.
          </p>
        </form>
      </AuthCard>
    </div>
  )
}
