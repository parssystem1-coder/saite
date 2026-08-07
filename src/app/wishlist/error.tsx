'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function WishlistError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="علاقه‌مندی‌ها بارگذاری نشد"
      description="در نمایش فهرست علاقه‌مندی‌ها مشکلی پیش آمد. داده‌های شما پاک نشده‌اند."
      secondaryAction={{ href: '/products', label: 'فهرست محصولات' }}
    />
  )
}
