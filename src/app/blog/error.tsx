'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function BlogError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="مجله بارگذاری نشد"
      description="در نمایش فهرست مقالات مشکلی پیش آمد. می‌توانید دوباره تلاش کنید یا به صفحهٔ اصلی برگردید."
      secondaryAction={{ href: '/', label: 'بازگشت به خانه' }}
    />
  )
}
