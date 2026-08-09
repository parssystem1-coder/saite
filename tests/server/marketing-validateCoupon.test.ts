import { describe, expect, it, vi, beforeEach } from 'vitest'
import { marketingService, CouponValidationError } from '@/server/modules/marketing/service'
import { marketingRepository } from '@/server/modules/marketing/repository'

// Mock کردن repository
vi.mock('@/server/modules/marketing/repository', () => ({
  marketingRepository: {
    findCouponByCode: vi.fn(),
    createCoupon: vi.fn(),
    incrementCouponUsage: vi.fn(),
    tryIncrementCouponUsageAtomic: vi.fn(),
    findRedemption: vi.fn(),
    countRedemptionsByCustomer: vi.fn(),
    createRedemption: vi.fn(),
    findCouponById: vi.fn(),
    listCoupons: vi.fn(),
    createCampaign: vi.fn(),
    findCampaignById: vi.fn(),
    listActiveCampaigns: vi.fn(),
    listCampaigns: vi.fn(),
  },
}))

vi.mock('@/server/shared/event-bus', () => ({
  eventBus: { publish: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('@/server/shared/db', () => ({
  prisma: {
    coupon: { update: vi.fn(), updateMany: vi.fn() },
    couponRedemption: { count: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    outboxEvent: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      // شبیه‌سازی تراکنش — tx را با mockهای بالا می‌سازد
      const tx = {
        coupon: {
          update: vi.fn().mockResolvedValue({}),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        couponRedemption: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({}),
        },
        outboxEvent: { create: vi.fn().mockResolvedValue({}) },
      }
      return fn(tx)
    }),
  },
}))

const baseCoupon = {
  id: 'coupon-1',
  code: 'TEST10',
  name: 'Test',
  type: 'percentage' as const,
  value: 10,
  minOrderAmount: 0,
  maxDiscount: null,
  usageLimit: 10,
  usageCount: 0,
  perCustomerLimit: 1,
  startsAt: null,
  expiresAt: null,
  applicableProducts: [],
  applicableCategories: [],
  firstOrderOnly: false,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('marketingService.validateCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('کوپن ناموجود خطا می‌دهد', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue(null as unknown as never)
    await expect(marketingService.validateCoupon('BAD', { orderAmount: 1000, customerId: 'c1' })).rejects.toThrow(
      CouponValidationError
    )
  })

  it('کوپن غیرفعال خطا می‌دهد', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue({ ...baseCoupon, active: false } as never)
    await expect(marketingService.validateCoupon('TEST10', { orderAmount: 1000, customerId: 'c1' })).rejects.toThrow(
      'غیرفعال'
    )
  })

  it('سقف کلی پر شده خطا می‌دهد', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue({
      ...baseCoupon,
      usageLimit: 5,
      usageCount: 5,
    } as never)
    await expect(marketingService.validateCoupon('TEST10', { orderAmount: 1000, customerId: 'c1' })).rejects.toThrow(
      'تکمیل شده'
    )
  })

  it('حداقل مبلغ سبد رعایت نشود خطا می‌دهد', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue({
      ...baseCoupon,
      minOrderAmount: 50000,
    } as never)
    await expect(marketingService.validateCoupon('TEST10', { orderAmount: 1000, customerId: 'c1' })).rejects.toThrow(
      'حداقل'
    )
  })

  it('تخفیف درصدی درست محاسبه می‌شود', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue({ ...baseCoupon, value: 10 } as never)
    const result = await marketingService.validateCoupon('TEST10', { orderAmount: 100000, customerId: 'c1' })
    expect(result.discount).toBe(10000)
    expect(result.finalAmount).toBe(90000)
  })

  it('سقف maxDiscount برای درصدی اعمال می‌شود', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue({
      ...baseCoupon,
      value: 50,
      maxDiscount: 20000,
    } as never)
    const result = await marketingService.validateCoupon('TEST10', { orderAmount: 100000, customerId: 'c1' })
    expect(result.discount).toBe(20000)
  })

  it('کوپن مبلغ ثابت', async () => {
    vi.mocked(marketingRepository.findCouponByCode).mockResolvedValue({
      ...baseCoupon,
      type: 'fixed_amount',
      value: 5000,
    } as never)
    const result = await marketingService.validateCoupon('TEST10', { orderAmount: 100000, customerId: 'c1' })
    expect(result.discount).toBe(5000)
  })
})
