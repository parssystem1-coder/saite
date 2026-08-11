'use client'

import { useQuery } from '@tanstack/react-query'
import { Edit, ExternalLink, Loader2, PlusCircle, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriceDisplay } from '@/components/ui/price-display'
import { AdminOperaTabs, type AdminOperaTabItem } from '@/components/ui/admin-opera-tabs'
import { getProducts } from '@/lib/api'

type ProductFilterTab = 'all' | 'updates' | 'enabled' | 'disabled'

export function AdminProductsPanel() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getProducts(),
  })

  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<ProductFilterTab>('all')

  const filteredProducts = React.useMemo(() => {
    if (!products) return []
    let list = products
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
    }
    switch (activeTab) {
      case 'updates':
        return list.filter((p) => p.stockStatus === 'low_stock')
      case 'enabled':
        return list.filter((p) => p.stockStatus === 'in_stock')
      case 'disabled':
        return list.filter((p) => p.stockStatus === 'out_of_stock' || p.stockStatus === 'on_request')
      default:
        return list
    }
  }, [products, searchQuery, activeTab])

  const counts = React.useMemo(() => {
    if (!products) return { all: 0, updates: 0, enabled: 0, disabled: 0 }
    return {
      all: products.length,
      updates: products.filter((p) => p.stockStatus === 'low_stock').length,
      enabled: products.filter((p) => p.stockStatus === 'in_stock').length,
      disabled: products.filter((p) => p.stockStatus === 'out_of_stock' || p.stockStatus === 'on_request').length,
    }
  }, [products])

  const tabItems: AdminOperaTabItem<ProductFilterTab>[] = [
    { key: 'all', label: 'همه', badge: counts.all },
    { key: 'updates', label: 'آپدیت‌ها', badge: counts.updates },
    { key: 'enabled', label: 'فعال', badge: counts.enabled },
    { key: 'disabled', label: 'غیرفعال', badge: counts.disabled },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="محصولات"
        description="مدیریت موجودی، قیمت و نمایش کاتالوگ - فیلتر Opera-style"
        actions={
          <Button className="gap-2 bg-[#27d4ee] text-[#082638] hover:bg-[#27d4ee]/90 border-0" asChild>
            <Link href="/admin/products/new">
              <PlusCircle className="size-4" />
              افزودن محصول
            </Link>
          </Button>
        }
      />

      {/* Main content: crumb + hero + search + filters + modules - per reference */}
      <div className="space-y-4">
        <p className="text-[11px] text-[#91a1bb] m-0">پنل مدیریت / محصولات</p>

        <div className="flex items-end justify-between gap-5">
          <div>
            <h1 className="text-[31px] leading-[1.15] tracking-[-0.04em] m-0 font-bold text-[#edf3ff]">محصولات</h1>
            <p className="text-[13px] text-[#b7c5da] m-0 mt-1">رنگ، Surface و فاصله‌ها از فایل مرجع Opera پیروی می‌کنند.</p>
          </div>
        </div>

        {/* Search - exact reference: 340px 39px border #4b8cff radius 22px bg #182944 */}
        <label className="relative block w-[340px] max-w-full">
          <Input
            placeholder="جست‌وجوی ماژول‌ها…"
            aria-label="جست‌وجوی محصولات"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[39px] rounded-[22px] border border-[#4b8cff] bg-[#182944] text-[#edf3ff] placeholder:text-[#91a1bb] pr-10 text-[11px] focus-visible:border-[#27d4ee] focus-visible:ring-2 focus-visible:ring-[#27d4ee]"
          />
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[#a8c4ee] text-[18px]" aria-hidden="true">
            ⌕
          </span>
        </label>

        {/* Filters - exact reference: gap 10px, filter 36px 78px */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminOperaTabs items={tabItems} value={activeTab} onValueChange={setActiveTab} aria-label="فیلتر محصولات" />
          <Badge variant="outline" className="border-[#526987] bg-[#2d3952] text-[#b7c5da]">
            نمایش: {filteredProducts.length} / {products?.length ?? 0}
          </Badge>
        </div>

        <h2 className="text-[15px] m-0 mt-7 mb-3 text-[#edf3ff]">همهٔ ماژول‌ها</h2>

        <div className="overflow-hidden rounded-[9px] border border-[#7094d0] bg-gradient-to-br from-[#526b9e] to-[#40577f] shadow-[inset_0_1px_0_#ffffff2b,0_9px_20px_#08142638]">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex h-56 items-center justify-center bg-[#2d3952]">
                <Loader2 className="size-8 animate-spin text-[#27d4ee]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 bg-[#2d3952] p-6 text-center">
                <p className="text-sm font-bold text-[#edf3ff]">محصولی یافت نشد</p>
                <p className="text-xs text-[#b7c5da]">{searchQuery ? `جستجو برای «${searchQuery}» نتیجه‌ای نداشت` : 'در این دسته محصولی وجود ندارد'}</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b border-[#526987] bg-[#273552]/60 text-[11px] font-bold tracking-wide text-[#91a1bb] uppercase">
                    <th className="px-4 py-3">محصول</th>
                    <th className="px-4 py-3">دسته</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">قیمت</th>
                    <th className="px-4 py-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#526987]/50">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-[#465b82]/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-[#526987] bg-[#182944] p-1">
                            <Image src={product.images[0]} alt={product.name} fill sizes="48px" className="object-contain" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#edf3ff]">{product.name}</p>
                            <p className="font-mono text-[10px] text-[#91a1bb]" dir="ltr">
                              {product.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-[#2d3952] border border-[#526987] text-[#b7c5da]">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] border-[#526987] bg-[#2d3952] text-[#edf3ff]">
                          {product.stockStatus === 'in_stock'
                            ? 'موجود'
                            : product.stockStatus === 'low_stock'
                              ? 'کم‌موجود'
                              : product.stockStatus === 'out_of_stock'
                                ? 'ناموجود'
                                : 'استعلامی'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <PriceDisplay priceType={product.priceType} price={product.price} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button type="button" variant="ghost" size="icon-sm" className="text-[#b7c5da] hover:text-[#edf3ff] hover:bg-[#465b82]" aria-label={`ویرایش ${product.name}`}>
                            <Edit className="size-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" className="text-[#b7c5da] hover:text-[#edf3ff]" aria-label={`حذف ${product.name}`}>
                            <Trash2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-[#b7c5da] hover:text-[#edf3ff]" asChild>
                            <Link href={`/products/${product.slug}`} target="_blank" aria-label={`مشاهدهٔ ${product.name}`}>
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-9 rounded-[10px] border border-[#5377af] bg-[#1d2c45] p-[17px_18px] text-[11px] text-[#b7c5da]">
          <strong className="text-[#edf3ff]">این طراحی از فایل مرجع Opera کپی شده.</strong> ساختار Saite حفظ شده و فقط Surface، رنگ‌بندی، Sidebar، Flyout، Header، Search و Tabs هماهنگ شده. <code className="text-[#27d4ee]">ProductCard</code>، API و routing دست نخورده.
        </div>
      </div>
    </div>
  )
}
