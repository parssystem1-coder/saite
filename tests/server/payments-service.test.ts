import { describe, it, expect, vi, beforeEach } from 'vitest'
import { paymentsService } from '@/server/payments/service'
import { ValidationError, NotFoundError } from '@/server/shared/errors'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
    paymentIntent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// گیتوی را به‌صورت controlled mock می‌کنیم تا provider واقعی صدا نشود
vi.mock('@/server/payments/gateway', () => ({
  resolvePaymentProviderForCreate: vi.fn(),
}))

const { prisma } = await import('@/server/shared/db')
const { resolvePaymentProviderForCreate } = await import('@/server/payments/gateway')

const pendingOrder = {
  id: 'order1',
  customerId: 'cust1',
  status: 'pending',
  totalAmount: 10000000,
  currency: 'IRR',
}

const mockAdapter = {
  createPayment: vi.fn().mockResolvedValue({
    authority: 'A12345',
    redirectUrl: 'https://pay.example/start/A12345',
    expiresAt: new Date().toISOString(),
  }),
  verifyPayment: vi.fn(),
  refundPayment: vi.fn(),
  healthCheck: vi.fn(),
}

const mockProvider = {
  id: 'zarinpal',
  name: 'زرین‌پال',
  code: 'zarinpal',
  environment: 'sandbox',
  active: true,
  priority: 1,
  callbackUrl: '',
  supportsRefund: false,
  supportsPartialRefund: false,
  supportsVerify: true,
  currency: 'IRR',
  minAmount: 1000,
  timeoutSeconds: 30,
  healthStatus: 'unknown',
  createdAt: '',
  updatedAt: '',
}

describe('paymentsService.initialize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(resolvePaymentProviderForCreate).mockReturnValue({
      adapter: mockAdapter,
      provider: mockProvider,
    } as never)
  })

  it('سفارش یافت نشد → NotFoundError', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
    await expect(paymentsService.initialize('order1', 'cust1')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('سفارش متعلق به مشتری دیگر → ValidationError', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(pendingOrder as never)
    await expect(paymentsService.initialize('order1', 'other')).rejects.toBeInstanceOf(ValidationError)
  })

  it('سفارش غیر-pending → ValidationError', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...pendingOrder, status: 'paid' } as never)
    await expect(paymentsService.initialize('order1', 'cust1')).rejects.toBeInstanceOf(ValidationError)
  })

  it('سفارش با مبلغ کمتر از حداقل → ValidationError', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({ ...pendingOrder, totalAmount: 500 } as never)
    await expect(paymentsService.initialize('order1', 'cust1')).rejects.toBeInstanceOf(ValidationError)
  })

  it('happy path — PaymentIntent ساخته و redirectUrl برمی‌گردد', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(pendingOrder as never)
    vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.paymentIntent.create).mockResolvedValue({
      id: 'pi1',
      redirectUrl: 'https://pay.example/start/A12345',
    } as never)

    const result = await paymentsService.initialize('order1', 'cust1')

    expect(result.redirectUrl).toBe('https://pay.example/start/A12345')
    expect(result.intentId).toBe('pi1')
    // authority و redirectUrl و idempotencyKey و status در create ثبت می‌شوند
    const createArgs = vi.mocked(prisma.paymentIntent.create).mock.calls[0]![0]
    expect(createArgs.data.authority).toBe('A12345')
    expect(createArgs.data.idempotencyKey).toBe('order:order1:zarinpal')
    expect(createArgs.data.status).toBe('redirect_required')
    expect(createArgs.data.currency).toBe('IRR')
  })

  it('idempotent — intent موجود برگردانده می‌شود، بدون create دوباره', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(pendingOrder as never)
    vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValue({
      id: 'pi1',
      authority: 'A12345',
      redirectUrl: 'https://pay.example/start/A12345',
      expiresAt: new Date(Date.now() + 60_000), // هنوز معتبر
    } as never)

    const result = await paymentsService.initialize('order1', 'cust1')

    expect(result.intentId).toBe('pi1')
    expect(prisma.paymentIntent.create).not.toHaveBeenCalled()
  })

  it('intent منقضی — به درگاه قدیمی هدایت نمی‌شود و intent جدید می‌سازد (فاز ۴)', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(pendingOrder as never)
    // intent موجود منقضی شده — باید نادیده گرفته شود
    vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValueOnce({
      id: 'pi-old',
      authority: 'OLD',
      redirectUrl: 'https://pay.example/start/OLD',
      expiresAt: new Date(Date.now() - 1000), // منقضی
    } as never)
    vi.mocked(prisma.paymentIntent.create).mockResolvedValue({
      id: 'pi-new',
      redirectUrl: 'https://pay.example/start/A12345',
    } as never)

    const result = await paymentsService.initialize('order1', 'cust1')

    // نباید intent قدیمی/منقضی برگردد — درگاه جدید ساخته می‌شود
    expect(result.intentId).toBe('pi-new')
    expect(prisma.paymentIntent.create).toHaveBeenCalledTimes(1)
  })

  it('race — اگر create با P2002 شکست، intent موجود برگردانده می‌شود', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(pendingOrder as never)
    vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValueOnce(null) // idempotency check
    vi.mocked(prisma.paymentIntent.create).mockRejectedValueOnce({ code: 'P2002' } as never)
    vi.mocked(prisma.paymentIntent.findUnique).mockResolvedValueOnce({
      id: 'pi1',
      redirectUrl: 'https://pay.example/start/A12345',
    } as never)

    const result = await paymentsService.initialize('order1', 'cust1')
    expect(result.intentId).toBe('pi1')
    expect(result.redirectUrl).toBe('https://pay.example/start/A12345')
  })
})
