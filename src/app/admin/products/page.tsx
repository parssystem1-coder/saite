'use client'

import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/lib/api'
import { Edit, Trash2, Search, PlusCircle, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/ui/price-display'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: getProducts,
  })

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <AdminSidebar />
        
        <main className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black italic">مدیریت موجودی کالا</h1>
              <p className="text-muted-foreground mt-1">افزودن، ویرایش و کنترل لیست محصولات</p>
            </div>
            <Button className="gap-2" asChild>
              <Link href="/admin/products/new">
                <PlusCircle className="h-5 w-5" />
                افزودن محصول جدید
              </Link>
            </Button>
          </div>

          {/* Table Container */}
          <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-white/10 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="جستجو در انبار..." className="pr-10 bg-black/20 border-white/5" />
              </div>
              <Badge variant="outline" className="px-4 py-2">
                تعداد کل: {products?.length || 0}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-white/10">
                      <th className="px-6 py-4">محصول</th>
                      <th className="px-6 py-4">دسته‌بندی</th>
                      <th className="px-6 py-4">قیمت</th>
                      <th className="px-6 py-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {products?.map((product) => (
                      <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 p-1 relative">
                              <Image src={product.images[0]} alt="" fill className="object-contain" />
                            </div>
                            <div>
                              <p className="font-bold">{product.name}</p>
                              <p className="text-[10px] text-muted-foreground">ID: {product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="bg-white/5">{product.category}</Badge>
                        </td>
                        <td className="px-6 py-4 font-black text-primary">
                          <PriceDisplay
                            priceType={product.priceType}
                            price={product.price}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500" asChild>
                              <Link href={`/products/${product.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
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
        </main>
      </div>
    </div>
  )
}
