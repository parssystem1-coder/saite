export type FinanceEvent =
  | { type: 'invoice.created'; invoiceId: string; invoiceNumber?: string; orderId: string; customerId: string; amount: number }
  | { type: 'invoice.paid'; invoiceId: string; orderId: string; amount: number }
  | { type: 'invoice.refunded'; invoiceId: string; orderId: string; amount: number; reason?: string }
