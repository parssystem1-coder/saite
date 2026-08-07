import type { PaymentProvider } from '@/types/payment'

/**
 * Mock adapter for payment providers — localStorage based.
 *
 * الگو: src/lib/product-editor/mock-adapter.ts
 */

const STORAGE_KEY = 'saite.payments.providers'

function read(): PaymentProvider[] {
  if (typeof window === 'undefined') return fallback()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw) as PaymentProvider[]
    return Array.isArray(parsed) ? parsed : fallback()
  } catch {
    return fallback()
  }
}

function write(providers: PaymentProvider[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers))
}

function fallback(): PaymentProvider[] {
  return [
    {
      id: 'zarinpal-main',
      name: 'زرین‌پال اصلی',
      code: 'zarinpal',
      environment: 'production',
      active: true,
      priority: 1,
      callbackUrl: '/checkout/callback',
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsVerify: true,
      currency: 'IRT',
      minAmount: 10000,
      maxAmount: 500_000_000,
      timeoutSeconds: 30,
      feePercent: 0.5,
      healthStatus: 'healthy',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'idpay-backup',
      name: 'IDPay پشتیبان',
      code: 'idpay',
      environment: 'sandbox',
      active: false,
      priority: 2,
      callbackUrl: '/checkout/callback',
      supportsRefund: true,
      supportsPartialRefund: false,
      supportsVerify: true,
      currency: 'IRT',
      minAmount: 10000,
      timeoutSeconds: 30,
      healthStatus: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

export function createMockPaymentAdapter() {
  return {
    list(): PaymentProvider[] {
      return read()
    },
    save(provider: PaymentProvider): PaymentProvider[] {
      const next = (() => {
        const all = read()
        const idx = all.findIndex((p) => p.id === provider.id)
        if (idx >= 0) {
          const cloned = [...all]
          cloned[idx] = { ...provider, updatedAt: new Date().toISOString() }
          return cloned
        }
        return [...all, { ...provider, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
      })()
      write(next)
      return next
    },
    remove(id: string): PaymentProvider[] {
      const next = read().filter((p) => p.id !== id)
      write(next)
      return next
    },
    get(id: string): PaymentProvider | undefined {
      return read().find((p) => p.id === id)
    },
    reset(): PaymentProvider[] {
      const fb = fallback()
      write(fb)
      return fb
    },
  }
}

export type PaymentMockAdapter = ReturnType<typeof createMockPaymentAdapter>
