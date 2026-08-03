'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function CartError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <SegmentError
      {...props}
      title="سبد خرید نمایش داده نشد"
      description="اقلام سبد شما پاک نشده‌اند و روی این دستگاه محفوظ‌اند. لطفاً دوباره تلاش کنید."
      secondaryAction={{ href: '/products', label: 'ادامهٔ خرید' }}
    />
  )
}
