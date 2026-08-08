export type OrderEvent =
  | { type: 'order.created'; orderId: string; customerId: string }
  | { type: 'order.status_changed'; orderId: string; from: string; to: string; actorId: string }
  | { type: 'order.paid'; orderId: string }
