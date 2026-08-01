'use client'

import { useAuthStore } from '@/store/auth-store'
import { motion } from 'framer-motion'
import { User, Package, Heart, Settings, Shield, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'پنل کاربری هوشمند',
  description: 'مدیریت سفارشات، لیست علاقه‌مندی‌ها و تنظیمات حساب کاربری.',
}

export default function DashboardPage() {
  const { user, isLoggedIn } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!mounted || !isLoggedIn) return null

  const stats = [
    { label: 'سفارشات جاری', value: '۲', icon: Package },
    { label: 'علاقه‌مندی‌ها', value: '۱۲', icon: Heart },
    { label: 'پیام‌ها', value: '۵', icon: Bell },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar Menu */}
        <motion.aside 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-4"
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 border-2 border-primary/50">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <nav className="space-y-2">
              {[
                { label: 'داشبورد', icon: Shield, active: true },
                { label: 'سفارشات من', icon: Package },
                { label: 'لیست علاقه‌مندی', icon: Heart },
                { label: 'تنظیمات حساب', icon: Settings },
              ].map((item, i) => (
                <button
                  key={i}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className="text-3xl font-black">{stat.value}</span>
                </div>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity / Welcome */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-10 relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-4 tracking-tight">خوش آمدید، {user?.name.split(' ')[0]}! 🚀</h3>
              <p className="text-muted-foreground max-w-xl leading-relaxed">
                در این بخش می‌توانید وضعیت سفارشات خود را بررسی کنید و پیشنهادات هوشمند اختصاصی خود را مشاهده نمایید. هوش مصنوعی ما در حال بررسی سلیقه شما برای ارائه بهترین تخفیف‌هاست.
              </p>
              <div className="mt-8">
                <Button size="lg" className="px-8 shadow-xl shadow-primary/20">مشاهده آخرین محصولات</Button>
              </div>
            </div>
            {/* AI Decorative Element */}
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
          </motion.section>
        </main>
      </div>
    </div>
  )
}
