'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function DashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SegmentError
      {...props}
      title="پنل کاربری بارگذاری نشد"
      description="در نمایش اطلاعات حساب شما مشکلی پیش آمد. لطفاً دوباره وارد شوید یا صفحه را رفرش کنید."
      secondaryAction={{ href: '/login', label: 'ورود' }}
    />
  )
}
