import 'server-only'
import { financeRepository } from './repository'
import { eventBus } from '@/server/shared/event-bus'
import { INVOICE_DUE_DAYS, TAX_RATE } from '@/server/shared/constants'

function generateInvoiceNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `INV-${y}${m}${d}-${rand}`
}

export const financeService = {
  async createInvoiceFromOrder(order: {
    id: string
    customerId: string
    totalAmount: number
    currency?: string
  }) {
    const existing = await financeRepository.findInvoiceByOrderId(order.id)
    if (existing) return existing

    const taxRate = TAX_RATE
    const subtotal = Math.round(order.totalAmount / (1 + taxRate))
    const taxAmount = order.totalAmount - subtotal

    const invoice = await financeRepository.createInvoice({
      orderId: order.id,
      customerId: order.customerId,
      invoiceNumber: generateInvoiceNumber(),
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount: order.totalAmount,
      currency: order.currency || 'IRR',
      dueDate: new Date(Date.now() + INVOICE_DUE_DAYS * 24 * 60 * 60 * 1000),
    })

    await eventBus.publish('invoice.created', {
      invoiceId: invoice.id,
      orderId: order.id,
      customerId: order.customerId,
      amount: invoice.totalAmount,
    })

    return invoice
  },

  async markInvoicePaid(invoiceId: string, referenceId?: string) {
    const invoice = await financeRepository.updateInvoiceStatus(invoiceId, 'paid', {
      paidAt: new Date(),
    })

    if (referenceId) {
      await financeRepository.createTransaction({
        invoiceId,
        orderId: invoice.orderId,
        type: 'payment',
        amount: invoice.totalAmount,
        currency: invoice.currency,
        referenceId,
        status: 'completed',
      })
    }

    await eventBus.publish('invoice.paid', {
      invoiceId,
      orderId: invoice.orderId,
      amount: invoice.totalAmount,
    })

    return invoice
  },

  async recordRefund(invoiceId: string, amount: number, reason?: string) {
    const invoice = await financeRepository.findInvoiceById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    await financeRepository.createTransaction({
      invoiceId,
      orderId: invoice.orderId,
      type: 'refund',
      amount,
      currency: invoice.currency,
      status: 'completed',
      metadata: { reason },
    })

    await eventBus.publish('invoice.refunded', {
      invoiceId,
      orderId: invoice.orderId,
      amount,
      reason,
    })

    return financeRepository.updateInvoiceStatus(invoiceId, 'refunded')
  },

  async getInvoice(id: string) {
    return financeRepository.findInvoiceById(id)
  },

  async getInvoiceByOrderId(orderId: string) {
    return financeRepository.findInvoiceByOrderId(orderId)
  },

  async listInvoices(opts: Parameters<typeof financeRepository.listInvoices>[0]) {
    return financeRepository.listInvoices(opts)
  },

  async listTransactions(opts: Parameters<typeof financeRepository.listTransactions>[0]) {
    return financeRepository.listTransactions(opts)
  },
}
