'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface HeaderSearchProps {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  className?: string
  inputClassName?: string
  placeholder?: string
}

/** فرم جستجوی هدر — دسکتاپ و موبایل */
export function HeaderSearch({
  query,
  onQueryChange,
  onSubmit,
  className,
  inputClassName,
  placeholder = 'جستجوی نام یا مدل دستگاه…',
}: HeaderSearchProps) {
  return (
    <form onSubmit={onSubmit} className={cn('relative', className)}>
      <Search
        className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        aria-label="جستجوی محصولات"
        className={cn('pr-10', inputClassName)}
      />
    </form>
  )
}
