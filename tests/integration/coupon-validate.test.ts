import { describe, it, expect, vi, beforeEach } from 'vitest'
import { marketingService } from '@/server/modules/marketing/service'

vi.mock('@/server/shared/db', () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
    },
    couponRedemption: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const { prisma } = await import('@/server/shared/db')

describe('POST /api/marketing/coupons/validate — Coupon Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseCoupon = {
    id: 'c1',
    code: 'SAVE10',
    name: '۱۰٪ تخفیف',
    type: 'percentage',
    value: 10,
    active: true,
    usageLimit: null,
    usageCount: 0,
    perCustomerLimit: 1,
    minOrderAmount: 100000,
    maxDiscount: null,
    startsAt: null,
    expiresAt: null,
    applicableProducts: [],
    applicableCategories: [],
    firstOrderOnly: false,
  }

  const baseOpts = {
    orderAmount: 200000,
    customerId: 'cust1',
  }

  it('Q1-3a: کوپن معتبر — تخفیف درصدی', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(baseCoupon as never)

    const result = await marketingService.validateCoupon('SAVE10', baseOpts)

    expect(result.discount).toBe(20000) // 10% of 200000
    expect(result.finalAmount).toBe(180000)
  })

  it('Q1-3b: کوپن ناموجود — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null)

    await expect(
      marketingService.validateCoupon('INVALID', baseOpts)
    ).rejects.toThrow('کد تخفیف یافت نشد')
  })

  it('Q1-3c: کوپن غیرفعال — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      active: false,
    } as never)

    await expect(
      marketingService.validateCoupon('SAVE10', baseOpts)
    ).rejects.toThrow('کد تخفیف غیرفعال')
  })

  it('Q1-3d: کوپن منقضی شده — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      expiresAt: new Date('2020-01-01'),
    } as never)

    await expect(
      marketingService.validateCoupon('SAVE10', baseOpts)
    ).rejects.toThrow('منقضی')
  })

  it('Q1-3e: کوپن هنوز فعال نشده — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      startsAt: new Date('2099-01-01'),
    } as never)

    await expect(
      marketingService.validateCoupon('SAVE10', baseOpts)
    ).rejects.toThrow('هنوز فعال نشده')
  })

  it('Q1-3f: سقف استفاده تکمیل شده — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      usageLimit: 100,
      usageCount: 100,
    } as never)

    await expect(
      marketingService.validateCoupon('SAVE10', baseOpts)
    ).rejects.toThrow('سقف استفاده')
  })

  it('Q1-3g: مبلغ سفارش کمتر از حداقل — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      minOrderAmount: 500000,
    } as never)

    await expect(
      marketingService.validateCoupon('SAVE10', { ...baseOpts, orderAmount: 100000 })
    ).rejects.toThrow('حداقل مبلغ')
  })

  it('Q1-3h: سقف تخفیف (maxDiscount) اعمال می‌شود', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      maxDiscount: 5000, // سقف 5000 ریال
    } as never)

    const result = await marketingService.validateCoupon('SAVE10', baseOpts)
    expect(result.discount).toBe(5000) // نه 20000 (10% of 200000)
    expect(result.finalAmount).toBe(195000)
  })

  it('Q1-3i: کوپن fixed_amount', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      type: 'fixed_amount',
      value: 30000,
    } as never)

    const result = await marketingService.validateCoupon('FLAT30K', baseOpts)
    expect(result.discount).toBe(30000)
    expect(result.finalAmount).toBe(170000)
  })

  it('Q1-3j: کوپن فقط اولین سفارش — مشتری جدید', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      firstOrderOnly: true,
    } as never)

    const result = await marketingService.validateCoupon('FIRST', {
      ...baseOpts,
      isFirstOrder: true,
    })
    expect(result.discount).toBe(20000)
  })

  it('Q1-3k: کوپن فقط اولین سفارش — مشتری قدیمی — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      firstOrderOnly: true,
    } as never)

    await expect(
      marketingService.validateCoupon('FIRST', {
        ...baseOpts,
        isFirstOrder: false,
      })
    ).rejects.toThrow('این کد فقط برای اولین سفارش قابل استفاده است')
  })

  it('Q1-3l: محصول خارج از محدوده — CouponValidationError', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...baseCoupon,
      applicableProducts: ['p1', 'p2'],
    } as never)

    await expect(
      marketingService.validateCoupon('SAVE10', {
        ...baseOpts,
        productIds: ['p3'],
      })
    ).rejects.toThrow('محصولات انتخابی معتبر نیست')
  })
})
