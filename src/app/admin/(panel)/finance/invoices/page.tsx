import {
  AdminModulePage,
  createAdminModuleMetadata,
} from '@/components/admin/admin-module-page'

const HREF = '/admin/finance/invoices'

export const metadata = createAdminModuleMetadata(HREF)

export default function Page() {
  return <AdminModulePage href={HREF} />
}
