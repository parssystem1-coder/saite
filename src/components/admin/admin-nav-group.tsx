'use client'

import { ChevronDown } from 'lucide-react'
import { AdminNavLink } from '@/components/admin/admin-nav-link'
import { ADMIN_ICON_MAP } from '@/components/admin/admin-nav-icons'
import { isAdminGroupActive, type AdminNavGroup as NavGroup } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'

interface AdminNavGroupProps {
  group: NavGroup
  pathname: string
  /** آیا این گروه الان باز است (کنترل‌شده از والد — آکاردئون تک‌باز) */
  open: boolean
  /** درخواست باز/بسته شدن از کاربر */
  onOpenChange: (groupId: string) => void
  onNavigate?: () => void
}

/**
 * یک گروه منوی ادمین.
 * state باز/بسته از والد می‌آید تا فقط یک آکاردئون همزمان باز بماند.
 */
export function AdminNavGroupItem({
  group,
  pathname,
  open,
  onOpenChange,
  onNavigate,
}: AdminNavGroupProps) {
  const children = group.children ?? []
  const hasChildren = children.length > 0
  const groupActive = isAdminGroupActive(group, pathname)
  const Icon = ADMIN_ICON_MAP[group.icon]

  // گروه بدون فرزند = لینک مستقیم (داشبورد)
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
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => onOpenChange(group.id)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
          groupActive || open
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

      <div
        id={panelId}
        role="region"
        aria-label={group.label}
        hidden={!open}
        className={cn('space-y-0.5 pb-1', !open && 'hidden')}
      >
        {open &&
          children.map((child) => (
            <AdminNavLink
              key={child.id}
              item={child}
              pathname={pathname}
              nested
              onNavigate={onNavigate}
            />
          ))}
      </div>
    </div>
  )
}
