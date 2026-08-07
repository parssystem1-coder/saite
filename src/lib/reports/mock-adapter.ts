/**
 * Reports mock adapter — aggregation از دامنه‌های موجود.
 *
 * ═══════════════════════════════════════════════════════════════
 *  چرا reports جدا از دامنه‌های اصلی است
 * ═══════════════════════════════════════════════════════════════
 * گزارش‌گیری یک «view» است، نه «source of truth». دادهٔ خام در
 * finance/orders/customers است؛ اینجا فقط aggregate می‌کنیم.
 *
 * تصمیم دیگر: sample series ثابت برای نمودارها — چون تولید
 * تصادفی روی هر render گزارش را می‌ترکاند و React 19 هم اجازهٔ
 * `Math.random()` در render نمی‌دهد.
 */

import { createMockFinanceAdapter } from '@/lib/finance/mock-adapter'
import type { Transaction } from '@/types/finance'

export interface SalesPoint {
  label: string
  value: number
}

export interface ProductRow {
  sku: string
  name: string
  category: string
  soldQty: number
  revenue: number
  stock: number
}

export interface CustomerRow {
  id: string
  name: string
  orderCount: number
  lifetimeValue: number
  lastOrderDaysAgo: number
  segment: 'vip' | 'repeat' | 'at_risk' | 'new'
}

export interface InventoryRow {
  sku: string
  name: string
  onHand: number
  reorderPoint: number
  turnover30d: number
  status: 'ok' | 'low' | 'out'
}

// ═══════════════════════════════════════════════════════════════

function last12MonthLabels(): string[] {
  const names = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  // شش ماه گذشته + شش ماه آینده کاربردی نیست؛ همان ۱۲ ماه ثابت را ارجاع می‌دهیم
  return names
}

const SAMPLE_SALES_SERIES = [
  120, 145, 168, 132, 158, 194, 215, 246, 289, 305, 342, 388,
] as const

const SAMPLE_PRODUCTS: ProductRow[] = [
  { sku: 'CAN-LBP2900', name: 'پرینتر کانن LBP-2900', category: 'پرینتر', soldQty: 48, revenue: 2016000000, stock: 12 },
  { sku: 'HP-M402', name: 'پرینتر HP LaserJet M402dn', category: 'پرینتر', soldQty: 32, revenue: 1760000000, stock: 5 },
  { sku: 'EPS-L3250', name: 'پرینتر اپسون L3250 جوهرافشان', category: 'پرینتر', soldQty: 27, revenue: 1350000000, stock: 8 },
  { sku: 'TON-303', name: 'تونر Canon 303 مشکی', category: 'مصرفی', soldQty: 156, revenue: 468000000, stock: 42 },
  { sku: 'TON-26A', name: 'تونر HP 26A', category: 'مصرفی', soldQty: 128, revenue: 448000000, stock: 3 },
  { sku: 'INK-664', name: 'جوهر اپسون 664 (۴ رنگ)', category: 'مصرفی', soldQty: 89, revenue: 178000000, stock: 0 },
  { sku: 'BRO-DCP', name: 'کپی برادر DCP-1610W', category: 'کپی', soldQty: 14, revenue: 630000000, stock: 6 },
]

const SAMPLE_INVENTORY: InventoryRow[] = SAMPLE_PRODUCTS.map((p) => {
  const reorder = p.category === 'مصرفی' ? 20 : 3
  const turnover30d = Math.round(p.soldQty / 3)
  let status: InventoryRow['status'] = 'ok'
  if (p.stock === 0) status = 'out'
  else if (p.stock < reorder) status = 'low'
  return {
    sku: p.sku,
    name: p.name,
    onHand: p.stock,
    reorderPoint: reorder,
    turnover30d,
    status,
  }
})

const SAMPLE_CUSTOMERS: CustomerRow[] = [
  { id: 'cust-1', name: 'سارا احمدی', orderCount: 4, lifetimeValue: 52300000, lastOrderDaysAgo: 30, segment: 'repeat' },
  { id: 'cust-2', name: 'شرکت آریا چاپ', orderCount: 12, lifetimeValue: 268000000, lastOrderDaysAgo: 15, segment: 'vip' },
  { id: 'cust-3', name: 'محمد رضایی', orderCount: 2, lifetimeValue: 8400000, lastOrderDaysAgo: 100, segment: 'at_risk' },
  { id: 'cust-4', name: 'شرکت پارس گراف', orderCount: 8, lifetimeValue: 145000000, lastOrderDaysAgo: 45, segment: 'vip' },
  { id: 'cust-5', name: 'فاطمه حسینی', orderCount: 1, lifetimeValue: 3200000, lastOrderDaysAgo: 5, segment: 'new' },
]

// ═══════════════════════════════════════════════════════════════

export function createMockReportsAdapter() {
  const finance = createMockFinanceAdapter()

  return {
    salesSeries(): SalesPoint[] {
      const labels = last12MonthLabels()
      return SAMPLE_SALES_SERIES.map((v, i) => ({ label: labels[i] ?? '', value: v * 1_000_000 }))
    },

    salesSummary() {
      const txs = finance.listTransactions()
      const paidIn = txs.filter((t: Transaction) => t.kind === 'inflow' && t.status === 'succeeded')
      const paidOut = txs.filter((t: Transaction) => t.kind === 'outflow' && t.status === 'succeeded')
      const inflow = paidIn.reduce((s, t) => s + t.amount, 0)
      const outflow = paidOut.reduce((s, t) => s + t.amount, 0)
      const orderCount = paidIn.filter((t) => t.orderId).length
      const avgOrder = orderCount > 0 ? Math.round(inflow / orderCount) : 0
      return { inflow, outflow, net: inflow - outflow, orderCount, avgOrder }
    },

    productLeaderboard(): ProductRow[] {
      return SAMPLE_PRODUCTS.slice().sort((a, b) => b.revenue - a.revenue)
    },

    customerLeaderboard(): CustomerRow[] {
      return SAMPLE_CUSTOMERS.slice().sort((a, b) => b.lifetimeValue - a.lifetimeValue)
    },

    inventoryStatus(): InventoryRow[] {
      return SAMPLE_INVENTORY.slice().sort((a, b) => {
        const rank = { out: 0, low: 1, ok: 2 } as const
        return rank[a.status] - rank[b.status]
      })
    },
  }
}

export type ReportsMockAdapter = ReturnType<typeof createMockReportsAdapter>
