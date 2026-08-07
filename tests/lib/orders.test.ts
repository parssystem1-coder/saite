import { describe, expect, it } from 'vitest'
import { buildPostalLabelData } from '@/lib/orders/label'
import { calculateRefundAmount, canTransitionReturn } from '@/lib/orders/return-policy'

describe('orders — postal label', () => {
  it('builds A6 label data with barcode fallback', () => {
    const pkg = {
      id: 'pkg-1',
      sequence: 2,
      type: 'standard_carton' as const,
      itemIds: ['p1'],
      lengthCm: 30,
      widthCm: 20,
      heightCm: 15,
      weightGrams: 1500,
      declaredValue: 500000,
      insuranceEnabled: true,
      fragileLabelApplied: true,
      invoiceInserted: true,
      carrier: 'post' as const,
      service: 'پست پیشتاز',
      shippingCost: 85000,
      trackingCode: 'TRK123',
    }

    const recipient = {
      fullName: 'علی رضایی',
      phone: '09123456789',
      province: 'تهران',
      city: 'تهران',
      addressLine: 'خیابان آزادی، پلاک ۱۰',
      postalCode: '1234567890',
    }

    const label = buildPostalLabelData({
      orderId: 'ord-123',
      package: pkg,
      packageCount: 3,
      recipient,
      senderName: 'فروشگاه سایت',
    })

    expect(label.format).toBe('A6')
    expect(label.orderId).toBe('ord-123')
    expect(label.packageSequence).toBe(2)
    expect(label.packageCount).toBe(3)
    expect(label.barcodeValue).toBe('TRK123')
    expect(label.fragile).toBe(true)
    expect(label.carrier).toBe('post')
  })

  it('uses orderId-sequence as barcode when trackingCode missing', () => {
    const pkg = {
      id: 'pkg-2',
      sequence: 1,
      type: 'standard_carton' as const,
      itemIds: ['p1'],
      lengthCm: 20,
      widthCm: 20,
      heightCm: 10,
      weightGrams: 800,
      declaredValue: 100000,
      insuranceEnabled: false,
      fragileLabelApplied: false,
      invoiceInserted: true,
      carrier: 'tipax' as const,
      service: 'تیپاکس',
      shippingCost: 120000,
    }

    const recipient = {
      fullName: 'مریم احمدی',
      phone: '09121234567',
      province: 'اصفهان',
      city: 'اصفهان',
      addressLine: 'خیابان چهارباغ',
      postalCode: '8134657890',
    }

    const label = buildPostalLabelData({
      orderId: 'ord-999',
      package: pkg,
      packageCount: 1,
      recipient,
      senderName: 'سایت',
    })

    expect(label.barcodeValue).toBe('ord-999-1')
    expect(label.trackingCode).toBeUndefined()
  })
})

describe('orders — return policy', () => {
  it('enforces return transitions', () => {
    expect(canTransitionReturn('requested', 'under_review')).toBe(true)
    expect(canTransitionReturn('requested', 'approved')).toBe(false)
    expect(canTransitionReturn('under_review', 'approved')).toBe(true)
    expect(canTransitionReturn('approved', 'received')).toBe(true)
    expect(canTransitionReturn('received', 'refunded')).toBe(true)
    expect(canTransitionReturn('refunded', 'closed')).toBe(true)
    expect(canTransitionReturn('closed', 'requested')).toBe(false)
  })

  it('calculates refund amount with cap', () => {
    const orderTotal = 500000
    expect(
      calculateRefundAmount(
        { id: 'r1', orderId: 'o1', status: 'requested', reason: 'damaged', requestedAt: '', resolution: 'refund', returnShippingPaidBy: 'store', refundAmount: 100000 } as any,
        orderTotal
      )
    ).toBe(100000)

    // بیش از سقف → کپ به orderTotal
    expect(
      calculateRefundAmount(
        { id: 'r1', orderId: 'o1', status: 'requested', reason: 'damaged', requestedAt: '', resolution: 'refund', returnShippingPaidBy: 'store', refundAmount: 999999 } as any,
        orderTotal
      )
    ).toBe(500000)

    // بدون مبلغ مشخص → کل orderTotal
    expect(
      calculateRefundAmount(
        { id: 'r1', orderId: 'o1', status: 'requested', reason: 'damaged', requestedAt: '', resolution: 'refund', returnShippingPaidBy: 'store' } as any,
        orderTotal
      )
    ).toBe(500000)
  })
})
