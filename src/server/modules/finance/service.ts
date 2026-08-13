import 'server-only'
import { randomUUID } from 'crypto'
import { financeRepository, type CreateTransactionData } from './repository'
import { eventBus } from '@/server/shared/event-bus'
import { FinanceEvents } from '@/server/shared/event-types'
import { INVOICE_DUE_DAYS, TAX_RATE } from '@/server/shared/constants'
import { NotFoundError } from '@/server/shared/errors'

/**
 * شمارهٔ فاکتور با entropy بالا — جلوگیری از برخورد در ستون @unique.
 * فرمت: INV-YYYYMMDD-<12hex> — UUID بخشی برای فضای نمونهٔ بسیار بزرگ.
 */
function generateInvoiceNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = randomUUID().replace(/-/g, '').slice(0, 12)
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

    await eventBus.publish(FinanceEvents.created, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      amount: invoice.totalAmount,
    })

    return invoice
  },

  async markInvoicePaid(invoiceId: string, referenceId?: string) {
    const existing = await financeRepository.findInvoiceById(invoiceId)
    if (!existing) throw new NotFoundError('فاکتور یافت نشد')

    // ── Idempotency: اگر فاکتور قبلاً paid شده، بدون تغییر برگردان ──
    if (existing.status === 'paid') {
      return existing
    }

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
        provider: undefined,
        referenceId,
        status: 'completed',
      })
    }

    await eventBus.publish(FinanceEvents.paid, {
      invoiceId,
      orderId: invoice.orderId,
      amount: invoice.totalAmount,
    })

    return invoice
  },

  async recordRefund(invoiceId: string, amount: number, reason?: string) {
    const invoice = await financeRepository.findInvoiceById(invoiceId)
    if (!invoice) throw new NotFoundError('فاکتور یافت نشد')

    await financeRepository.createTransaction({
      invoiceId,
      orderId: invoice.orderId,
      type: 'refund',
      amount,
      currency: invoice.currency,
      status: 'completed',
      metadata: { reason },
    })

    await eventBus.publish(FinanceEvents.refunded, {
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

  async getTransaction(id: string) {
    return financeRepository.findTransactionById(id)
  },

  async listTransactions(opts: Parameters<typeof financeRepository.listTransactions>[0]) {
    return financeRepository.listTransactions(opts)
  },

  async createTransaction(data: CreateTransactionData) {
    return financeRepository.createTransaction(data)
  },
}
