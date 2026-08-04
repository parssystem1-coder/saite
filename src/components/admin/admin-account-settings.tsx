'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Info, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { changeAdminPasswordSchema, type ChangeAdminPasswordInput } from '@/lib/schemas'
import { useAdminSessionStore } from '@/store/admin-session-store'

/**
 * مدیریت حساب مدیر از داخل پنل.
 *
 * ⚠️ فاز پوسته: تغییر رمز واقعاً ذخیره نمی‌شود. فرم، اعتبارسنجی و
 * پیام‌ها کامل‌اند تا هنگام اتصال بک‌اند فقط بدنهٔ onSubmit عوض شود.
 *
 * ── قرارداد فاز بک‌اند ────────────────────────────────────────
 *   PATCH /api/admin/account/password
 *   { currentPassword, newPassword }
 *
 * الزامات سمت سرور:
 *   • بررسی مجدد رمز فعلی (هرگز فقط به کلاینت اعتماد نکنید)
 *   • هش با bcrypt/argon2 و حداقل ۱۲ round
 *   • ابطال همهٔ sessionهای دیگر پس از تغییر رمز
 *   • اطلاع‌رسانی ایمیلی به مدیر دربارهٔ تغییر
 */
export function AdminAccountSettings() {
  const admin = useAdminSessionStore((s) => s.admin)
  const [saved, setSaved] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeAdminPasswordInput>({
    resolver: zodResolver(changeAdminPasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 700))
    setSaved(true)
    reset()
  }

  return (
    <section className="space-y-6">
      <div className="surface-3d rounded-2xl p-6 md:p-8">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">حساب مدیر</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              اطلاعات ورود شما به پنل مدیریت
            </p>
          </div>
        </header>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-0/50 p-4">
            <dt className="text-[11px] text-muted-foreground">نام نمایشی</dt>
            <dd className="mt-1 text-sm font-bold text-foreground">{admin?.name ?? '—'}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface-0/50 p-4">
            <dt className="text-[11px] text-muted-foreground">نقش</dt>
            <dd className="mt-1 text-sm font-bold text-primary">مدیر سیستم</dd>
          </div>
        </dl>
      </div>

      <div className="surface-3d rounded-2xl p-6 md:p-8">
        <header className="mb-6 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground">تغییر رمز عبور</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              رمز قوی و یکتا انتخاب کنید — حداقل ۱۰ کاراکتر
            </p>
          </div>
        </header>

        {saved && (
          <p
            role="status"
            className="mb-5 flex items-start gap-2 rounded-xl border border-stock-in/30 bg-stock-in/10 p-3 text-xs leading-relaxed text-stock-in"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            رمز اعتبارسنجی شد. پس از اتصال بک‌اند، واقعاً ذخیره خواهد شد.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormField
            id="currentPassword"
            label="رمز فعلی"
            required
            error={errors.currentPassword?.message}
          >
            <Input
              {...register('currentPassword')}
              {...fieldAria('currentPassword', !!errors.currentPassword)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              id="newPassword"
              label="رمز جدید"
              required
              error={errors.newPassword?.message}
              hint="حداقل ۱۰ کاراکتر، شامل حرف و رقم"
            >
              <Input
                {...register('newPassword')}
                {...fieldAria('newPassword', !!errors.newPassword, true)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••"
              />
            </FormField>

            <FormField
              id="confirmPassword"
              label="تکرار رمز جدید"
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                {...register('confirmPassword')}
                {...fieldAria('confirmPassword', !!errors.confirmPassword)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••"
              />
            </FormField>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                در حال بررسی…
              </>
            ) : (
              'ذخیرهٔ رمز جدید'
            )}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-stock-low/25 bg-stock-low/8 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-stock-low">
          <Info className="size-4" aria-hidden="true" />
          آنچه در فاز بک‌اند اضافه می‌شود
        </h3>
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          <li>• ذخیرهٔ رمز به‌صورت هش‌شده (bcrypt/argon2) — نه متن ساده</li>
          <li>• احراز هویت دومرحله‌ای (کد یک‌بارمصرف) برای حساب مدیر</li>
          <li>• محدودیت نرخ و قفل حساب سمت سرور، نه فقط مرورگر</li>
          <li>• ثبت لاگ ورودها با زمان، IP و دستگاه</li>
          <li>• ابطال خودکار نشست‌های دیگر پس از تغییر رمز</li>
          <li>• تعریف چند مدیر با سطح دسترسی متفاوت</li>
        </ul>
      </div>
    </section>
  )
}
