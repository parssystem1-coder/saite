/** قراردادهای هسته تجارت، مستقل از ORM و UI. */
export type Currency = 'IRR' | 'IRT'
export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'payment_failed' | 'cancelled' | 'processing' | 'ready_to_ship' | 'partially_shipped' | 'shipped' | 'delivered' | 'return_requested' | 'returned' | 'refunded'
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'chargeback'
export type ReservationStatus = 'held' | 'confirmed' | 'released' | 'expired'
export type FulfillmentStatus = 'unfulfilled' | 'picking' | 'packed' | 'partially_shipped' | 'shipped' | 'delivered' | 'exception'
export type ShippingPaymentMode = 'prepaid' | 'cash_on_delivery' | 'free'

export interface Money { amount:number; currency:Currency }
export interface OrderLineSnapshot { id:string; productId:string; sku:string; name:string; model?:string; quantity:number; unitPrice:Money; discount:Money; lineTotal:Money; }
export interface AddressSnapshot { recipientName:string; phone:string; province:string; city:string; addressLine:string; unit?:string; postalCode:string; }
export interface ShippingSnapshot { methodId:string; carrierId:string; serviceName:string; paymentMode:ShippingPaymentMode; customerPayable:Money; carrierCost:Money; storeSubsidy:Money; insurance:Money; packagingFee:Money; quoteId:string; quotedAt:string; label:string; }
export interface PaymentSnapshot { method:'online'|'cod'; status:PaymentStatus; authority?:string; transactionId?:string; paidAt?:string; }
export interface OrderSnapshot { id:string; orderNumber:string; customerId:string; lines:OrderLineSnapshot[]; shippingAddress:AddressSnapshot; shipping:ShippingSnapshot; payment:PaymentSnapshot; subtotal:Money; discountTotal:Money; grandTotal:Money; fulfillmentStatus:FulfillmentStatus; status:OrderStatus; idempotencyKey:string; createdAt:string; updatedAt:string; }
export interface InventoryReservation { id:string; orderId:string; productId:string; quantity:number; status:ReservationStatus; expiresAt:string; confirmedAt?:string; releasedAt?:string; }
export interface CustomerTimelineEvent { id:string; customerId:string; type:'order_created'|'payment'|'shipment'|'delivery'|'return'|'refund'|'message'|'note'|'consent_change'; title:string; metadata:Record<string,string|number|boolean>; actorId?:string; createdAt:string; }
