export type ShippingEvent =
  | { type: 'shipment.created'; shipmentId: string; orderId: string; carrier: string }
  | { type: 'shipment.status_changed'; shipmentId: string; orderId: string; status: string; trackingNumber?: string | null }
