import type { Metadata } from 'next'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import WalletClient from '@/components/admin/finance/wallet-client'

export const metadata: Metadata = {
  title: 'کیف پول مشتریان — مالی',
  description: 'موجودی اعتباری مشتریان و سازمان‌ها، شارژ دستی و تاریخچهٔ کامل',
  robots: { index: false, follow: false, nocache: true },
}

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="کیف پول مشتریان"
        description="اعتبار خرد و سازمانی — شارژ، مصرف، بازپرداخت و مغایرت‌گیری"
      />
      <WalletClient />
    </div>
  )
}
