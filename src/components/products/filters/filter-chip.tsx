'use client'

import { cn } from '@/lib/utils'

interface FilterChipProps {
  active: boolean
  onClick: () => void
  label: string
}

export function FilterChip({ active, onClick, label }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'w-full rounded-xl px-3 py-2 text-right text-sm transition-all',
        active
          ? 'bg-primary/15 font-bold text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.3)]'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}
