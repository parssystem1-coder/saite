'use client'

import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, ArrowRight, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <AdminSidebar />
        
        <main className="flex-1 space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/products"><ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-3xl font-black italic">افزودن محصول جدید</h1>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="xl:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-xl space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">نام محصول</label>
                  <Input placeholder="مثلاً: گوشی هوشمند مدل Pro 2026" className="bg-black/20 border-white/10 h-12" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">دسته‌بندی</label>
                    <select className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-12">
                      <option>کالای دیجیتال</option>
                      <option>صوتی و تصویری</option>
                      <option>گجت‌ها</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">قیمت (تومان)</label>
                    <Input type="number" placeholder="۰" className="bg-black/20 border-white/10 h-12 text-left" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1">توضیحات تکمیلی</label>
                  <textarea 
                    rows={6}
                    placeholder="ویژگی‌ها و مشخصات فنی محصول را اینجا بنویسید..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-xl text-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-4">تصویر محصول</label>
                <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center group hover:border-primary/50 transition-all cursor-pointer">
                  <div className="p-4 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground">فایل را اینجا بکشید</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG تا ۵ مگابایت</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button className="w-full h-14 text-lg gap-3">
                  <Save className="h-5 w-5" />
                  ذخیره و انتشار محصول
                </Button>
                <Button variant="outline" className="w-full h-14 text-lg" asChild>
                  <Link href="/admin/products">انصراف</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
