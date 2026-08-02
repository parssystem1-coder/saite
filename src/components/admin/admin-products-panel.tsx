'use client'

import { useQuery } from '@tanstack/react-query'
import { Edit, ExternalLink, Loader2, PlusCircle, Search, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriceDisplay } from '@/components/ui/price-display'
import { getProducts } from '@/lib/api'

/**
 * ماژول محصولات ادمین — مستقل از shell.
 */
export function AdminProductsPanel() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getProducts(),
  })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="محصولات"
        description="مدیریت موجودی، قیمت و نمایش کاتالوگ"
        actions={
          <Button className="gap-2" asChild>
            <Link href="/admin/products/new">
              <PlusCircle className="size-4" />
              افزودن محصول
            </Link>
          </Button>
        }
      />

      <div className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="جستجو در انبار…" className="pr-10" />
          </div>
          <Badge variant="outline" className="w-fit px-3 py-1.5">
            تعداد: {products?.length ?? 0}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full border-collapse text-right text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-0/40 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">محصول</th>
                  <th className="px-4 py-3">دسته</th>
                  <th className="px-4 py-3">قیمت</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products?.map((product) => (
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
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <PriceDisplay
                        priceType={product.priceType}
                        price={product.price}
                        size="sm"
                      />
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
