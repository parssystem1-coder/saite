'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/components/auth/auth-card'
import { Chrome, Github, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { login } = useAuthStore()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // شبیه‌سازی ورود موفق
    login({
      id: '1',
      name: 'کاربر تست',
      email: email,
      role: 'user'
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <AuthCard 
        title="ورود به سیستم" 
        description="به دنیای خرید هوشمند خوش آمدید. لطفاً اطلاعات خود را وارد کنید."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">پست الکترونیک</label>
            <div className="relative group">
              <Mail className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="email" 
                placeholder="email@example.com" 
                className="pr-10 bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">رمز عبور</label>
              <Link href="#" className="text-xs text-primary hover:underline font-bold">فراموشی رمز؟</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="pr-10 bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg">
            ورود هوشمند
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0d0d0f] px-2 text-muted-foreground font-bold">یا ورود با</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" className="h-12 border-white/5 bg-white/5 hover:bg-white/10">
              <Chrome className="ml-2 h-4 w-4" /> Google
            </Button>
            <Button variant="outline" type="button" className="h-12 border-white/5 bg-white/5 hover:bg-white/10">
              <Github className="ml-2 h-4 w-4" /> GitHub
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            حساب کاربری ندارید؟{' '}
            <Link href="/register" className="text-primary font-bold hover:underline italic">ثبت‌نام کنید</Link>
          </p>
        </form>
      </AuthCard>
    </div>
  )
}
