'use client'

import { useCartStore } from '@/store/cart-store'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const formattedTotal = new Intl.NumberFormat('fa-IR').format(totalPrice())

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <ShoppingBag className="h-24 w-24 text-muted-foreground relative z-10" />
          </div>
          <h2 className="text-3xl font-black italic">سبد خرید شما خالی است</h2>
          <p className="text-muted-foreground max-w-md">
            به نظر می‌رسد هنوز محصولی به سبد خرید خود اضافه نکرده‌اید. همین حالا از بهترین محصولات ما دیدن کنید.
          </p>
          <Button asChild size="lg" className="mt-4 px-10">
            <Link href="/products">مشاهده فروشگاه</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items List */}
        <div className="flex-1 space-y-6">
          <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
            <ShoppingBag className="text-primary" />
            سبد خرید شما
          </h1>

          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group relative flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 md:p-6 backdrop-blur-sm hover:bg-white/10 transition-all shadow-xl"
              >
                <div className="relative h-24 w-24 md:h-32 md:w-32 flex-shrink-0 overflow-hidden rounded-2xl bg-black/20">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between h-full space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg md:text-xl line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-black/30 rounded-xl p-1 border border-white/5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-left">
                      <span className="text-lg font-black text-primary">
                        {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <aside className="w-full lg:w-96">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-28 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-6">خلاصه سفارش</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-muted-foreground">
                <span>تعداد اقلام</span>
                <span>{items.length} کالا</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>هزینه ارسال</span>
                <span className="text-green-400">رایگان (AI Reward)</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-center text-xl font-black">
                <span>جمع کل</span>
                <span className="text-primary">{formattedTotal} تومان</span>
              </div>
            </div>

            <Button size="lg" className="w-full h-14 text-lg mt-8 shadow-lg shadow-primary/20" asChild>
              <Link href="/checkout">
                تکمیل فرایند خرید
              </Link>
            </Button>
            
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/products" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                ادامه خرید
              </Link>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  )
}
