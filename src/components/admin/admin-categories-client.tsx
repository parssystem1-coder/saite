'use client'

import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import type { Brand, Category, SubCategory } from '@/types/product'

/**
 * صفحهٔ مدیریت دسته‌بندی‌ها و برندها - با Opera Tabs و Search بالای Tabs
 * - از توکن‌های globals.css (surface, border, accent) استفاده می‌کند
 * - Tabs variant opera با badge واقعی
 */
export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [brands, setBrands] = useState<Brand[]>(BRANDS)
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories')
  const [searchQuery, setSearchQuery] = useState('')

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
      subCategories: [],
    }
    setCategories((prev) => [...prev, newCategory])
  }

  const handleAddSubCategory = (categorySlug: string) => {
    const name = window.prompt('نام فارسی زیردستهٔ جدید (مثال: پرینتر سوزنی):')
    if (!name?.trim()) return
    const slug = window.prompt('نامک انگلیسی زیردسته (مثال: dot-matrix):', 'dot-matrix')
    if (!slug?.trim()) return

    const newSub: SubCategory = {
      slug: slug.trim().toLowerCase(),
      name: name.trim(),
    }

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.slug !== categorySlug) return cat
        return {
          ...cat,
          subCategories: [...(cat.subCategories ?? []), newSub],
        }
      })
    )
  }

  const handleRemoveSubCategory = (categorySlug: string, subSlug: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.slug !== categorySlug) return cat
        return {
          ...cat,
          subCategories: (cat.subCategories ?? []).filter((s) => s.slug !== subSlug),
        }
      })
    )
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

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }, [categories, searchQuery])

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return brands
    return brands.filter((b) => b.name.toLowerCase().includes(q) || b.displayName.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q))
  }, [brands, searchQuery])

  const tabItems: TabItem<'categories' | 'brands'>[] = [
    { key: 'categories', label: 'دسته‌بندی‌ها', badge: categories.length },
    { key: 'brands', label: 'برندها', badge: brands.length },
  ]

  return (
    <div className="space-y-6">
      {/* بنر اطلاع‌رسانی همگام‌سازی با افزودن محصول */}
      <div className="flex flex-col gap-2 rounded-2xl border border-primary/25 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-primary">همگام‌سازی با فرم افزودن محصول</h3>
          <p className="text-xs text-muted-foreground">
            تمامی دسته‌بندی‌ها، زیردسته‌ها و برندهای این صفحه مستقیماً در فیلدهای «دسته اصلی» و «زیردسته» در
            ویرایشگر افزودن محصول (<code>/admin/products/new</code>) بارگذاری می‌شوند.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={handleAddCategory} className="bg-surface-3 border border-border">
            <Plus className="size-4" />
            افزودن دسته‌بندی
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddBrand} className="border-border bg-surface-1">
            <Plus className="size-4" />
            افزودن برند
          </Button>
        </div>
      </div>

      {/* Search بالای Tabs طبق الگوی مرجع */}
      <div className="surface-3d rounded-2xl border border-border bg-surface-1 p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={activeTab === 'categories' ? 'جستجوی دسته‌بندی…' : 'جستجوی برند…'}
              className="pr-10 bg-surface-2 border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs
            items={tabItems}
            value={activeTab}
            onValueChange={setActiveTab}
            variant="opera"
            aria-label="دسته‌بندی و برند"
          />
        </div>
      </div>

      {/* بخش دسته‌بندی‌ها */}
      {activeTab === 'categories' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div
              key={cat.slug}
              className="surface-3d flex flex-col justify-between gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-accent/40 bg-surface-1"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">{cat.name}</h4>
                  <span
                    dir="ltr"
                    className="rounded-lg bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted-foreground border border-border"
                  >
                    {cat.slug}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{cat.description}</p>

                <div className="mt-3 border-t border-border/60 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">زیردسته‌ها ({cat.subCategories?.length ?? 0})</span>
                    <button
                      type="button"
                      onClick={() => handleAddSubCategory(cat.slug)}
                      className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary transition hover:bg-primary/20"
                    >
                      <Plus className="size-3" />
                      افزودن زیردسته
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(cat.subCategories ?? []).length > 0 ? (
                      cat.subCategories?.map((sub) => (
                        <span
                          key={sub.slug}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
                        >
                          <span>{sub.name}</span>
                          <span dir="ltr" className="font-mono text-[10px] text-muted-foreground">
                            ({sub.slug})
                          </span>
                          <button
                            type="button"
                            title={`حذف ${sub.name}`}
                            onClick={() => handleRemoveSubCategory(cat.slug, sub.slug)}
                            className="text-muted-foreground transition hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground">بدون زیردسته (قابل افزودن)</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                <span>وضعیت: فعال در کاتالوگ</span>
                <span className="font-bold text-accent">همگام با ادیتور</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.slug}
              className="surface-3d flex flex-col justify-between gap-2 rounded-2xl border border-border p-4 transition-colors hover:border-accent/40 bg-surface-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">{brand.name}</span>
                <span
                  dir="ltr"
                  className="rounded-lg bg-accent/15 border border-accent/30 px-2 py-0.5 font-mono text-xs font-bold text-accent"
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
