import { beforeEach, describe, expect, it } from 'vitest'
import {
  computeInvoiceTotals,
  createMockFinanceAdapter,
} from '@/lib/finance/mock-adapter'
import type { Invoice } from '@/types/finance'

/*
  چرا این تست‌ها لازم‌اند
  ─────────────────────────
  ۱) `computeInvoiceTotals` تنها منبع محاسبهٔ مالیات است. اگر یک
     روز کسی اعشار را جای رند کردن روی خط بگذارد، ۲۰٪ فاکتورها
     ۱ ریال اختلاف پیدا می‌کنند.
  ۲) `walletBalance` گاه‌گاه استفاده می‌شود در چند نقطه؛ اگر
     منطق جمع‌بندی بشکند، «شارژ + خرید = ۰» غلط نشان داده می‌شود.
*/

describe('computeInvoiceTotals', () => {
  it('subtotal بدون تخفیف/مالیات را درست حساب می‌کند', () => {
    const t = computeInvoiceTotals([
      { id: 'l', description: 'x', quantity: 3, unitPrice: 1000 },
    ])
    expect(t.subtotal).toBe(3000)
    expect(t.discountTotal).toBe(0)
    expect(t.taxTotal).toBe(0)
    expect(t.total).toBe(3000)
  })

  it('تخفیف درصدی خط را قبل از مالیات اعمال می‌کند', () => {
    const t = computeInvoiceTotals([
      { id: 'l', description: 'x', quantity: 2, unitPrice: 10000, discountPct: 10, taxPct: 9 },
    ])
    // 20000 - 10% = 18000; مالیات 9% = 1620; total = 19620
    expect(t.subtotal).toBe(20000)
    expect(t.discountTotal).toBe(2000)
    expect(t.taxTotal).toBe(1620)
    expect(t.total).toBe(19620)
  })

  it('چند خط را به‌درستی جمع می‌کند', () => {
    const t = computeInvoiceTotals([
      { id: '1', description: 'a', quantity: 1, unitPrice: 1000, taxPct: 9 },
      { id: '2', description: 'b', quantity: 2, unitPrice: 500, taxPct: 9 },
    ])
    expect(t.subtotal).toBe(2000)
    expect(t.taxTotal).toBe(180)
    expect(t.total).toBe(2180)
  })
})

describe('walletBalance', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('جمع درست: شارژ + خرید', () => {
    const adapter = createMockFinanceAdapter()
    adapter.saveWalletEntry({
      id: 'w-x1',
      customerId: 'c1',
      customerName: 'X',
      type: 'topup',
      amount: 100_000,
      balanceAfter: 100_000,
      occurredAt: new Date().toISOString(),
    })
    adapter.saveWalletEntry({
      id: 'w-x2',
      customerId: 'c1',
      customerName: 'X',
      type: 'purchase',
      amount: -30_000,
      balanceAfter: 70_000,
      occurredAt: new Date().toISOString(),
    })
    expect(adapter.walletBalance('c1')).toBe(70_000)
    expect(adapter.walletBalance('unknown')).toBe(0)
  })
})

describe('adapter CRUD basics', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('ذخیره/حذف فاکتور با محاسبهٔ خودکار total', () => {
    const adapter = createMockFinanceAdapter()
    const draft: Invoice = {
      id: 'inv-test',
      number: 'INV-TEST-001',
      type: 'sale',
      status: 'issued',
      customerId: 'c',
      customerName: 'Test',
      issuedAt: new Date().toISOString(),
      lines: [{ id: 'l', description: 'x', quantity: 1, unitPrice: 5000, taxPct: 9 }],
      subtotal: 0, // بی‌اهمیت — بازنویسی می‌شود
      discountTotal: 0,
      taxTotal: 0,
      total: 0,
      paidAmount: 0,
      updatedAt: new Date().toISOString(),
    }
    const after = adapter.saveInvoice(draft)
    const saved = after.find((i) => i.id === 'inv-test')
    expect(saved?.total).toBe(5450)
    expect(saved?.subtotal).toBe(5000)

    const afterRemove = adapter.removeInvoice('inv-test')
    expect(afterRemove.find((i) => i.id === 'inv-test')).toBeUndefined()
  })
})
