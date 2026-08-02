'use client'

import { ArrowRight, Save, Upload } from 'lucide-react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/lib/constants'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="افزودن محصول جدید"
        description="ثبت کالا در کاتالوگ (ذخیره پس از اتصال بک‌اند فعال می‌شود)"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowRight className="size-4" />
              بازگشت
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="surface-3d space-y-5 rounded-2xl p-6 md:p-8">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold text-muted-foreground">
                نام محصول
              </label>
              <Input
                id="name"
                placeholder="مثلاً: پرینتر لیزری کانن LBP-2900"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="category" className="text-xs font-bold text-muted-foreground">
                  دسته‌بندی
                </label>
                <select
                  id="category"
                  className="h-12 w-full rounded-xl border border-border bg-input px-3 text-sm outline-none focus-visible:border-primary/60"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-xs font-bold text-muted-foreground">
                  قیمت (تومان)
                </label>
                <Input
                  id="price"
                  type="number"
                  placeholder="۰"
                  className="h-12 text-left font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="desc" className="text-xs font-bold text-muted-foreground">
                توضیحات
              </label>
              <textarea
                id="desc"
                rows={6}
                placeholder="ویژگی‌ها و مشخصات فنی…"
                className="w-full rounded-xl border border-border bg-input p-4 text-sm outline-none focus-visible:border-primary/60"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-3d rounded-2xl p-6 text-center md:p-8">
            <p className="mb-4 text-xs font-bold text-muted-foreground">تصویر محصول</p>
            <div className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-0/50 transition-colors hover:border-primary/40">
              <div className="mb-3 rounded-full bg-primary/12 p-3">
                <Upload className="size-7 text-primary" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">انتخاب یا رها کردن فایل</p>
              <p className="mt-1 text-[10px] text-muted-foreground">PNG، JPG تا ۵ مگابایت</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="h-12 w-full gap-2 text-base" type="button">
              <Save className="size-5" />
              ذخیره (نمایشی)
            </Button>
            <Button variant="outline" className="h-12 w-full" asChild>
              <Link href="/admin/products">انصراف</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
