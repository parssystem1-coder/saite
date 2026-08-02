import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CheckoutSuccessClient } from '@/components/checkout/checkout-success-client'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'ثبت موفق سفارش',
  description: 'سفارش شما با موفقیت ثبت شد.',
  robots: { index: false, follow: false },
}

function SuccessFallback() {
  return (
    <div className="container mx-auto flex justify-center px-4 py-16">
      <Skeleton className="h-96 w-full max-w-xl rounded-2xl" />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  )
}
