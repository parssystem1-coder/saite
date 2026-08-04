import { redirect } from 'next/navigation'

/** مسیر قدیمی گزارش‌ها */
export default function Page() {
  redirect('/admin/reports/sales')
}
