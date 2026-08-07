export type FulfillmentOrderStatus = 'pending' | 'paid' | 'packing' | 'ready_to_ship' | 'handed_to_carrier' | 'in_transit' | 'delivered' | 'return_requested' | 'return_approved' | 'returned' | 'refunded' | 'cancelled'
/** @deprecated use FulfillmentOrderStatus — kept for backward compat */
export type OrderStatus = FulfillmentOrderStatus
export type PackageType = 'standard_carton' | 'fragile_carton' | 'bubble_mailer' | 'custom'
export type Carrier = 'post' | 'tipax' | 'chapar' | 'courier'
export type ReturnStatus = 'requested' | 'under_review' | 'approved' | 'rejected' | 'received' | 'refunded' | 'closed'
export interface RecipientAddress { fullName:string; companyName?:string; phone:string; province:string; city:string; addressLine:string; postalCode:string; }
export interface FulfillmentItem { productId:string; sku:string; name:string; model?:string; quantity:number; weightGrams?:number; packageId?:string; }
export interface ShipmentPackage { id:string; sequence:number; type:PackageType; itemIds:string[]; lengthCm:number; widthCm:number; heightCm:number; weightGrams:number; declaredValue:number; insuranceEnabled:boolean; fragileLabelApplied:boolean; invoiceInserted:boolean; carrier:Carrier; service:string; shippingCost:number; trackingCode?:string; labelPrintedAt?:string; labelPrintedBy?:string; }
export interface ReturnRequest { id:string; orderId:string; status:ReturnStatus; reason:'damaged'|'wrong_item'|'defective'|'changed_mind'|'other'; customerNote?:string; evidenceUrls?:string[]; requestedAt:string; reviewedAt?:string; reviewedBy?:string; resolution:'replacement'|'refund'|'repair'|'store_credit'; returnShippingPaidBy:'store'|'customer'; refundAmount?:number; receivedAt?:string; }
export type OrderPaymentMethod = 'online' | 'cod' | 'card'
export type OrderPaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export interface OrderPaymentInfo { method: OrderPaymentMethod; status: OrderPaymentStatus; authority?: string; transactionId?: string; paidAt?: string; amount?: number }
export interface OrderFulfillment { orderId:string; recipient:RecipientAddress; items:FulfillmentItem[]; packages:ShipmentPackage[]; returns:ReturnRequest[]; status:FulfillmentOrderStatus; payment?: OrderPaymentInfo; orderTotal:number; declaredTotal:number; internalNote?:string; updatedAt:string; updatedBy:string; }
