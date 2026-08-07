import 'server-only'

/**
 * گاردهای دسترسی برای Route Handlerها و Server Actions.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل جدا از admin-session.ts است
 * ══════════════════════════════════════════════════════════════
 * `getAdminSession()` فقط «کیست؟» را می‌گوید. این فایل «آیا
 * می‌تواند این کار را بکند؟» را می‌گوید. جدا نگه‌داشتن این دو
 * یعنی هر route handler صریحاً می‌نویسد چه مجوزی می‌خواهد و
 * تست‌ها می‌توانند فقط این لایه را mock کنند.
 *
 * ── الگوی استفاده ─────────────────────────────────────────────
 *
 *   export async function POST(req: Request) {
 *     const guard = await requirePermission('finance:write')
 *     if (!guard.ok) return guard.response
 *
 *     const { admin } = guard  // { id, role: 'admin', ... }
 *     // ... منطق تجاری
 *   }
 *
 * سه پاسخ ممکن:
 *   • { ok: true, admin }               → عبور
 *   • { ok: false, response: 401 }      → نشست وجود ندارد
 *   • { ok: false, response: 403 }      → نشست هست ولی مجوز نه
 *
 * تفکیک ۴۰۱ و ۴۰۳ عمدی است: کلاینت باید بداند کدام است تا واکنش
 * درست بدهد (ریدایرکت به login در ۴۰۱، پیام «دسترسی ندارید» در
 * ۴۰۳).
 */

import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth/server/admin-session'
import { hasPermission, type Permission } from '@/lib/auth/rbac'
import type { AdminRole, AdminUser } from '@/types/user'

export type Guard =
  | { ok: true; admin: AdminUser }
  | { ok: false; response: NextResponse }

const noStoreHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate, private' }

function unauthorized(reason: 'no-session' | 'forbidden'): NextResponse {
  const status = reason === 'no-session' ? 401 : 403
  const message =
    reason === 'no-session'
      ? 'نشست ادمین یافت نشد. دوباره وارد شوید.'
      : 'دسترسی لازم برای این عمل را ندارید.'
  return NextResponse.json({ ok: false, reason, message }, { status, headers: noStoreHeaders })
}

/**
 * فقط بررسی می‌کند نشست معتبر ادمین وجود دارد.
 *
 * برای route handlerهایی که با هر نقشی قابل دسترس‌اند (مثلاً GET
 * روی داشبورد که همه ادمین‌ها می‌بینند).
 */
export async function requireAdmin(): Promise<Guard> {
  const admin = await getAdminSession()
  if (!admin) return { ok: false, response: unauthorized('no-session') }
  return { ok: true, admin }
}

/**
 * نشست + مجوز مشخص.
 *
 * @example
 *   const guard = await requirePermission('finance:write')
 *   if (!guard.ok) return guard.response
 */
export async function requirePermission(permission: Permission): Promise<Guard> {
  const admin = await getAdminSession()
  if (!admin) return { ok: false, response: unauthorized('no-session') }
  if (!hasPermission(admin.role, permission)) {
    return { ok: false, response: unauthorized('forbidden') }
  }
  return { ok: true, admin }
}

/**
 * نشست + هر یک از این مجوزها.
 *
 * وقتی یک route چند نوع عمل انجام می‌دهد و هر کدام مجوز جدا
 * دارد، این helper به هر ادمینی که حداقل یکی را دارد اجازه
 * می‌دهد وارد شود؛ منطق نوشتاری داخل خود روت بعداً هر عمل را
 * جداگانه چک می‌کند.
 */
export async function requireAnyPermission(
  permissions: readonly Permission[]
): Promise<Guard> {
  const admin = await getAdminSession()
  if (!admin) return { ok: false, response: unauthorized('no-session') }
  const has = permissions.some((p) => hasPermission(admin.role, p))
  if (!has) return { ok: false, response: unauthorized('forbidden') }
  return { ok: true, admin }
}

/**
 * نشست + نقش دقیق (بدون بررسی مجوز، برای مواردی که تصمیم بر
 * اساس نقش خام مهم است — مثلاً «فقط admin می‌تواند نقش دیگری را
 * عوض کند»).
 */
export async function requireRole(role: AdminRole): Promise<Guard> {
  const admin = await getAdminSession()
  if (!admin) return { ok: false, response: unauthorized('no-session') }
  if (admin.role !== role) return { ok: false, response: unauthorized('forbidden') }
  return { ok: true, admin }
}
