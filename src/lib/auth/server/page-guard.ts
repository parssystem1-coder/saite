import 'server-only'

/**
 * گاردهای سطح-صفحه — برای Server Componentها.
 *
 * ── چرا جدا از require-role.ts ────────────────────────────────
 * `requirePermission` برای Route Handlerها پاسخ NextResponse
 * برمی‌گرداند. Server Component نمی‌تواند از NextResponse
 * استفاده کند — باید redirect یا notFound صدا بزند. رفتار متفاوت
 * → API متفاوت، تا هیچ‌کدام در جای اشتباه استفاده نشود.
 *
 * ── الگوی استفاده ─────────────────────────────────────────────
 *
 *   export default async function Page() {
 *     const admin = await requirePagePermission('finance:read')
 *     // ... منطق صفحه — admin تضمینی و با مجوز است
 *   }
 *
 * اگر نشست نبود → redirect به login؛ اگر مجوز نبود → 403 (که در
 * `admin/(panel)/forbidden` رندر می‌شود).
 */

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/server/admin-session'
import { hasPermission, type Permission } from '@/lib/auth/rbac'
import type { AdminUser } from '@/types/user'

export async function requirePagePermission(
  permission: Permission
): Promise<AdminUser> {
  const admin = await getAdminSession()
  if (!admin) {
    redirect('/admin/login')
  }
  if (!hasPermission(admin.role, permission)) {
    redirect('/admin/forbidden')
  }
  return admin
}
