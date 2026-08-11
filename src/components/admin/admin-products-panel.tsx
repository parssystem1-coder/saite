'use client'

import { useQuery } from '@tanstack/react-query'
import { Edit, ExternalLink, Loader2, PlusCircle, Search, Trash2 } from 'lucide-react'
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

/**
 * ماژول محصولات ادمین — با Opera-style Tabs و Search بالای Tabs
 * - رنگ‌بندی از توکن‌های globals.css (surface, border, accent)
 * - Tabs: All | Updates | Enabled | Disabled با badge واقعی و aria-pressed
 * - Search بالای Tabs طبق الگوی مرجع
 */
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

    // search real filtering
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

    // tab filtering with real data
    switch (activeTab) {
      case 'updates':
        return list.filter((p) => p.stockStatus === 'low_stock')
      case 'enabled':
        return list.filter((p) => p.stockStatus === 'in_stock')
      case 'disabled':
        return list.filter((p) => p.stockStatus === 'out_of_stock' || p.stockStatus === 'on_request')
      case 'all':
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
          <Button className="gap-2" asChild>
            <Link href="/admin/products/new">
              <PlusCircle className="size-4" />
              افزودن محصول
            </Link>
          </Button>
        }
      />

      <div className="surface-3d overflow-hidden rounded-2xl border border-border bg-surface-1">
        {/* Search بالای Tabs طبق الگوی مرجع */}
        <div className="border-b border-border bg-surface-1 p-4">
          <div className="flex flex-col gap-4">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="جستجو در انبار… (نام، مدل، دسته، برند)"
                className="pr-10 bg-surface-2 border-border focus-visible:border-accent/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="جستجوی محصولات"
              />
            </div>

            {/* Opera Tabs با فاصله جدا، active cyan/blue */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AdminOperaTabs
                items={tabItems}
                value={activeTab}
                onValueChange={setActiveTab}
                aria-label="فیلتر محصولات"
              />
              <Badge variant="outline" className="w-fit px-3 py-1.5 border-border bg-surface-2">
                نمایش: {filteredProducts.length} / {products?.length ?? 0}
              </Badge>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-56 items-center justify-center bg-surface-1">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 bg-surface-1 p-6 text-center">
              <p className="text-sm font-bold text-foreground">محصولی یافت نشد</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? `جستجو برای «${searchQuery}» نتیجه‌ای نداشت` : 'در این دسته محصولی وجود ندارد'}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-0/40 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">محصول</th>
                  <th className="px-4 py-3">دسته</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3">قیمت</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-0 p-1">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">{product.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                            {product.model}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-surface-2">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          product.stockStatus === 'in_stock'
                            ? 'default'
                            : product.stockStatus === 'low_stock'
                              ? 'outline'
                              : 'secondary'
                        }
                        className="text-[10px]"
                      >
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`ویرایش ${product.name}`}
                          title="ویرایش"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`حذف ${product.name}`}
                          title="حذف"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            aria-label={`مشاهدهٔ ${product.name}`}
                            title="مشاهده در فروشگاه"
                          >
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
    </div>
  )
}
