import type { PaymentMethod } from '@/lib/schemas'
/** @deprecated — use ShippingMethod from @/types/shipping (interface) for method config; this is just carrier code for checkout */
export type CheckoutShippingMethod = 'post' | 'tipax' | 'chapar' | 'courier'
/** @deprecated alias for backward compat */
export type ShippingMethod = CheckoutShippingMethod
export interface ShippingAddress { receiverName:string; phone:string; province:string; city:string; address:string; postalCode:string; unit?:string; note?:string }
export interface CheckoutOrderDraft { lines:Array<{id:string;quantity:number}>; shippingAddress:ShippingAddress; shippingMethod:CheckoutShippingMethod; paymentMethod:PaymentMethod; saveAddress:boolean }
