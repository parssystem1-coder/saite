'use client'

import { SegmentError } from '@/components/errors/segment-error'

export default function AdminError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <SegmentError
      {...props}
      title="این بخش پنل بارگذاری نشد"
      description="در نمایش این ماژول مدیریت خطایی رخ داد. سایر بخش‌های پنل همچنان در دسترس‌اند."
      secondaryAction={{ href: '/admin', label: 'داشبورد مدیریت' }}
    />
  )
}
