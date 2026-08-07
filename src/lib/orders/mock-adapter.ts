import type { OrderFulfillment } from '@/types/order-fulfillment'

const STORAGE_KEY = 'saite.orders.fulfillments'

function read(): OrderFulfillment[] {
  if (typeof window === 'undefined') return fallback()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw) as OrderFulfillment[]
    return Array.isArray(parsed) ? parsed : fallback()
  } catch {
    return fallback()
  }
}

function write(data: OrderFulfillment[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function fallback(): OrderFulfillment[] {
  const now = new Date().toISOString()
  return [
    {
      orderId: 'SA-10482',
      recipient: {
        fullName: 'سارا احمدی',
        phone: '09124827301',
        province: 'تهران',
        city: 'تهران',
        addressLine: 'بلوار فردوس شرق، خیابان سازمان برنامه، کوچه ۲۱، پلاک ۱۸، واحد ۴',
        postalCode: '1468753421',
      },
      items: [
        { productId: 'p1', sku: 'CAN-LBP2900', name: 'پرینتر لیزری کانن LBP-2900', quantity: 1, weightGrams: 6200 },
        { productId: 'p2', sku: 'TON-303', name: 'تونر مشکی Canon 303', quantity: 2, weightGrams: 1100 },
      ],
      packages: [
        {
          id: 'pkg-1',
          sequence: 1,
          type: 'fragile_carton',
          itemIds: ['p1', 'p2'],
          lengthCm: 45,
          widthCm: 36,
          heightCm: 28,
          weightGrams: 7600,
          declaredValue: 52300000,
          insuranceEnabled: true,
          fragileLabelApplied: true,
          invoiceInserted: true,
          carrier: 'post',
          service: 'پست پیشتاز',
          shippingCost: 85000,
          trackingCode: 'TRK123456789',
        },
      ],
      returns: [],
      status: 'packing',
      orderTotal: 52300000,
      declaredTotal: 52300000,
      updatedAt: now,
      updatedBy: 'system',
    },
    {
      orderId: 'SA-10481',
      recipient: {
        fullName: 'شرکت آریا چاپ',
        companyName: 'آریا چاپ',
        phone: '02188421900',
        province: 'تهران',
        city: 'تهران',
        addressLine: 'خیابان ولیعصر، پلاک ۱۲۰۰',
        postalCode: '1968843111',
      },
      items: [{ productId: 'p3', sku: 'HP-M402', name: 'پرینتر HP M402dn', quantity: 3, weightGrams: 18000 }],
      packages: [
        {
          id: 'pkg-2',
          sequence: 1,
          type: 'standard_carton',
          itemIds: ['p3'],
          lengthCm: 50,
          widthCm: 40,
          heightCm: 35,
          weightGrams: 18500,
          declaredValue: 187500000,
          insuranceEnabled: false,
          fragileLabelApplied: false,
          invoiceInserted: true,
          carrier: 'tipax',
          service: 'تیپاکس',
          shippingCost: 120000,
          trackingCode: 'TPX987654',
        },
      ],
      returns: [],
      status: 'ready_to_ship',
      orderTotal: 187500000,
      declaredTotal: 187500000,
      updatedAt: now,
      updatedBy: 'system',
    },
    {
      orderId: 'SA-10480',
      recipient: {
        fullName: 'محمد رضایی',
        phone: '09351749220',
        province: 'اصفهان',
        city: 'اصفهان',
        addressLine: 'خیابان چهارباغ',
        postalCode: '8134657890',
      },
      items: [{ productId: 'p4', sku: 'EP-L3250', name: 'پرینتر جوهرافشان Epson L3250', quantity: 1, weightGrams: 4200 }],
      packages: [],
      returns: [
        {
          id: 'ret-1',
          orderId: 'SA-10480',
          status: 'requested',
          reason: 'damaged',
          customerNote: 'کارتن ضربه خورده',
          requestedAt: now,
          resolution: 'refund',
          returnShippingPaidBy: 'store',
          refundAmount: 12800000,
        },
      ],
      status: 'return_requested',
      orderTotal: 12800000,
      declaredTotal: 12800000,
      updatedAt: now,
      updatedBy: 'system',
    },
    {
      orderId: 'SA-10479',
      recipient: {
        fullName: 'نگار کریمی',
        phone: '09107334812',
        province: 'تهران',
        city: 'تهران',
        addressLine: 'سعادت‌آباد',
        postalCode: '1998634512',
      },
      items: [{ productId: 'p5', sku: 'BRO-DCP', name: 'دستگاه کپی Brother DCP-L2540', quantity: 1, weightGrams: 10500 }],
      packages: [
        {
          id: 'pkg-3',
          sequence: 1,
          type: 'standard_carton',
          itemIds: ['p5'],
          lengthCm: 48,
          widthCm: 42,
          heightCm: 38,
          weightGrams: 11000,
          declaredValue: 74200000,
          insuranceEnabled: true,
          fragileLabelApplied: false,
          invoiceInserted: true,
          carrier: 'post',
          service: 'پست پیشتاز',
          shippingCost: 0,
          trackingCode: 'TRK742000',
        },
      ],
      returns: [],
      status: 'delivered',
      orderTotal: 74200000,
      declaredTotal: 74200000,
      updatedAt: now,
      updatedBy: 'system',
    },
    {
      orderId: 'SA-10478',
      recipient: {
        fullName: 'دفتر فنی پارس',
        phone: '02166910204',
        province: 'تهران',
        city: 'تهران',
        addressLine: 'خیابان انقلاب',
        postalCode: '1314657890',
      },
      items: [{ productId: 'p6', sku: 'CAN-G3410', name: 'پرینتر جوهرافشان Canon G3410', quantity: 2, weightGrams: 9000 }],
      packages: [
        {
          id: 'pkg-4',
          sequence: 1,
          type: 'standard_carton',
          itemIds: ['p6'],
          lengthCm: 46,
          widthCm: 38,
          heightCm: 32,
          weightGrams: 9500,
          declaredValue: 33900000,
          insuranceEnabled: false,
          fragileLabelApplied: true,
          invoiceInserted: true,
          carrier: 'chapar',
          service: 'چاپار',
          shippingCost: 95000,
          trackingCode: 'CHP339',
        },
      ],
      returns: [],
      status: 'in_transit',
      orderTotal: 33900000,
      declaredTotal: 33900000,
      updatedAt: now,
      updatedBy: 'system',
    },
  ]
}

export function createMockOrdersAdapter() {
  return {
    list(): OrderFulfillment[] {
      return read()
    },
    get(orderId: string): OrderFulfillment | undefined {
      return read().find((o) => o.orderId === orderId)
    },
    save(order: OrderFulfillment): OrderFulfillment[] {
      const all = read()
      const idx = all.findIndex((o) => o.orderId === order.orderId)
      const next = idx >= 0 ? [...all.slice(0, idx), { ...order, updatedAt: new Date().toISOString() }, ...all.slice(idx + 1)] : [...all, { ...order, updatedAt: new Date().toISOString() }]
      write(next)
      return next
    },
    remove(orderId: string): OrderFulfillment[] {
      const next = read().filter((o) => o.orderId !== orderId)
      write(next)
      return next
    },
    reset(): OrderFulfillment[] {
      const fb = fallback()
      write(fb)
      return fb
    },
  }
}

export type OrdersMockAdapter = ReturnType<typeof createMockOrdersAdapter>
