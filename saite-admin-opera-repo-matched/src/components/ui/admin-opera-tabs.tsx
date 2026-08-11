'use client'

import * as React from 'react'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface AdminOperaTabItem<T extends string = string> { key: T; label: string; badge?: number }

export function AdminOperaTabs<T extends string = string>({ items, value, onValueChange, className }: { items: AdminOperaTabItem<T>[]; value: T; onValueChange: (key: T) => void; className?: string }) {
  return <div role="tablist" aria-label="فیلتر" className={cn('flex flex-wrap gap-2.5', className)}>
    {items.map((item) => <button key={item.key} type="button" role="tab" aria-selected={value === item.key} onClick={() => onValueChange(item.key)} className={cn('h-9 min-w-[78px] rounded-full border px-4 text-xs font-bold transition-all hover:-translate-y-px', value === item.key ? 'border-accent bg-accent text-accent-foreground shadow-[0_5px_14px_hsl(var(--accent)/0.25)]' : 'border-border bg-surface-3 text-foreground hover:border-accent/40 hover:bg-surface-2')}>{item.label}{item.badge ? <span className="ms-1.5 text-[10px] opacity-80">{formatNumber(item.badge)}</span> : null}</button>)}
  </div>
}
