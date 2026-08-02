'use client'

import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { motion } from 'framer-motion'
import { 
  Users, 
  Package, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity
} from 'lucide-react'
import { FadeIn } from '@/components/ui/fade-in'
import { cn } from '@/lib/utils'

export function AdminClient() {
  const stats = [
    { label: 'فروش کل ماه', value: '۴۵۸,۰۰۰,۰۰۰ تومان', icon: DollarSign, trend: '+۱۲.۵٪', up: true },
    { label: 'سفارشات جدید', value: '۱۲۸', icon: Package, trend: '+۵.۲٪', up: true },
    { label: 'کاربران فعال', value: '۱,۴۲۰', icon: Users, trend: '+۱۸.۷٪', up: true },
    { label: 'نرخ تبدیل', value: '۳.۸٪', icon: Activity, trend: '-۱.۲٪', up: false },
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <AdminSidebar />
        
        <main className="flex-1 space-y-10">
          <header>
            <h1 className="text-3xl font-black text-foreground">داشبورد مدیریت</h1>
            <p className="mt-2 text-muted-foreground">
              خلاصهٔ وضعیت کسب‌وکار (داده‌های نمایشی — تا اتصال بک‌اند)
            </p>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-all shadow-xl overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all" />
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-black/20 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-bold px-2 py-1 rounded-lg",
                    stat.up ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                  )}>
                    {stat.trend}
                    {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  </div>
                </div>
                
                <div className="relative z-10">
                  <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                  <h3 className="text-xl font-black">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Activity Section Placeholder */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <FadeIn delay={0.4}>
              <div className="h-[400px] rounded-3xl border border-white/10 bg-black/30 p-8 relative overflow-hidden">
                <h3 className="text-xl font-bold mb-6">گزارش فروش لحظه‌ای</h3>
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  {/* شبیه‌سازی نمودار */}
                  <div className="w-full px-10 flex items-end gap-2 h-32">
                    {[40, 70, 45, 90, 65, 80, 50, 85, 100, 60].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 0.6 + (i * 0.05) }}
                        className="flex-1 bg-primary rounded-t-lg" 
                      />
                    ))}
                  </div>
                </div>
                <div className="relative z-10 text-center mt-40">
                  <p className="text-muted-foreground">
                    نمودار فروش پس از اتصال بک‌اند فعال می‌شود.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.5}>
              <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
                <h3 className="text-xl font-bold mb-6">آخرین فعالیت‌های سیستم</h3>
                <div className="space-y-6">
                  {[
                    { user: 'علی محمدی', action: 'خرید پرینتر LBP-2900', time: '۲ دقیقه پیش' },
                    { user: 'سارا رضایی', action: 'ثبت‌نام جدید', time: '۱۵ دقیقه پیش' },
                    { user: 'سیستم', action: 'به‌روزرسانی موجودی انبار', time: '۱ ساعت پیش' },
                    { user: 'رضا علوی', action: 'لغو سفارش', time: '۳ ساعت پیش' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold">
                          {act.user[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{act.user}</p>
                          <p className="text-[10px] text-muted-foreground">{act.action}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </section>
        </main>
      </div>
    </div>
  )
}
