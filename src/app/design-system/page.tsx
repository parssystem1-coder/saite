import type { Metadata } from 'next'
import { DesignSystemClient } from '@/components/design-system/design-system-client'

export const metadata: Metadata = {
  title: 'سیستم طراحی',
  description: 'نمایش کامل توکن‌های رنگ، کامپوننت‌های پایه و المان‌های سه‌بعدی پروژه.',
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  return <DesignSystemClient />
}
