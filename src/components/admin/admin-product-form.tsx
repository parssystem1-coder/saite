'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Save, Upload } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { fieldAria, FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/lib/schemas'
import { cn } from '@/lib/utils'

const SELECT_CLASS = cn(
  'h-11 w-full rounded-xl border border-border bg-input px-3 text-sm',
  'shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none transition-colors',
  'focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25'
)

/**
 * فرم افزودن محصول در پنل مدیریت.
 *
 * `productFormSchema` از قبل تعریف و تست شده بود اما هیچ فرمی از آن
 * استفاده نمی‌کرد — ورودی‌ها بدون `register` و بدون اعتبارسنجی بودند.
 *
 * ── فاز بک‌اند ────────────────────────────────────────────────
 * `onSubmit` باید Server Action را صدا بزند و همین schema سمت سرور
 * دوباره اجرا شود. اعتبارسنجی کلاینت فقط برای تجربهٔ کاربری است.
 */
export function AdminProductForm() {
  const [savedName, setSavedName] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      brand: '',
      model: '',
      category: '',
      price: '',
      description: '',
    },
  })

  const onSubmit = async (data: ProductFormInput) => {
    // شبیه‌سازی ذخیره — در فاز بک‌اند با createProduct جایگزین می‌شود
    await new Promise((r) => setTimeout(r, 600))
    console.info('[admin] create product', data)
    setSavedName(data.name)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {savedName && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-stock-in/30 bg-stock-in/10 p-4"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-stock-in" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              «{savedName}» اعتبارسنجی شد
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              داده‌ها معتبرند اما تا اتصال بک‌اند ذخیره نمی‌شوند.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="surface-3d space-y-5 rounded-2xl p-6 md:p-8">
            <FormField id="name" label="نام محصول" required error={errors.name?.message}>
              <Input
                {...register('name')}
                {...fieldAria('name', !!errors.name)}
                placeholder="مثلاً: پرینتر لیزری کانن LBP-2900"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField id="brand" label="برند" required error={errors.brand?.message}>
                <select
                  {...register('brand')}
                  {...fieldAria('brand', !!errors.brand)}
                  className={SELECT_CLASS}
                >
                  <option value="">انتخاب برند…</option>
                  {BRANDS.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.displayName} — {b.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                id="model"
                label="شمارهٔ مدل"
                required
                error={errors.model?.message}
                hint="لاتین وارد شود — مثل LBP-2900"
              >
                <Input
                  {...register('model')}
                  {...fieldAria('model', !!errors.model, true)}
                  dir="ltr"
                  placeholder="LBP-2900"
                  className="text-right font-mono"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                id="category"
                label="دسته‌بندی"
                required
                error={errors.category?.message}
              >
                <select
                  {...register('category')}
                  {...fieldAria('category', !!errors.category)}
                  className={SELECT_CLASS}
                >
                  <option value="">انتخاب دسته…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                id="price"
                label="قیمت (تومان)"
                required
                error={errors.price?.message}
                hint="فقط رقم، بدون جداکننده"
              >
                <Input
                  {...register('price')}
                  {...fieldAria('price', !!errors.price, true)}
                  type="number"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="4850000"
                  className="text-right font-mono"
                />
              </FormField>
            </div>

            <FormField id="description" label="توضیحات" error={errors.description?.message}>
              <textarea
                {...register('description')}
                {...fieldAria('description', !!errors.description)}
                rows={6}
                placeholder="ویژگی‌ها و مشخصات فنی…"
                className={cn(
                  'w-full rounded-xl border border-border bg-input p-3.5 text-sm',
                  'shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none',
                  'placeholder:text-muted-foreground/70',
                  'focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25'
                )}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-3d rounded-2xl p-6 text-center md:p-8">
            <p className="mb-4 text-xs font-bold text-muted-foreground">تصویر محصول</p>
            <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-0/50">
              <div className="mb-3 rounded-full bg-primary/12 p-3">
                <Upload className="size-7 text-primary" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                آپلود پس از اتصال بک‌اند
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">PNG، JPG تا ۵ مگابایت</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button type="submit" className="h-12 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال بررسی…
                </>
              ) : (
                <>
                  <Save className="size-5" />
                  ذخیره
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="h-12 w-full" asChild>
              <Link href="/admin/products">انصراف</Link>
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
