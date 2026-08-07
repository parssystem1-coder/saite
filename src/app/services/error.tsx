'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function ServicesError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="خدمات بارگذاری نشد"
      description="در نمایش فهرست خدمات مشکلی پیش آمد. می‌توانید دوباره تلاش کنید."
      secondaryAction={{ href: '/', label: 'بازگشت به خانه' }}
    />
  )
}
