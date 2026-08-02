'use client'

import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { AdminNavLink } from '@/components/admin/admin-nav-link'
import { ADMIN_ICON_MAP } from '@/components/admin/admin-nav-icons'
import { isAdminGroupActive, type AdminNavGroup as NavGroup } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'

interface AdminNavGroupProps {
  group: NavGroup
  pathname: string
  onNavigate?: () => void
}

export function AdminNavGroupItem({ group, pathname, onNavigate }: AdminNavGroupProps) {
  const children = group.children ?? []
  const hasChildren = children.length > 0
  const groupActive = isAdminGroupActive(group, pathname)

  // key روی والد باعث reset state هنگام تغییر route فعال می‌شود — بدون setState در effect
  const [userOpen, setUserOpen] = React.useState<boolean | null>(null)
  const open = userOpen ?? groupActive

  const Icon = ADMIN_ICON_MAP[group.icon]

  if (!hasChildren && group.href) {
    const leaf = {
      id: group.id,
      label: group.label,
      href: group.href,
      icon: group.icon,
      description: group.description ?? '',
      planned: group.planned ?? [],
    }
    return <AdminNavLink item={leaf} pathname={pathname} onNavigate={onNavigate} />
  }

  const panelId = `admin-nav-${group.id}`

  return (
    <div className="space-y-0.5" key={`${group.id}-${groupActive ? 'on' : 'off'}`}>
      <button
        type="button"
        onClick={() => setUserOpen((prev) => !(prev ?? groupActive))}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
          groupActive
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
        )}
      >
        <Icon className="size-4 shrink-0 text-primary/80" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-right">{group.label}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} role="group" aria-label={group.label} className="space-y-0.5 pb-1">
          {children.map((child) => (
            <AdminNavLink
              key={child.id}
              item={child}
              pathname={pathname}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
