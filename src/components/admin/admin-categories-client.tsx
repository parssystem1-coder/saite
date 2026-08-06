'use client'

import { useState } from 'react'
import { FolderTree, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import type { Brand, Category } from '@/types/product'

/**
 * صفحهٔ مدیریت دسته‌بندی‌ها و برندهای فروشگاه.
 *
 * این مقادیر مستقیماً با فیلدهای «دسته اصلی» و «برند» در تب «پایه»
 * ویرایشگر افزودن محصول (`/admin/products/new`) همگام هستند.
 */
export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [brands, setBrands] = useState<Brand[]>(BRANDS)
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories')

  const handleAddCategory = () => {
    const name = window.prompt('نام فارسی دسته‌بندی جدید (مثال: پلاتر):')
    if (!name?.trim()) return
    const slug = window.prompt('نامک انگلیسی (Slug، مثال: plotter):', 'plotter')
    if (!slug?.trim()) return

    const newCategory: Category = {
      slug: slug.trim().toLowerCase() as Category['slug'],
      name: name.trim(),
      description: `دسته‌بندی تخصصی ${name.trim()} در کاتالوگ ماشین‌های اداری`,
      icon: 'Printer',
    }
    setCategories((prev) => [...prev, newCategory])
  }

  const handleAddBrand = () => {
    const name = window.prompt('نام فارسی برند (مثال: زیراکس):')
    if (!name?.trim()) return
    const displayName = window.prompt('نام انگلیسی برند (مثال: Xerox):', 'Xerox')
    if (!displayName?.trim()) return

    const newBrand: Brand = {
      slug: displayName.trim().toLowerCase(),
      name: name.trim(),
      displayName: displayName.trim(),
    }
    setBrands((prev) => [...prev, newBrand])
  }

  return (
    <div className="space-y-6">
      {/* بنر اطلاع‌رسانی همگام‌سازی با افزودن محصول */}
      <div className="flex flex-col gap-2 rounded-2xl border border-primary/25 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-primary">
            همگام‌سازی با فرم افزودن محصول
          </h3>
          <p className="text-xs text-muted-foreground">
            تمامی دسته‌بندی‌ها و برندهای این صفحه مستقیماً در فیلدهای «دسته اصلی» و «برند» در
            ویرایشگر افزودن محصول (<code>/admin/products/new</code>) بارگذاری می‌شوند.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={handleAddCategory}>
            <Plus className="size-4" />
            افزودن دسته‌بندی
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddBrand}>
            <Plus className="size-4" />
            افزودن برند
          </Button>
        </div>
      </div>

      {/* تب‌های جابجایی بین دسته و برند */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderTree className="size-4" />
          دسته‌بندی‌های محصولات ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
            activeTab === 'brands'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="size-4" />
          برندها ({brands.length})
        </button>
      </div>

      {/* بخش دسته‌بندی‌ها */}
      {activeTab === 'categories' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              className="surface-3d flex flex-col justify-between gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{cat.name}</h4>
                  <span
                    dir="ltr"
                    className="rounded-lg bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {cat.slug}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {cat.description}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                <span>وضعیت: فعال در کاتالوگ</span>
                <span className="font-bold text-stock-in">همگام با ادیتور</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* بخش برندها */
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <div
              key={brand.slug}
              className="surface-3d flex flex-col justify-between gap-2 rounded-2xl border border-border p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">{brand.name}</span>
                <span
                  dir="ltr"
                  className="rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary"
                >
                  {brand.displayName}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span dir="ltr" className="font-mono text-[10px]">
                  {brand.slug}
                </span>
                <span className="font-bold text-stock-in">فعال</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
