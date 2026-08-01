import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginClient } from '@/components/auth/login-client'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'ورود به حساب کاربری',
  description: 'برای پیگیری سفارش‌ها و مشاهدهٔ علاقه‌مندی‌ها وارد حساب خود شوید.',
}

export default function LoginPage() {
  // LoginClient پارامتر redirect را از URL می‌خواند، پس به مرز Suspense نیاز دارد
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
          <Skeleton className="h-[32rem] w-full max-w-md rounded-3xl" />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
