'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function ProductsError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <SegmentError
      {...props}
      title="کاتالوگ بارگذاری نشد"
      description="در نمایش فهرست محصولات مشکلی پیش آمد. می‌توانید دوباره تلاش کنید یا فیلترها را ساده‌تر کنید."
      secondaryAction={{ href: '/', label: 'بازگشت به خانه' }}
    />
  )
}
