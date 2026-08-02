import { redirect } from 'next/navigation'

/** مسیر قدیمی — به مشتریان منتقل شد */
export default function Page() {
  redirect('/admin/customers')
}
