'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function CheckoutError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <SegmentError
      {...props}
      title="تسویه‌حساب کامل نشد"
      description="در این مرحله خطایی رخ داد و هیچ مبلغی از شما کسر نشده است. سبد خرید شما دست‌نخورده باقی مانده؛ می‌توانید دوباره تلاش کنید."
      secondaryAction={{ href: '/cart', label: 'بازگشت به سبد خرید' }}
    />
  )
}
