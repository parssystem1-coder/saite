'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  BarChart3,
  PlusCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { label: 'داشبورد مدیریت', icon: LayoutDashboard, href: '/admin' },
  { label: 'لیست محصولات', icon: Package, href: '/admin/products' },
  { label: 'افزودن محصول', icon: PlusCircle, href: '/admin/products/new' },
  { label: 'سفارشات', icon: ShoppingCart, href: '/admin/orders' },
  { label: 'مشتریان', icon: Users, href: '/admin/users' },
  { label: 'گزارشات مالی', icon: BarChart3, href: '/admin/reports' },
  { label: 'تنظیمات سیستم', icon: Settings, href: '/admin/settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-72 space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl sticky top-28">
        <div className="mb-8 px-2">
          <h2 className="text-xl font-black text-primary tracking-tight">پنل مدیریت</h2>
          <p className="mt-1 text-[10px] tracking-widest text-muted-foreground uppercase">
            مدیریت فروشگاه
          </p>
        </div>

        <nav className="space-y-2">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" 
                    : "hover:bg-white/5 text-muted-foreground hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary/70 group-hover:text-primary")} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-12 p-4 rounded-2xl bg-primary/10 border border-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="mb-1 text-center text-[10px] font-bold text-primary">وضعیت سیستم</p>
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-stock-in" />
              <span className="text-[10px] font-bold">آمادهٔ کار (نمایشی)</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
