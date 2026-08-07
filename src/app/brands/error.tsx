'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function BrandsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="برندها بارگذاری نشد"
      description="در نمایش فهرست برندها مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
      secondaryAction={{ href: '/', label: 'بازگشت به خانه' }}
    />
  )
}
