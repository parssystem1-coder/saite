'use client'

import * as React from 'react'
import { WalletIcon, Plus, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { createMockFinanceAdapter } from '@/lib/finance/mock-adapter'
import type { WalletEntry, WalletEntryType } from '@/types/finance'
import { Badge, Stat, formatIRR, formatJalaliDate } from './finance-shared'

const TYPE_LABEL: Record<WalletEntryType, string> = {
  topup: 'شارژ',
  purchase: 'خرید',
  refund: 'بازپرداخت',
  adjustment: 'اصلاح',
}

const TYPE_TONE: Record<WalletEntryType, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  topup: 'success',
  purchase: 'info',
  refund: 'warn',
  adjustment: 'default',
}

interface CustomerBalance {
  customerId: string
  customerName: string
  balance: number
  entriesCount: number
}

export default function WalletClient() {
  const adapter = React.useMemo(() => createMockFinanceAdapter(), [])
  const [entries, setEntries] = React.useState<WalletEntry[]>([])
  const [selectedCustomer, setSelectedCustomer] = React.useState<string | null>(null)

  const [topupCustomer, setTopupCustomer] = React.useState('')
  const [topupCustomerName, setTopupCustomerName] = React.useState('')
  const [topupAmount, setTopupAmount] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage sync
    setEntries(adapter.listWalletEntries())
  }, [adapter])

  const customerBalances = React.useMemo<CustomerBalance[]>(() => {
    const map = new Map<string, CustomerBalance>()
    for (const e of entries) {
      const existing = map.get(e.customerId)
      if (existing) {
        existing.balance += e.amount
        existing.entriesCount += 1
      } else {
        map.set(e.customerId, {
          customerId: e.customerId,
          customerName: e.customerName,
          balance: e.amount,
          entriesCount: 1,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance)
  }, [entries])

  const totalBalance = customerBalances.reduce((s, c) => s + c.balance, 0)
  const activeCustomers = customerBalances.filter((c) => c.balance > 0).length

  const selectedEntries = selectedCustomer
    ? entries
        .filter((e) => e.customerId === selectedCustomer)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    : []

  const handleTopup = () => {
    const amountNum = Number(topupAmount.replace(/[^\d]/g, ''))
    if (!topupCustomer.trim() || !topupCustomerName.trim()) {
      setError('شناسه و نام مشتری الزامی است')
      return
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError('مبلغ باید عدد مثبت باشد')
      return
    }
    setError(null)
    const currentBalance = adapter.walletBalance(topupCustomer.trim())
    const entry: WalletEntry = {
      id: `w-${Date.now()}`,
      customerId: topupCustomer.trim(),
      customerName: topupCustomerName.trim(),
      type: 'topup',
      amount: amountNum,
      balanceAfter: currentBalance + amountNum,
      description: 'شارژ دستی از پنل مدیریت',
      occurredAt: new Date().toISOString(),
      createdBy: 'admin',
    }
    setEntries(adapter.saveWalletEntry(entry))
    setTopupCustomer('')
    setTopupCustomerName('')
    setTopupAmount('')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={WalletIcon} label="جمع مانده" value={formatIRR(totalBalance)} tone="success" />
        <Stat icon={WalletIcon} label="مشتریان دارای اعتبار" value={String(activeCustomers)} />
        <Stat icon={ArrowDownRight} label="جمع شارژ" value={formatIRR(entries.filter((e) => e.type === 'topup').reduce((s, e) => s + e.amount, 0))} />
        <Stat
          icon={ArrowUpRight}
          label="جمع مصرف"
          value={formatIRR(-entries.filter((e) => e.type === 'purchase').reduce((s, e) => s + e.amount, 0))}
          tone="warn"
        />
      </div>

      <section className="surface-3d rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="size-4" aria-hidden />
          شارژ اعتبار مشتری
        </h3>
        <div className="flex flex-wrap gap-2">
          <input
            value={topupCustomer}
            onChange={(e) => setTopupCustomer(e.target.value)}
            placeholder="شناسهٔ مشتری (cust-…)"
            className="min-w-[160px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <input
            value={topupCustomerName}
            onChange={(e) => setTopupCustomerName(e.target.value)}
            placeholder="نام مشتری"
            className="min-w-[160px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <input
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="مبلغ (ریال)"
            inputMode="numeric"
            className="min-w-[140px] rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <button
            onClick={handleTopup}
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Plus className="me-2 size-4" aria-hidden />
            شارژ
          </button>
        </div>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface-3d overflow-hidden rounded-2xl">
          <div className="border-b border-border p-4 text-sm font-semibold">مانده مشتریان</div>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">مشتری</th>
                <th className="p-3">مانده</th>
                <th className="p-3">تعداد رکورد</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {customerBalances.map((c) => (
                <tr
                  key={c.customerId}
                  className={`border-t border-border ${selectedCustomer === c.customerId ? 'bg-primary/5' : ''}`}
                >
                  <td className="p-3">
                    <div>{c.customerName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.customerId}</div>
                  </td>
                  <td className="p-3">
                    <span className={c.balance > 0 ? 'text-emerald-300' : c.balance < 0 ? 'text-destructive' : ''}>
                      {formatIRR(c.balance)}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{c.entriesCount.toLocaleString('fa-IR')}</td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        setSelectedCustomer(selectedCustomer === c.customerId ? null : c.customerId)
                      }
                      className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {selectedCustomer === c.customerId ? 'بستن' : 'تاریخچه'}
                    </button>
                  </td>
                </tr>
              ))}
              {customerBalances.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                    هیچ رکوردی نیست — با فرم بالا اولین شارژ را ثبت کنید.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="surface-3d overflow-hidden rounded-2xl">
          <div className="border-b border-border p-4 text-sm font-semibold">
            تاریخچه {selectedCustomer ? `— ${selectedEntries[0]?.customerName ?? ''}` : ''}
          </div>
          {selectedCustomer ? (
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 bg-surface-2">
                  <tr className="text-xs text-muted-foreground">
                    <th className="p-3">نوع</th>
                    <th className="p-3">مبلغ</th>
                    <th className="p-3">مانده</th>
                    <th className="p-3">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntries.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-3">
                        <Badge tone={TYPE_TONE[e.type]}>{TYPE_LABEL[e.type]}</Badge>
                        {e.description && (
                          <div className="mt-1 text-xs text-muted-foreground">{e.description}</div>
                        )}
                      </td>
                      <td className={`p-3 ${e.amount > 0 ? 'text-emerald-300' : 'text-destructive'}`}>
                        {e.amount > 0 ? '+' : ''}
                        {formatIRR(e.amount)}
                      </td>
                      <td className="p-3">{formatIRR(e.balanceAfter)}</td>
                      <td className="p-3 text-xs">{formatJalaliDate(e.occurredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              یک مشتری از ستون کنار انتخاب کنید.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
