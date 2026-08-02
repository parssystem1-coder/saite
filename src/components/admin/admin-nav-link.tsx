'use client'

import Link from 'next/link'
import { ADMIN_ICON_MAP } from '@/components/admin/admin-nav-icons'
import { isAdminLinkActive, type AdminNavLeaf } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'

interface AdminNavLinkProps {
  item: AdminNavLeaf
  pathname: string
  nested?: boolean
  onNavigate?: () => void
}

export function AdminNavLink({ item, pathname, nested = false, onNavigate }: AdminNavLinkProps) {
  const active = isAdminLinkActive(item.href, pathname)
  const Icon = ADMIN_ICON_MAP[item.icon]

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-xl text-sm font-bold transition-all',
        nested ? 'px-3 py-2 ps-9' : 'px-3 py-2.5',
        active
          ? 'bg-primary text-primary-foreground shadow-glow-sm'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      )}
    >
      <Icon
        className={cn(
          'size-4 shrink-0',
          active ? 'text-primary-foreground' : 'text-primary/80'
        )}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}
