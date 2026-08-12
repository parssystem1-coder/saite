import 'server-only'
import type { OrderEvent } from '@/server/modules/orders/events'
import type { FinanceEvent } from '@/server/modules/finance/events'
import type { ShippingEvent } from '@/server/modules/shipping/events'
import type { MarketingEvent } from '@/server/modules/marketing/events'
import type { ProductEvent } from '@/server/modules/products/events'
import type { ContentEvent } from '@/server/modules/content/events'

/**
 * ثابت‌های نوع رویدادها — منبع واحد برای publish و مصرف (worker).
 *
 * از type های events.ts مشتق شده‌اند تا هر جا نوع جدید اضافه شد،
 * رشتهٔ type هم در همینجا به‌روز شود و دیگر literal پراکنده نماند.
 */

export const OrderEvents = {
  created: 'order.created',
  statusChanged: 'order.status_changed',
  paid: 'order.paid',
} as const

export const FinanceEvents = {
  created: 'invoice.created',
  paid: 'invoice.paid',
  refunded: 'invoice.refunded',
} as const

export const ShippingEvents = {
  created: 'shipment.created',
  statusChanged: 'shipment.status_changed',
} as const

export const MarketingEvents = {
  couponCreated: 'coupon.created',
  couponApplied: 'coupon.applied',
  campaignCreated: 'campaign.created',
} as const

export const ProductEvents = {
  created: 'product.created',
  updated: 'product.updated',
  deleted: 'product.deleted',
} as const

export const ContentEvents = {
  pageCreated: 'page.created',
  pageUpdated: 'page.updated',
  pageDeleted: 'page.deleted',
  postCreated: 'post.created',
  postUpdated: 'post.updated',
  postDeleted: 'post.deleted',
  menuItemCreated: 'menu_item.created',
  menuItemUpdated: 'menu_item.updated',
  menuItemDeleted: 'menu_item.deleted',
} as const

// Re-export تایپ‌ها برای convenience
export type { OrderEvent, FinanceEvent, ShippingEvent, MarketingEvent, ProductEvent, ContentEvent }
