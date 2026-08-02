import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminPlaceholder } from '@/components/admin/admin-placeholder'
import { getAdminIcon } from '@/components/admin/admin-nav-icons'
import { findAdminNavByHref } from '@/lib/admin/nav'

/**
 * صفحهٔ ماژولار ادمین — از روی href در ADMIN_NAV محتوا را می‌سازد.
 * برای routeهای placeholder بدون تکرار کد.
 */
export function createAdminModuleMetadata(href: string): Metadata {
  const item = findAdminNavByHref(href)
  return {
    title: item?.label ?? 'پنل مدیریت',
    description: item?.description,
    robots: { index: false, follow: false },
  }
}

export function AdminModulePage({ href }: { href: string }) {
  const item = findAdminNavByHref(href)
  if (!item) notFound()

  const Icon = getAdminIcon(item.icon)

  return (
    <AdminPlaceholder
      title={item.label}
      description={item.description}
      icon={Icon}
      planned={item.planned}
    />
  )
}
