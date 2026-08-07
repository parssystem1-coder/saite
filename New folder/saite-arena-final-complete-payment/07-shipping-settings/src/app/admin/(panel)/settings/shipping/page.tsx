import type { Metadata } from 'next'
import { ShippingSettingsPage } from '@/components/admin/shipping/shipping-settings-page'
export const metadata:Metadata={title:'حمل‌ونقل و ارسال',description:'مدیریت شرکت‌های حمل، روش‌های ارسال و قوانین هزینه'}
export const dynamic='force-dynamic'
export default function Page(){return <ShippingSettingsPage/>}
