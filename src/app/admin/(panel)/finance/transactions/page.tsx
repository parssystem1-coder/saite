import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import TransactionsClient from '@/components/admin/finance/transactions-client'

export const metadata: Metadata = {
  title: 'تراکنش‌ها — مالی',
  description: 'تاریخچهٔ ورود و خروج وجه با فیلتر کانال، جستجو و مغایرت‌گیری',
  robots: { index: false, follow: false, nocache: true },
}

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تراکنش‌ها"
        description="ورود و خروج وجه از درگاه، کارتخوان، انتقال بانکی و کیف پول — با تایید/رد دستی"
      />
      <TransactionsClient />
    </div>
  )
}
