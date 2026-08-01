'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User, Menu, LogOut, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth-store'
import { useEffect, useState } from 'react'

export function Header() {
  const { isLoggedIn, logout } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  // جلوگیری از خطای Hydration در Zustand persist
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-4 z-50 mx-auto w-[95%] max-w-7xl rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl transition-all shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Laser Line Effect */}
      <motion.div 
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 h-[1px] w-40 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
      />
      
      <div className="container mx-auto flex h-16 items-center px-6">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl text-primary">سایت</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary">
              محصولات
            </Link>
            <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
              دسته‌بندی‌ها
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4 space-x-reverse">
          <div className="hidden md:block relative">
            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="جستجوی هوشمند..."
              className="pr-8 w-[200px] lg:w-[300px] bg-white/5 border-white/10"
            />
          </div>
          
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
            </Button>

            {mounted && isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    پنل کاربری
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={logout} title="خروج">
                  <LogOut className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            ) : (
              <Button size="sm" className="hidden sm:flex" asChild>
                <Link href="/login">ورود / ثبت‌نام</Link>
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="sm:hidden" asChild>
              <Link href={mounted && isLoggedIn ? "/dashboard" : "/login"}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
