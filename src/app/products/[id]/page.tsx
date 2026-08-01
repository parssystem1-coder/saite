'use client'

import { useQuery } from '@tanstack/react-query'
import { getProductById } from '@/lib/api'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, ArrowRight, ShieldCheck, Truck, RefreshCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ProductDetailPage() {
  const { id } = useParams()
  
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id as string),
  })

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold">محصول پیدا نشد</h2>
        <Button asChild className="mt-6">
          <Link href="/products">بازگشت به فروشگاه</Link>
        </Button>
      </div>
    )
  }

  const formattedPrice = new Intl.NumberFormat('fa-IR').format(product.price)

  return (
    <div className="container mx-auto px-4 py-12">
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ArrowRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary">محصولات</Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Product Image 3D Container */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative aspect-square rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 10, rotateX: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative h-full w-full"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        </motion.div>

        {/* Product Info */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center space-y-8"
        >
          <div>
            <Badge variant="default" className="mb-4 px-4 py-1">
              {product.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{product.name}</h1>
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              {product.description || 'توضیحات کوتاهی برای این محصول در دسترس نیست.'}
            </p>
          </div>

          <div className="flex flex-col space-y-4 rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">قیمت نهایی:</span>
              <span className="text-4xl font-black text-primary">{formattedPrice} تومان</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Button size="lg" className="h-16 text-lg gap-3">
                <ShoppingCart className="h-6 w-6" />
                افزودن به سبد خرید
              </Button>
              <Button size="lg" variant="outline" className="h-16 text-lg">
                خرید سریع
              </Button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-white/5">
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck className="h-8 w-8 text-primary/70" />
              <span className="text-xs font-medium">ضمانت اصالت</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck className="h-8 w-8 text-primary/70" />
              <span className="text-xs font-medium">ارسال سریع</span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <RefreshCcw className="h-8 w-8 text-primary/70" />
              <span className="text-xs font-medium">۷ روز بازگشت</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
