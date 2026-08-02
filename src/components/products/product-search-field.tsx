'use client'

import { Search } from 'lucide-react'
import * as React from 'react'
import { Input } from '@/components/ui/input'

interface ProductSearchFieldProps {
  initialValue: string
  onSubmit: (value: string) => void
}

/**
 * جستجوی فیلتر کاتالوگ.
 *
 * با prop «key» از بیرون (مثلاً key={filters.q}) همگام می‌شود تا
 * تغییر q از هدر، بدون setState در effect، فیلد را تازه کند.
 */
export function ProductSearchField({ initialValue, onSubmit }: ProductSearchFieldProps) {
  const [draft, setDraft] = React.useState(initialValue)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(draft.trim())
      }}
      className="space-y-2"
    >
      <label htmlFor="q" className="text-xs font-bold text-muted-foreground">
        جستجو
      </label>
      <div className="relative">
        <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="q"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="نام، مدل یا کد کالا…"
          className="pr-10"
        />
      </div>
    </form>
  )
}
