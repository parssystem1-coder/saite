'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail, Phone, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { AuthCard } from '@/components/auth/auth-card'
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { trustCurrentDevice } from '@/lib/auth/trusted-devices'
import { registerSchema, type RegisterInput } from '@/lib/schemas'
import { useAuthStore } from '@/store/auth-store'

export function RegisterClient() {
  const login = useAuthStore((s) => s.login)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    // ⚠️ ثبت‌نام شبیه‌سازی‌شده — در فاز بک‌اند به دیتابیس متصل می‌شود
    await new Promise((r) => setTimeout(r, 500))
    // شمارهٔ موبایل کلید حساب است؛ همین دستگاه ثبت می‌شود تا
    // دفعهٔ بعد از این مرورگر رمز خواسته نشود
    trustCurrentDevice(data.phone)

    login({ id: '1', name: data.name, email: data.email ?? '', role: 'user' })
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <AuthCard
        title="ایجاد حساب کاربری"
        description="با ثبت‌نام، سفارش‌ها و علاقه‌مندی‌های خود را دنبال کنید."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormField id="name" label="نام و نام خانوادگی" required error={errors.name?.message}>
            <div className="relative">
              <User className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...register('name')}
                {...fieldAria('name', !!errors.name)}
                autoComplete="name"
                placeholder="نام کامل"
                className="pr-10"
              />
            </div>
          </FormField>

          <FormField id="phone" label="شمارهٔ موبایل" required error={errors.phone?.message}>
            <div className="relative">
              <Phone className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...register('phone')}
                {...fieldAria('phone', !!errors.phone)}
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                placeholder="09123456789"
                className="pr-10 text-right font-mono"
              />
            </div>
          </FormField>

          <FormField
            id="email"
            label="پست الکترونیک (اختیاری)"
            error={errors.email?.message}
            hint="برای دریافت فاکتور و پیگیری سفارش — می‌توانید خالی بگذارید"
          >
            <div className="relative">
              <Mail
                className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                {...register('email')}
                {...fieldAria('email', !!errors.email, true)}
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="name@example.com"
                className="pr-10 text-right font-mono"
              />
            </div>
          </FormField>

          <FormField
            id="password"
            label="رمز عبور"
            required
            error={errors.password?.message}
            hint="حداقل ۸ کاراکتر"
          >
            <div className="relative">
              <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...register('password')}
                {...fieldAria('password', !!errors.password, true)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="pr-10"
              />
            </div>
          </FormField>

          <FormField
            id="confirmPassword"
            label="تکرار رمز عبور"
            required
            error={errors.confirmPassword?.message}
          >
            <div className="relative">
              <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                {...register('confirmPassword')}
                {...fieldAria('confirmPassword', !!errors.confirmPassword)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="pr-10"
              />
            </div>
          </FormField>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                در حال ثبت‌نام…
              </>
            ) : (
              'ایجاد حساب'
            )}
          </Button>

          <SocialAuthButtons />

          <p className="text-center text-sm text-muted-foreground">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              وارد شوید
            </Link>
          </p>
        </form>
      </AuthCard>
    </div>
  )
}
