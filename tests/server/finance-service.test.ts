import { describe, it, expect, vi, beforeEach } from 'vitest'
import { financeService } from '@/server/modules/finance/service'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    outboxEvent: { create: vi.fn() },
  },
}))

vi.mock('@/server/shared/event-bus', () => ({
  eventBus: { publish: vi.fn() },
}))

vi.mock('@/server/modules/finance/repository', () => ({
  financeRepository: {
    findInvoiceByOrderId: vi.fn(),
    createInvoice: vi.fn(),
    findInvoiceById: vi.fn(),
    updateInvoiceStatus: vi.fn(),
    createTransaction: vi.fn(),
    findInvoiceByNumber: vi.fn(),
    listInvoices: vi.fn(),
    findTransactionById: vi.fn(),
    listTransactions: vi.fn(),
  },
}))

const { financeRepository } = await import('@/server/modules/finance/repository')

describe('financeService — شمارهٔ فاکتور امن', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('شمارهٔ فاکتور در فرمت INV-YYYYMMDD-<hex12> و یکتا است', async () => {
    vi.mocked(financeRepository.findInvoiceByOrderId).mockResolvedValue(null)
    vi.mocked(financeRepository.createInvoice).mockImplementation(
      ((data: { invoiceNumber: string }) =>
        Promise.resolve({ id: 'inv1', ...data })) as never
    )

    const captured: string[] = []
    vi.mocked(financeRepository.createInvoice).mockImplementation(
      ((data: { invoiceNumber: string }) => {
        captured.push(data.invoiceNumber)
        return Promise.resolve({ id: 'inv1', invoiceNumber: data.invoiceNumber })
      }) as never
    )

    await financeService.createInvoiceFromOrder({
      id: 'order1',
      customerId: 'cust1',
      totalAmount: 1000000,
    })
    await financeService.createInvoiceFromOrder({
      id: 'order2',
      customerId: 'cust1',
      totalAmount: 2000000,
    })

    expect(captured).toHaveLength(2)
    const format = /^INV-\d{8}-[0-9a-f]{12}$/
    for (const num of captured) {
      expect(num).toMatch(format)
    }
    expect(captured[0]).not.toBe(captured[1]) // یکتا
  })
})
