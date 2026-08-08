export type MarketingEvent =
  | { type: 'coupon.created'; couponId: string; code: string }
  | { type: 'coupon.applied'; couponId: string; code: string; orderId: string; discount: number }
  | { type: 'campaign.created'; campaignId: string; name: string }
