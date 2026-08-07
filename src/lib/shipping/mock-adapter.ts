import type { ShippingMethod } from '@/types/shipping'

/**
 * Mock adapter for shipping settings — localStorage based.
 *
 * الگو: src/lib/product-editor/mock-adapter.ts
 * داده در مرورگر می‌ماند تا بدون بک‌اند قابل نمایش باشد؛
 * قرارداد ثابت است و با اتصال API فقط بدنه عوض می‌شود.
 */

const STORAGE_KEY = 'saite.shipping.methods'

function read(): ShippingMethod[] {
  if (typeof window === 'undefined') return fallback()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw) as ShippingMethod[]
    return Array.isArray(parsed) ? parsed : fallback()
  } catch {
    return fallback()
  }
}

function write(methods: ShippingMethod[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(methods))
}

function fallback(): ShippingMethod[] {
  // دادهٔ نمونهٔ اولیه برای نمایش خالی نبودن پنل
  return [
    {
      id: 'post-prepaid',
      name: 'پست پیشتاز، پیش‌کرایه',
      carrierId: 'post',
      serviceName: 'پیشتاز',
      paymentMode: 'prepaid',
      pricingModel: 'flat_rate',
      flatRate: 85000,
      zones: ['zone-national'],
      allowedCategories: [],
      estimatedMinDays: 2,
      estimatedMaxDays: 3,
      customerLabel: 'پست پیشتاز',
      customerDescription: 'تحویل ۲ تا ۳ روزه — رایگان بالای ۲ میلیون',
      active: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'tipax-cod',
      name: 'تیپاکس، پس‌کرایه',
      carrierId: 'tipax',
      serviceName: 'تیپاکس',
      paymentMode: 'cash_on_delivery',
      pricingModel: 'carrier_rate',
      baseRate: 120000,
      perKgRate: 15000,
      zones: ['zone-metro'],
      allowedCategories: [],
      estimatedMinDays: 1,
      estimatedMaxDays: 2,
      customerLabel: 'تیپاکس — پس‌کرایه',
      customerDescription: 'پرداخت هزینه حمل هنگام تحویل به تیپاکس',
      active: true,
      priority: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

export function createMockShippingAdapter() {
  return {
    list(): ShippingMethod[] {
      return read()
    },
    save(method: ShippingMethod): ShippingMethod[] {
      const next = (() => {
        const all = read()
        const idx = all.findIndex((m) => m.id === method.id)
        if (idx >= 0) {
          const cloned = [...all]
          cloned[idx] = { ...method, updatedAt: new Date().toISOString() }
          return cloned
        }
        return [...all, { ...method, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
      })()
      write(next)
      return next
    },
    remove(id: string): ShippingMethod[] {
      const next = read().filter((m) => m.id !== id)
      write(next)
      return next
    },
    get(id: string): ShippingMethod | undefined {
      return read().find((m) => m.id === id)
    },
    reset(): ShippingMethod[] {
      const fb = fallback()
      write(fb)
      return fb
    },
  }
}

export type ShippingMockAdapter = ReturnType<typeof createMockShippingAdapter>
