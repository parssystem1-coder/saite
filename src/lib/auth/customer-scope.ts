/**
 * کنترل دسترسی مشتری — ownership-based، نه role-based.
 *
 * مشتری فقط باید دادهٔ خودش را ببیند، نه یک نقش سراسری.
 * این فایل جدا از rbac.ts است تا دو مدل auth (ادمین vs مشتری)
 * قاطی نشوند.
 */

export function canAccessOrder(customerId: string, order: { customerId: string }): boolean {
  return order.customerId === customerId
}

export function canAccessCustomerProfile(viewerId: string, targetId: string): boolean {
  return viewerId === targetId
}
