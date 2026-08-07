import type { PaymentMethod } from '@/lib/schemas'
export type ShippingMethod = 'post'|'tipax'|'chapar'|'courier'
export interface ShippingAddress { receiverName:string; phone:string; province:string; city:string; address:string; postalCode:string; unit?:string; note?:string }
export interface CheckoutOrderDraft { lines:Array<{id:string;quantity:number}>; shippingAddress:ShippingAddress; shippingMethod:ShippingMethod; paymentMethod:PaymentMethod; saveAddress:boolean }
