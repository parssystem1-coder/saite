import { cn } from '@/lib/utils'

interface TechTextProps {
  children: React.ReactNode
  className?: string
  as?: 'span' | 'div' | 'p'
}

/**
 * متن فنی/لاتین با جهت چپ‌به‌راست اجباری.
 *
 * برای شمارهٔ مدل، SKU و مقادیر فنی (12 ppm، 600 dpi، A4) استفاده شود.
 * بدون این کامپوننت، موتور دوجهتی مرورگر در متن راست‌به‌چپ فارسی،
 * ترتیب کاراکترها را جابه‌جا می‌کند و مثلاً «LBP-2900» را
 * به شکل «2900-LBP» نمایش می‌دهد.
 */
export function TechText({ children, className, as: Tag = 'span' }: TechTextProps) {
  return (
    <Tag dir="ltr" className={cn('inline-block font-mono tracking-tight', className)}>
      {children}
    </Tag>
  )
}
