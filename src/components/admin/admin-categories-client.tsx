'use client'

import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import type { Brand, Category, SubCategory } from '@/types/product'

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
    const newSub: SubCategory = { slug: slug.trim().toLowerCase(), name: name.trim() }
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.slug !== categorySlug) return cat
        return { ...cat, subCategories: [...(cat.subCategories ?? []), newSub] }
      })
    )
  }

  const handleRemoveSubCategory = (categorySlug: string, subSlug: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.slug !== categorySlug) return cat
        return { ...cat, subCategories: (cat.subCategories ?? []).filter((s) => s.slug !== subSlug) }
      })
    )
  }

  const handleAddBrand = () => {
    const name = window.prompt('نام فارسی برند (مثال: زیراکس):')
    if (!name?.trim()) return
    const displayName = window.prompt('نام انگلیسی برند (مثال: Xerox):', 'Xerox')
    if (!displayName?.trim()) return
    const newBrand: Brand = { slug: displayName.trim().toLowerCase(), name: name.trim(), displayName: displayName.trim() }
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
      <div className="flex flex-col gap-2 rounded-[9px] border border-[#7094d0] bg-gradient-to-br from-[#526b9e] to-[#40577f] p-4 shadow-[inset_0_1px_0_#ffffff2b,0_9px_20px_#08142638] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#27d4ee]">همگام‌سازی با فرم افزودن محصول</h3>
          <p className="text-xs text-[#b7c5da]">تمامی دسته‌بندی‌ها، زیردسته‌ها و برندهای این صفحه مستقیماً در فیلدهای «دسته اصلی» و «زیردسته» در ویرایشگر افزودن محصول (<code className="text-[#27d4ee]">/admin/products/new</code>) بارگذاری می‌شوند.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={handleAddCategory} className="bg-[#27d4ee] text-[#082638] border-0">
            <Plus className="size-4" />
            افزودن دسته‌بندی
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddBrand} className="border-[#526987] bg-[#2d3952] text-[#edf3ff]">
            <Plus className="size-4" />
            افزودن برند
          </Button>
        </div>
      </div>

      <div className="rounded-[9px] border border-[#7094d0] bg-gradient-to-br from-[#526b9e] to-[#40577f] p-4 shadow-[inset_0_1px_0_#ffffff2b,0_9px_20px_#08142638]">
        <div className="flex flex-col gap-4">
          <label className="relative block w-[340px] max-w-full">
            <Input
              placeholder={activeTab === 'categories' ? 'جستجوی دسته‌بندی…' : 'جستجوی برند…'}
              className="w-full h-[39px] rounded-[22px] border border-[#4b8cff] bg-[#182944] text-[#edf3ff] placeholder:text-[#91a1bb] pr-10 text-[11px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#a8c4ee]" aria-hidden="true" />
          </label>
          <Tabs items={tabItems} value={activeTab} onValueChange={setActiveTab} variant="opera" aria-label="دسته‌بندی و برند" />
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((cat) => (
            <div key={cat.slug} className="flex flex-col justify-between gap-3 rounded-[9px] border border-[#7094d0] bg-gradient-to-br from-[#526b9e] to-[#40577f] p-4 shadow-[inset_0_1px_0_#ffffff2b,0_9px_20px_#08142638] transition hover:brightness-[1.05]">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#edf3ff]">{cat.name}</h4>
                  <span dir="ltr" className="rounded-lg bg-[#182944] border border-[#526987] px-2 py-0.5 font-mono text-xs text-[#91a1bb]">
                    {cat.slug}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#b7c5da]">{cat.description}</p>
                <div className="mt-3 border-t border-[#526987]/60 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#91a1bb]">زیردسته‌ها ({cat.subCategories?.length ?? 0})</span>
                    <button type="button" onClick={() => handleAddSubCategory(cat.slug)} className="flex items-center gap-1 rounded-lg border border-[#27d4ee]/30 bg-[#27d4ee]/10 px-2 py-0.5 text-[11px] font-bold text-[#27d4ee] hover:bg-[#27d4ee]/20">
                      <Plus className="size-3" />
                      افزودن زیردسته
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(cat.subCategories ?? []).length > 0 ? (
                      cat.subCategories?.map((sub) => (
                        <span key={sub.slug} className="inline-flex items-center gap-1.5 rounded-lg border border-[#526987] bg-[#2d3952] px-2 py-1 text-xs text-[#edf3ff]">
                          <span>{sub.name}</span>
                          <span dir="ltr" className="font-mono text-[10px] text-[#91a1bb]">
                            ({sub.slug})
                          </span>
                          <button type="button" onClick={() => handleRemoveSubCategory(cat.slug, sub.slug)} className="text-[#91a1bb] hover:text-[#f05268]">
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#91a1bb]">بدون زیردسته (قابل افزودن)</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#526987]/50 pt-3 text-[11px] text-[#91a1bb]">
                <span>وضعیت: فعال در کاتالوگ</span>
                <span className="font-bold text-[#27d4ee]">همگام با ادیتور</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredBrands.map((brand) => (
            <div key={brand.slug} className="flex flex-col justify-between gap-2 rounded-[9px] border border-[#7094d0] bg-gradient-to-br from-[#526b9e] to-[#40577f] p-4 shadow-[inset_0_1px_0_#ffffff2b,0_9px_20px_#08142638]">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#edf3ff]">{brand.name}</span>
                <span dir="ltr" className="rounded-lg bg-[#27d4ee]/15 border border-[#27d4ee]/30 px-2 py-0.5 font-mono text-xs font-bold text-[#27d4ee]">
                  {brand.displayName}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#526987]/50 pt-2 text-[11px] text-[#91a1bb]">
                <span dir="ltr" className="font-mono text-[10px]">
                  {brand.slug}
                </span>
                <span className="font-bold text-[#63d7a0]">فعال</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
