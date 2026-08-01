'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthCard } from '@/components/auth/auth-card'
import { User, Mail, Lock, Phone } from 'lucide-react'

export function RegisterClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Register attempt:', formData)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <AuthCard 
        title="عضویت در سایت" 
        description="به جمع هزاران کاربر هوشمند ما بپیوندید و از مزایای ویژه بهره‌مند شوید."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">نام کامل</label>
            <div className="relative group">
              <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="نام و نام خانوادگی" 
                className="pr-10 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">پست الکترونیک</label>
            <div className="relative group">
              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="email" 
                placeholder="email@example.com" 
                className="pr-10 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">شماره همراه</label>
            <div className="relative group">
              <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="tel" 
                placeholder="۰۹۱۲۳۴۵۶۷۸۹" 
                className="pr-10 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">رمز عبور</label>
            <div className="relative group">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="pr-10 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-lg mt-6">
            ایجاد حساب کاربری
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href="/login" className="text-primary font-bold hover:underline italic">وارد شوید</Link>
          </p>
        </form>
      </AuthCard>
    </div>
  )
}
