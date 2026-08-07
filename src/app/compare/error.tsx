'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function CompareError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="مقایسه بارگذاری نشد"
      description="در نمایش جدول مقایسه مشکلی پیش آمد. سبد مقایسه شما حفظ شده است؛ دوباره تلاش کنید."
      secondaryAction={{ href: '/products', label: 'فهرست محصولات' }}
    />
  )
}
