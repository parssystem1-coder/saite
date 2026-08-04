'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function ProductDetailError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <SegmentError
      {...props}
      title="این محصول نمایش داده نشد"
      description="در بارگذاری اطلاعات این کالا خطایی رخ داد. اگر مشکل ادامه داشت، از فهرست محصولات دوباره وارد شوید."
      secondaryAction={{ href: '/products', label: 'فهرست محصولات' }}
    />
  )
}
