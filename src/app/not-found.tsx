'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <h1 className="text-[150px] font-black leading-none text-primary opacity-20">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-4xl font-black italic">مسیر گم شده است</h2>
        </div>
      </motion.div>

      <p className="text-xl text-muted-foreground max-w-md">
        هوش مصنوعی ما نتوانست صفحه‌ای که به دنبال آن بودید را در این کهکشان پیدا کند.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 pt-8">
        <Button size="lg" className="gap-2" asChild>
          <Link href="/">
            <Home className="h-5 w-5" />
            بازگشت به خانه
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="gap-2" asChild>
          <Link href="/products">
            <Search className="h-5 w-5" />
            جستجوی محصولات
          </Link>
        </Button>
      </div>
      
      {/* Decorative Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-[150px]" />
    </div>
  )
}
