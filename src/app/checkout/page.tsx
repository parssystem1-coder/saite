'use client'

import { useState, useEffect } from 'react'
import { useCartHydrated } from '@/hooks/use-has-hydrated'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Phone, User, CreditCard, ShieldCheck, Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const { isLoggedIn, user } = useAuthStore()
  const router = useRouter()
  const hydrated = useCartHydrated()
  const [isProcessing, setIsProcessing] = useState(false)

  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  // باگ نسخهٔ قبل: شرط دوم به `mounted` وابسته بود که در همان اجرا
  // هنوز false بود، پس هدایت به /products یک رندر دیر اتفاق می‌افتاد.
  // isProcessing هم اضافه شد تا پس از clearCart کاربر پرت نشود.
  useEffect(() => {
    if (!hydrated || isProcessing) return
    if (!isLoggedIn) {
      router.push('/login?redirect=/checkout')
      return
    }
    if (items.length === 0) {
      router.push('/products')
    }
  }, [hydrated, isLoggedIn, items.length, router, isProcessing])

  if (!hydrated || !isLoggedIn || items.length === 0) return null

  const formattedTotal = new Intl.NumberFormat('fa-IR').format(totalPrice())

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // شبیه‌سازی فرایند پرداخت
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsProcessing(false)
    clearCart()
    router.push('/checkout/success')
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-black mb-8">تکمیل اطلاعات ارسال</h1>
          
          <form id="checkout-form" onSubmit={handlePayment} className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1 flex items-center gap-2">
                    <User className="h-3 w-3" /> تحویل گیرنده
                  </label>
                  <Input 
                    defaultValue={user?.name}
                    className="bg-black/20 border-white/10 h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> شماره تماس
                  </label>
                  <Input 
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-black/20 border-white/10 h-12 rounded-xl text-left"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> آدرس دقیق پستی
                </label>
                <textarea 
                  rows={3}
                  placeholder="استان، شهر، خیابان، کوچه، پلاک و واحد"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="text-primary h-5 w-5" />
                روش پرداخت
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative group cursor-pointer">
                  <input type="radio" name="payment" id="online" className="peer hidden" defaultChecked />
                  <label htmlFor="online" className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-white/5 bg-white/5 peer-checked:border-primary peer-checked:bg-primary/5 transition-all group-hover:bg-white/10">
                    <CreditCard className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-bold">پرداخت آنلاین</span>
                    <span className="text-[10px] text-muted-foreground mt-1 text-center">امنیت تضمین شده توسط هوش مصنوعی</span>
                  </label>
                </div>
                <div className="relative group cursor-pointer opacity-50 grayscale pointer-events-none">
                  <input type="radio" name="payment" id="cod" className="peer hidden" />
                  <label htmlFor="cod" className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-white/5 bg-white/5 peer-checked:border-primary transition-all">
                    <ShieldCheck className="h-8 w-8 mb-2" />
                    <span className="font-bold">پرداخت در محل</span>
                    <span className="text-[10px] text-muted-foreground mt-1">فعلاً غیرفعال</span>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary Checkout View */}
        <aside className="w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky top-28 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent p-8 backdrop-blur-xl shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-6">خلاصه نهایی</h2>
            <div className="space-y-4 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground line-clamp-1 flex-1 ml-4">{item.name} × {item.quantity}</span>
                  <span className="font-medium whitespace-nowrap">{(item.price * item.quantity).toLocaleString('fa-IR')} تومان</span>
                </div>
              ))}
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-center text-2xl font-black">
                <span>قابل پرداخت</span>
                <span className="text-primary">{formattedTotal} تومان</span>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-16 text-xl mt-8 shadow-xl shadow-primary/30 relative overflow-hidden group"
              form="checkout-form"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="ml-2 h-6 w-6 animate-spin" />
                  در حال اتصال...
                </>
              ) : (
                <>
                  پرداخت و ثبت نهایی
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  />
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center mt-6 leading-relaxed">
              با کلیک بر روی دکمه بالا، شما قوانین و مقررات خرید از فروشگاه هوشمند ما را می‌پذیرید.
            </p>
          </motion.div>
        </aside>
      </div>
    </div>
  )
}
