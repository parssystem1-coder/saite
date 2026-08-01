'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '@/lib/api'
import { ProductCard } from '@/components/ui/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const CATEGORIES = ['همه', 'کالای دیجیتال', 'صوتی و تصویری', 'گجت‌ها']

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('همه')

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'همه' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              فیلترها
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">جستجو</label>
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="نام محصول..."
                    className="pr-10 bg-black/20 border-white/5"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-3">دسته‌بندی</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(109,40,217,0.5)]'
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full" onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('همه')
                }}>
                  پاکسازی فیلترها
                </Button>
              </div>
            </div>
          </div>

          {/* AI Banner */}
          <div className="hidden md:block relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-6 border border-white/10">
            <div className="relative z-10">
              <h3 className="font-bold text-lg leading-tight">پیشنهاد هوشمند</h3>
              <p className="mt-2 text-xs text-muted-foreground">بر اساس سلیقه شما، این محصولات را پیشنهاد می‌کنیم.</p>
            </div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-black">کاتالوگ محصولات</h1>
            <Badge variant="outline" className="px-4 py-1">
              {filteredProducts?.length || 0} محصول یافت شد
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {filteredProducts?.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!isLoading && filteredProducts?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">محصولی پیدا نشد</h3>
              <p className="text-muted-foreground mt-2">لطفاً پارامترهای فیلتر را تغییر دهید.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
