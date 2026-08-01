'use client'

import { motion } from 'framer-motion'
import { useSyncExternalStore } from 'react'
import { CheckCircle2, Package, ArrowLeft, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const subscribeNoop = () => () => {}

let cachedOrderNumber: string | null = null
function getOrderNumber() {
  cachedOrderNumber ??= String(Math.floor(100000 + Math.random() * 900000))
  return cachedOrderNumber
}

export default function SuccessPage() {
  // شمارهٔ پیگیری موقت — فقط سمت کلاینت و پایدار بین رندرها.
  // getSnapshot با کش‌کردن مقدار، هم از ناخالصی رندر جلوگیری می‌کند و هم
  // از عدم تطابق HTML سرور/کلاینت.
  // در فاز بک‌اند این مقدار از پاسخ واقعی سفارش خوانده خواهد شد.
  const orderNumber = useSyncExternalStore(
    subscribeNoop,
    getOrderNumber,
    () => '------'
  )

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full rounded-3xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden"
      >
        {/* Decorative AI Glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-green-500/20 blur-[80px]" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50"
            >
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </motion.div>
          </div>

          <div>
            <h1 className="text-4xl font-black italic mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
              پرداخت با موفقیت انجام شد!
            </h1>
            <p className="text-muted-foreground text-lg">
              سفارش شما در سیستم ثبت گردید و هم‌اکنون در حال پردازش توسط هوش مصنوعی است.
            </p>
          </div>

          <div className="py-8 px-6 rounded-2xl bg-black/30 border border-white/5 inline-block mx-auto">
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">شماره پیگیری سفارش</p>
            <p className="text-3xl font-black tracking-widest text-primary">#{orderNumber}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button size="lg" className="h-14 gap-2" asChild>
              <Link href="/dashboard">
                <Package className="h-5 w-5" />
                پیگیری در پنل کاربری
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 gap-2" asChild>
              <Link href="/products">
                <ArrowLeft className="h-5 w-5" />
                بازگشت به فروشگاه
              </Link>
            </Button>
          </div>

          <button className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mx-auto">
            <Share2 className="h-4 w-4" />
            اشتراک‌گذاری خرید با دوستان
          </button>
        </div>
      </motion.div>
    </div>
  )
}
