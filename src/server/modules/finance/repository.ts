import 'server-only'
import { Prisma, $Enums } from '@prisma/client'
import { prisma } from '@/server/shared/db'
import type { InvoiceStatus } from '@/types/finance'

export interface CreateInvoiceData {
  orderId: string
  customerId: string
  invoiceNumber: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency?: string
  dueDate?: Date
  notes?: string
  metadata?: Record<string, unknown> | null
}

export type DbTransactionType = 'payment' | 'refund' | 'fee' | 'settlement' | 'adjustment'
export type DbTransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed'

export interface CreateTransactionData {
  invoiceId?: string
  orderId?: string
  type: DbTransactionType | string
  amount: number
  currency?: string
  provider?: string
  referenceId?: string
  status?: DbTransactionStatus | string
  metadata?: Record<string, unknown> | null
}

export const financeRepository = {
  async createInvoice(data: CreateInvoiceData) {
    return prisma.invoice.create({
      data: {
        ...data,
        currency: data.currency || 'IRR',
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  },

  async findInvoiceById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: { transactions: true },
    })
  },

  async findInvoiceByOrderId(orderId: string) {
    return prisma.invoice.findUnique({
      where: { orderId },
      include: { transactions: true },
    })
  },

  async findInvoiceByNumber(invoiceNumber: string) {
    return prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { transactions: true },
    })
  },

  async listInvoices(opts: {
    customerId?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const where: Record<string, unknown> = {}
    if (opts.customerId) where.customerId = opts.customerId
    if (opts.status) where.status = opts.status

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { transactions: { take: 5, orderBy: { createdAt: 'desc' } } },
      }),
      prisma.invoice.count({ where }),
    ])
    return { items, total, page, limit }
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus | string, extra?: { paidAt?: Date; notes?: string }) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: status as $Enums.InvoiceStatus,
        ...(extra?.paidAt && { paidAt: extra.paidAt }),
        ...(extra?.notes && { notes: extra.notes }),
      },
    })
  },

  async createTransaction(data: CreateTransactionData) {
    const payload: Prisma.TransactionCreateInput = {
      type: data.type as $Enums.TransactionType,
      amount: data.amount,
      currency: data.currency || 'IRR',
      status: (data.status || 'pending') as $Enums.TransactionStatus,
      ...(data.invoiceId && { invoice: { connect: { id: data.invoiceId } } }),
      ...(data.orderId && { orderId: data.orderId }),
      ...(data.provider && { provider: data.provider }),
      ...(data.referenceId && { referenceId: data.referenceId }),
      ...(data.metadata && { metadata: data.metadata as Prisma.InputJsonValue }),
    }

    return prisma.transaction.create({ data: payload })
  },

  async findTransactionById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
    })
  },

  async updateTransactionStatus(id: string, status: DbTransactionStatus | string, settledAt?: Date) {
    return prisma.transaction.update({
      where: { id },
      data: { status: status as $Enums.TransactionStatus, ...(settledAt && { settledAt }) },
    })
  },

  async listTransactions(opts: {
    invoiceId?: string
    orderId?: string
    type?: string
    page?: number
    limit?: number
  }) {
    const page = opts.page || 1
    const limit = opts.limit || 20
    const where: Record<string, unknown> = {}
    if (opts.invoiceId) where.invoiceId = opts.invoiceId
    if (opts.orderId) where.orderId = opts.orderId
    if (opts.type) where.type = opts.type

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])
    return { items, total, page, limit }
  },
}
