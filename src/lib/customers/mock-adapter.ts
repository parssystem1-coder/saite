import type { CustomerProfile } from '@/types/customer'
import { deriveCustomerSegments } from '@/lib/customers/customer-segmentation'

const STORAGE_KEY = 'saite.customers.profiles'

function read(): CustomerProfile[] {
  if (typeof window === 'undefined') return fallback()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback()
    const parsed = JSON.parse(raw) as CustomerProfile[]
    return Array.isArray(parsed) ? parsed : fallback()
  } catch {
    return fallback()
  }
}

function write(data: CustomerProfile[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function fallback(): CustomerProfile[] {
  const now = new Date().toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const hundredDaysAgo = new Date(Date.now() - 100 * 86400000).toISOString()
  const base: Omit<CustomerProfile, 'segments'>[] = [
    {
      id: 'cust-1',
      name: 'سارا احمدی',
      phone: '09124827301',
      email: 'sara@example.com',
      companyName: undefined,
      status: 'active',
      createdAt: '2024-02-15T08:00:00Z',
      lastLoginAt: now,
      lastOrderAt: thirtyDaysAgo,
      orderCount: 4,
      lifetimeValue: 52300000,
      averageOrderValue: 13000000,
      returnCount: 0,
      loyaltyPoints: 520,
      addresses: [
        {
          id: 'addr-1',
          label: 'منزل',
          recipientName: 'سارا احمدی',
          phone: '09124827301',
          province: 'تهران',
          city: 'تهران',
          addressLine: 'بلوار فردوس شرق، کوچه ۲۱، پلاک ۱۸',
          postalCode: '1468753421',
          isDefault: true,
        },
      ],
      consents: { marketing: true, sms: true, email: true, whatsapp: true, consentedAt: now, source: 'checkout' },
      notes: [{ id: 'note-1', body: 'مشتری وفادار — پیگیری ویژه', visibility: 'internal', createdAt: now, createdBy: 'admin-1' }],
      tags: ['vip-followup'],
    },
    {
      id: 'cust-2',
      name: 'شرکت آریا چاپ',
      phone: '02188421900',
      email: 'info@ariaprint.ir',
      companyName: 'آریا چاپ',
      status: 'active',
      createdAt: '2023-11-01T08:00:00Z',
      lastLoginAt: now,
      lastOrderAt: thirtyDaysAgo,
      orderCount: 12,
      lifetimeValue: 320000000,
      averageOrderValue: 26600000,
      returnCount: 1,
      loyaltyPoints: 3200,
      addresses: [
        {
          id: 'addr-2',
          label: 'دفتر مرکزی',
          recipientName: 'شرکت آریا چاپ',
          phone: '02188421900',
          province: 'تهران',
          city: 'تهران',
          addressLine: 'خیابان ولیعصر، پلاک ۱۲۰۰',
          postalCode: '1968843111',
          isDefault: true,
        },
      ],
      consents: { marketing: true, sms: true, email: true, whatsapp: false, consentedAt: now, source: 'admin' },
      notes: [],
      tags: ['b2b', 'priority'],
    },
    {
      id: 'cust-3',
      name: 'محمد رضایی',
      phone: '09351749220',
      status: 'active',
      createdAt: '2024-06-10T08:00:00Z',
      lastLoginAt: hundredDaysAgo,
      lastOrderAt: hundredDaysAgo,
      orderCount: 1,
      lifetimeValue: 12800000,
      averageOrderValue: 12800000,
      returnCount: 1,
      loyaltyPoints: 120,
      addresses: [
        {
          id: 'addr-3',
          label: 'منزل',
          recipientName: 'محمد رضایی',
          phone: '09351749220',
          province: 'اصفهان',
          city: 'اصفهان',
          addressLine: 'خیابان چهارباغ',
          postalCode: '8134657890',
          isDefault: true,
        },
      ],
      consents: { marketing: false, sms: true, email: false, whatsapp: true, consentedAt: now, source: 'registration' },
      notes: [{ id: 'note-2', body: 'در معرض ریزش — ۱۰۰ روز بدون سفارش', visibility: 'internal', createdAt: now, createdBy: 'system' }],
      tags: [],
    },
    {
      id: 'cust-4',
      name: 'نگار کریمی',
      phone: '09107334812',
      email: 'negar@example.com',
      status: 'pending_followup',
      createdAt: '2024-01-20T08:00:00Z',
      lastLoginAt: thirtyDaysAgo,
      lastOrderAt: thirtyDaysAgo,
      orderCount: 6,
      lifetimeValue: 98000000,
      averageOrderValue: 16300000,
      returnCount: 0,
      loyaltyPoints: 980,
      addresses: [
        {
          id: 'addr-4',
          label: 'منزل',
          recipientName: 'نگار کریمی',
          phone: '09107334812',
          province: 'تهران',
          city: 'تهران',
          addressLine: 'سعادت‌آباد',
          postalCode: '1998634512',
          isDefault: true,
        },
      ],
      consents: { marketing: true, sms: true, email: true, whatsapp: true, consentedAt: now, source: 'checkout' },
      notes: [],
      tags: ['at-risk-followup'],
    },
  ]

  return base.map((c) => ({
    ...c,
    segments: deriveCustomerSegments(c as CustomerProfile),
  }))
}

export function createMockCustomersAdapter() {
  return {
    list(): CustomerProfile[] {
      return read()
    },
    get(id: string): CustomerProfile | undefined {
      return read().find((c) => c.id === id)
    },
    save(customer: CustomerProfile): CustomerProfile[] {
      const enriched = { ...customer, segments: deriveCustomerSegments(customer) }
      const all = read()
      const idx = all.findIndex((c) => c.id === customer.id)
      const next = idx >= 0 ? [...all.slice(0, idx), enriched] : [...all, enriched]
      write(next)
      return next
    },
    remove(id: string): CustomerProfile[] {
      const next = read().filter((c) => c.id !== id)
      write(next)
      return next
    },
    reset(): CustomerProfile[] {
      const fb = fallback()
      write(fb)
      return fb
    },
  }
}

export type CustomersMockAdapter = ReturnType<typeof createMockCustomersAdapter>
