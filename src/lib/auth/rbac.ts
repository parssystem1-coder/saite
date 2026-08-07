/**
 * کنترل دسترسی مبتنی بر نقش (RBAC) — منبع واحد حقیقت.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این فایل نه `server-only` است
 * ══════════════════════════════════════════════════════════════
 * سرور تصمیم واقعی را می‌گیرد (`requireRole` در Route Handlerها).
 * اما کلاینت هم باید بداند «این دکمه را نشان بدهم یا نه» تا UI
 * ناسازگار نباشد. اگر منطق روی سرور و کلاینت متفاوت باشد، یا
 * کاربر دکمه‌ای می‌بیند که کار نمی‌کند، یا برعکس. یک منبع پاک،
 * بدون هیچ راز، این را تضمین می‌کند.
 *
 * ⚠️ **این ماژول برای امنیت کافی نیست.** فقط برای «چه کاری در
 * تئوری مجاز است» است. تصمیم واقعی همیشه سرور می‌گیرد.
 *
 * ══════════════════════════════════════════════════════════════
 *  مدل مجوز
 * ══════════════════════════════════════════════════════════════
 * سه نقش، هر کدام مجموعه‌ای از «قابلیت‌ها» دارد. قابلیت‌ها به
 * صورت `resource:action` هستند:
 *
 *   catalog:read      • orders:read      • customers:read
 *   catalog:write     • orders:write     • customers:write
 *   finance:read      • marketing:read   • reports:read
 *   finance:write     • marketing:write  • content:write
 *   settings:read     • settings:write   • users:manage
 *   comms:read        • comms:write
 *
 * چرا این تفکیک؟ چون در عمل بیشتر شرکت‌ها همین دو دستهٔ read/write
 * را می‌خواهند و افزودن یک نقش جدید فقط یک نگاشت به این قابلیت‌ها
 * است، نه رشتهٔ قوانین جدید.
 */

import type { AdminRole } from '@/types/user'

// ═══════════════════════════════════════════════════════════════
//  انواع
// ═══════════════════════════════════════════════════════════════

export type Resource =
  | 'catalog'
  | 'orders'
  | 'customers'
  | 'finance'
  | 'reports'
  | 'marketing'
  | 'comms'
  | 'content'
  | 'settings'
  | 'users'

export type Action = 'read' | 'write' | 'manage'

export type Permission = `${Resource}:${Action}`

// ═══════════════════════════════════════════════════════════════
//  نگاشت نقش → مجوزها
// ═══════════════════════════════════════════════════════════════

/**
 * viewer — فقط خواندن (به‌جز users که حتی خواندنش هم نیاز مجوز
 * بالا دارد).
 */
const VIEWER_PERMISSIONS: readonly Permission[] = [
  'catalog:read',
  'orders:read',
  'customers:read',
  'finance:read',
  'reports:read',
  'marketing:read',
  'comms:read',
  'settings:read',
]

/**
 * operator = viewer + عملیات روزمره.
 *
 * عمداً finance/settings/users را ندارد: مسئول پشتیبانی
 * نباید بتواند مبلغ فاکتور را عوض کند یا رمز درگاه را ببیند.
 */
const OPERATOR_PERMISSIONS: readonly Permission[] = [
  ...VIEWER_PERMISSIONS,
  'catalog:write',
  'orders:write',
  'customers:write',
  'marketing:write',
  'comms:write',
  'content:write',
]

/**
 * admin = همه‌کاره، از جمله مدیریت کاربران.
 */
const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...OPERATOR_PERMISSIONS,
  'finance:write',
  'settings:write',
  'users:manage',
]

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  viewer: VIEWER_PERMISSIONS,
  operator: OPERATOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
}

// ═══════════════════════════════════════════════════════════════
//  API عمومی — همه توابع خالص
// ═══════════════════════════════════════════════════════════════

/**
 * آیا این نقش مجوز مشخصی دارد؟
 *
 * @example
 *   hasPermission('operator', 'finance:read')  // true
 *   hasPermission('operator', 'finance:write') // false
 *   hasPermission('viewer', 'orders:write')    // false
 */
export function hasPermission(
  role: AdminRole | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** آیا این نقش هیچ‌کدام از این مجوزها را دارد؟ */
export function hasAnyPermission(
  role: AdminRole | null | undefined,
  permissions: readonly Permission[]
): boolean {
  if (!role) return false
  return permissions.some((p) => hasPermission(role, p))
}

/** آیا این نقش همهٔ این مجوزها را دارد؟ */
export function hasAllPermissions(
  role: AdminRole | null | undefined,
  permissions: readonly Permission[]
): boolean {
  if (!role) return false
  return permissions.every((p) => hasPermission(role, p))
}

/**
 * برچسب فارسی نقش برای UI.
 *
 * چرا اینجا و نه در کامپوننت: تا اگر یک روز فایل i18n اضافه شد،
 * یک جا عوض شود، نه ۱۰ جا.
 */
export function roleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    viewer: 'ناظر (فقط خواندن)',
    operator: 'اپراتور',
    admin: 'مدیر کل',
  }
  return labels[role]
}

/** آیا نقش داده‌شده مقدار معتبر AdminRole است؟ */
export function isAdminRole(value: unknown): value is AdminRole {
  return value === 'viewer' || value === 'operator' || value === 'admin'
}

/**
 * پارس نقش از env با پیش‌فرض `admin`.
 *
 * چرا پیش‌فرض `admin`: تا کسی که ADMIN_ROLE را تعریف نمی‌کند،
 * مثل رفتار قبلی همه‌کاره باشد. با این تصمیم، فاز B یک تغییر
 * غیرشکنانه است.
 */
export function parseAdminRole(value: string | undefined): AdminRole {
  const trimmed = value?.trim().toLowerCase()
  if (isAdminRole(trimmed)) return trimmed
  return 'admin'
}
