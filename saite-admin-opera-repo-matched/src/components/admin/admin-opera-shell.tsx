'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { ChevronLeft, ChevronRight, Menu, MoreVertical, X } from 'lucide-react'
import { ADMIN_ICON_MAP } from '@/components/admin/admin-nav-icons'
import { ADMIN_NAV, filterAdminNavByRole, isAdminGroupActive, type AdminNavGroup } from '@/lib/admin/nav'
import { roleLabel } from '@/lib/auth/rbac'
import { useAdminSessionStore } from '@/store/admin-session-store'
import { cn } from '@/lib/utils'
import styles from './admin-opera-shell.module.css'

function activeGroup(nav: AdminNavGroup[], pathname: string) {
  return nav.find((group) => isAdminGroupActive(group, pathname))?.id ?? nav[0]?.id ?? null
}

export function AdminOperaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/admin'
  const admin = useAdminSessionStore((state) => state.admin)
  const role = admin?.role ?? null
  const nav = React.useMemo(() => filterAdminNavByRole(ADMIN_NAV, role), [role])
  const [openId, setOpenId] = React.useState(() => activeGroup(nav, pathname))
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setOpenId(activeGroup(nav, pathname))
  }, [nav, pathname])

  const openGroup = React.useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenId(id)
  }, [])

  const scheduleClose = React.useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenId(null), 240)
  }, [])

  const current = nav.find((group) => group.id === openId) ?? nav[0]
  const roleText = role ? roleLabel(role) : 'فروشگاه ماشین‌های اداری'

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.windowDots}><i /><i /><i /></div>
          <div className={styles.workspaceTab}><span className={styles.brandMark}>س</span><span>پنل مدیریت Saite</span><span className={styles.tabClose}>×</span></div>
          <span className={styles.addTab}>+</span>
          <div className={styles.headerTools}>↻　⌁　<MoreVertical size={14} /></div>
        </div>
        <div className={styles.headerBottom}>
          <div className={styles.headerNav}><ChevronLeft size={15} /><ChevronRight size={15} /><span>↻</span></div>
          <div className={styles.location}>پنل مدیریت / {current?.label ?? 'داشبورد'}</div>
          <div className={styles.headerTools}>☆　◉</div>
        </div>
      </header>

      <aside className={styles.rail} aria-label="ناوبری سریع">
        <div className={styles.logo}>س</div>
        {nav.map((group, index) => {
          const Icon = ADMIN_ICON_MAP[group.icon]
          const isActive = group.id === openId || isAdminGroupActive(group, pathname)
          return (
            <React.Fragment key={group.id}>
              {index === 4 && <div className={styles.rule} />}
              <button
                type="button"
                className={cn(styles.railButton, isActive && styles.railButtonActive)}
                onMouseEnter={() => openGroup(group.id)}
                onFocus={() => openGroup(group.id)}
                onMouseLeave={scheduleClose}
                aria-label={group.label}
              >
                <span className={styles.tooltip}>{group.label}</span>
                <Icon className="size-5" aria-hidden="true" />
              </button>
            </React.Fragment>
          )
        })}
        <div className={styles.spacer} />
        <button type="button" className={styles.mobileMenu} onClick={() => setMobileOpen(true)} aria-label="باز کردن منو"><Menu size={19} /></button>
      </aside>

      <aside
        className={cn(styles.flyout, openId && styles.flyoutOpen, mobileOpen && styles.mobileFlyout)}
        onMouseEnter={() => closeTimer.current && clearTimeout(closeTimer.current)}
        onMouseLeave={scheduleClose}
        aria-label="منوی کناری"
      >
        <div className={styles.flyoutHead}>
          <div><small>SAITE ADMIN</small><h2>{current?.label ?? 'داشبورد'}</h2><p>{roleText}</p></div>
          <button type="button" className={styles.closeButton} onClick={() => setMobileOpen(false)} aria-label="بستن منو"><X size={15} /></button>
        </div>
        <nav className={styles.flyoutBody}>
          <div className={styles.groupLabel}>{current?.label}</div>
          {(current?.children ?? []).map((item) => {
            const Icon = ADMIN_ICON_MAP[item.icon]
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return <Link key={item.id} href={item.href} onClick={() => setMobileOpen(false)} className={cn(styles.flyItem, active && styles.flyItemActive)}><Icon className="size-4" aria-hidden="true" /><span>{item.label}</span></Link>
          })}
          {current?.href && !current.children?.length && <Link href={current.href} className={styles.flyItem}><span>{current.label}</span></Link>}
        </nav>
        <div className={styles.flyoutFoot}><span className={styles.live} />وضعیت سیستم، آماده</div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mobileTopbar}><button type="button" onClick={() => setMobileOpen(true)} aria-label="منو"><Menu size={18} /></button><span>{current?.label ?? 'پنل مدیریت'}</span></div>
        {children}
      </main>
    </div>
  )
}
