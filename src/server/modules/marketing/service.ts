import 'server-only'
import { prisma } from '@/server/shared/db'
import { marketingRepository } from './repository'
import { eventBus } from '@/server/shared/event-bus'

export class CouponValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CouponValidationError'
  }
}

export const marketingService = {
  async createCoupon(data: Parameters<typeof marketingRepository.createCoupon>[0]) {
    const coupon = await marketingRepository.createCoupon(data)
    await eventBus.publish('coupon.created', { couponId: coupon.id, code: coupon.code })
    return coupon
  },

  async validateCoupon(code: string, opts: {
    orderAmount: number
    customerId: string
    productIds?: string[]
    categoryIds?: string[]
    isFirstOrder?: boolean
  }) {
    const coupon = await marketingRepository.findCouponByCode(code)
    if (!coupon) throw new CouponValidationError('کد تخفیف یافت نشد')
    if (!coupon.active) throw new CouponValidationError('کد تخفیف غیرفعال است')

    const now = new Date()
    if (coupon.startsAt && now < coupon.startsAt) throw new CouponValidationError('کد تخفیف هنوز فعال نشده')
    if (coupon.expiresAt && now > coupon.expiresAt) throw new CouponValidationError('کد تخفیف منقضی شده')

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new CouponValidationError('سقف استفاده از کد تخفیف تکمیل شده')
    }

    if (opts.orderAmount < coupon.minOrderAmount) {
      throw new CouponValidationError(`حداقل مبلغ سفارش ${coupon.minOrderAmount} ریال است`)
    }

    if (coupon.firstOrderOnly && !opts.isFirstOrder) {
      throw new CouponValidationError('این کد فقط برای اولین سفارش قابل استفاده است')
    }

    if (coupon.applicableProducts.length > 0) {
      const hasApplicable = opts.productIds?.some((id) => coupon.applicableProducts.includes(id))
      if (!hasApplicable) throw new CouponValidationError('کد تخفیف برای محصولات انتخابی معتبر نیست')
    }

    if (coupon.applicableCategories.length > 0) {
      const hasApplicable = opts.categoryIds?.some((id) => coupon.applicableCategories.includes(id))
      if (!hasApplicable) throw new CouponValidationError('کد تخفیف برای دسته‌بندی انتخابی معتبر نیست')
    }

    let discount = 0
    if (coupon.type === 'percentage') {
      discount = Math.round((opts.orderAmount * coupon.value) / 100)
      if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount
    } else if (coupon.type === 'fixed_amount') {
      discount = coupon.value
    } else if (coupon.type === 'free_shipping') {
      discount = 0 // منطق هزینه ارسال جداگانه اعمال می‌شود
    }

    return { coupon, discount, finalAmount: opts.orderAmount - discount }
  },

  async applyCoupon(code: string, orderId: string, opts: Parameters<typeof this.validateCoupon>[1]) {
    const result = await this.validateCoupon(code, opts)

    // ── اعمال اتمیک: سقف کلی + سقف هر مشتری در یک تراکنش ──────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma TransactionClient
    await prisma.$transaction(async (tx: any) => {
      // perCustomerLimit — اگر >0 باشد، تعداد قبلی این مشتری را چک کن
      if (result.coupon.perCustomerLimit > 0) {
        const existingCount = await tx.couponRedemption.count({
          where: { couponId: result.coupon.id, customerId: opts.customerId },
        })
        if (existingCount >= result.coupon.perCustomerLimit) {
          throw new CouponValidationError('سقف استفادهٔ شخصی این کد تکمیل شده')
        }
      }

      // سقف کلی — اتمیک increment فقط اگر usageCount < usageLimit
      let incremented = false
      if (result.coupon.usageLimit === null) {
        await tx.coupon.update({
          where: { id: result.coupon.id },
          data: { usageCount: { increment: 1 } },
        })
        incremented = true
      } else {
        const r = await tx.coupon.updateMany({
          where: { id: result.coupon.id, usageCount: { lt: result.coupon.usageLimit } },
          data: { usageCount: { increment: 1 } },
        })
        incremented = r.count === 1
      }
      if (!incremented) {
        throw new CouponValidationError('سقف استفاده از کد تخفیف تکمیل شده')
      }

      // ثبت redemption برای perCustomerLimit — unique constraint جلوی race را می‌گیرد
      try {
        await tx.couponRedemption.create({
          data: {
            couponId: result.coupon.id,
            customerId: opts.customerId,
            orderId,
          },
        })
      } catch (e: unknown) {
        // P2002 = unique constraint (couponId+customerId یا orderId تکراری)
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('Unique constraint') || msg.includes('P2002')) {
          throw new CouponValidationError('این کد قبلاً توسط شما استفاده شده')
        }
        throw e
      }

      // outbox برای سازگاری با dispatcher (اختیاری — eventBus هم publish می‌کند)
      await tx.outboxEvent.create({
        data: {
          type: 'coupon.applied',
          payload: {
            couponId: result.coupon.id,
            code: result.coupon.code,
            orderId,
            discount: result.discount,
            customerId: opts.customerId,
          } as never,
          aggregateId: result.coupon.id,
        },
      })
    })

    await eventBus.publish('coupon.applied', {
      couponId: result.coupon.id,
      code: result.coupon.code,
      orderId,
      discount: result.discount,
    })
    return result
  },

  async getCoupon(id: string) {
    return marketingRepository.findCouponById(id)
  },

  async listCoupons(opts: Parameters<typeof marketingRepository.listCoupons>[0]) {
    return marketingRepository.listCoupons(opts)
  },

  async createCampaign(data: Parameters<typeof marketingRepository.createCampaign>[0]) {
    const campaign = await marketingRepository.createCampaign(data)
    await eventBus.publish('campaign.created', { campaignId: campaign.id, name: campaign.name })
    return campaign
  },

  async getActiveCampaigns() {
    return marketingRepository.listActiveCampaigns()
  },

  async listCampaigns(opts: Parameters<typeof marketingRepository.listCampaigns>[0]) {
    return marketingRepository.listCampaigns(opts)
  },
}
