'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { ChevronLeft, ChevronRight, Menu, MoreVertical, X } from 'lucide-react'
import { ADMIN_ICON_MAP } from '@/components/admin/admin-nav-icons'
import { AdminSignOut } from '@/components/admin/admin-sign-out'
import {
  ADMIN_NAV,
  filterAdminNavByRole,
  isAdminGroupActive,
  type AdminNavGroup,
} from '@/lib/admin/nav'
import { roleLabel } from '@/lib/auth/rbac'
import { useAdminSessionStore } from '@/store/admin-session-store'
import { cn } from '@/lib/utils'
import styles from './admin-opera-shell.module.css'

function getActiveGroupId(nav: AdminNavGroup[], pathname: string): string | null {
  return nav.find((group) => isAdminGroupActive(group, pathname))?.id ?? nav[0]?.id ?? null
}

type FocusableElement = HTMLElement

export function AdminOperaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/admin'
  const admin = useAdminSessionStore((state) => state.admin)
  const role = admin?.role ?? null

  const nav = React.useMemo(() => filterAdminNavByRole(ADMIN_NAV, role), [role])

  const activeGroupId = React.useMemo(() => getActiveGroupId(nav, pathname), [nav, pathname])

  // hoveredId is explicit string | null (fixes issue #1)
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)
  const [isFlyoutOpen, setIsFlyoutOpen] = React.useState<boolean>(true)
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false)

  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFocusRef = React.useRef<FocusableElement | null>(null)
  const flyoutRef = React.useRef<HTMLElement>(null)
  const railRef = React.useRef<HTMLElement>(null)

  // displayed group is route-oriented: hovered overrides active, but active drives default
  const displayedGroupId = hoveredId ?? activeGroupId
  const currentGroup = React.useMemo(() => {
    if (!nav.length) return null
    return (
      nav.find((g) => g.id === displayedGroupId) ??
      nav.find((g) => g.id === activeGroupId) ??
      nav[0] ??
      null
    )
  }, [nav, displayedGroupId, activeGroupId])

  // cleanup timer on unmount (fixes #6)
  React.useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
    }
  }, [])

  // scroll lock for mobile drawer (fixes #9)
  React.useEffect(() => {
    if (!mobileOpen) return
    const originalOverflow = document.body.style.overflow
    const originalPaddingInlineEnd = document.body.style.paddingInlineEnd
    // compensate scrollbar to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingInlineEnd = `${scrollbarWidth}px`
    }
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingInlineEnd = originalPaddingInlineEnd
    }
  }, [mobileOpen])

  // keyboard: Escape closes, focus restoration (fixes #8)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (mobileOpen) {
        e.preventDefault()
        setMobileOpen(false)
        setIsFlyoutOpen(false)
        setHoveredId(null)
        prevFocusRef.current?.focus()
        return
      }
      if (isFlyoutOpen) {
        e.preventDefault()
        setIsFlyoutOpen(false)
        setHoveredId(null)
        // return focus to rail button of current group
        const btn = railRef.current?.querySelector<HTMLButtonElement>(
          `[data-group-id="${displayedGroupId}"]`
        )
        btn?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen, isFlyoutOpen, displayedGroupId])

  const clearTimer = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const handleOpenGroup = React.useCallback(
    (id: string) => {
      clearTimer()
      setHoveredId(id)
      setIsFlyoutOpen(true)
    },
    [clearTimer]
  )

  const scheduleClose = React.useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setIsFlyoutOpen(false)
      setHoveredId(null)
    }, 240)
  }, [])

  const handleRailButtonClick = React.useCallback(
    (id: string) => {
      const isCurrentlyDisplayed = displayedGroupId === id && isFlyoutOpen
      if (isCurrentlyDisplayed) {
        setIsFlyoutOpen(false)
        setHoveredId(null)
      } else {
        clearTimer()
        setHoveredId(id)
        setIsFlyoutOpen(true)
      }
    },
    [displayedGroupId, isFlyoutOpen, clearTimer]
  )

  const handleMobileOpen = React.useCallback(() => {
    prevFocusRef.current = document.activeElement as FocusableElement
    setMobileOpen(true)
    setIsFlyoutOpen(true)
  }, [])

  const handleMobileClose = React.useCallback(() => {
    setMobileOpen(false)
    setIsFlyoutOpen(false)
    setHoveredId(null)
    // focus restoration is handled via ref in next tick
    setTimeout(() => {
      prevFocusRef.current?.focus()
    }, 0)
  }, [])

  const roleText = role ? roleLabel(role) : 'فروشگاه ماشین‌های اداری'
  const adminDisplay = admin?.name ?? admin?.email ?? null

  const flyoutVisible = isFlyoutOpen || mobileOpen

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          {/* decorative controls must be aria-hidden (fixes #10) */}
          <div className={styles.windowDots} aria-hidden="true">
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </div>
          <div className={styles.workspaceTab} aria-hidden="false">
            <span className={styles.brandMark} aria-hidden="true">
              س
            </span>
            <span>پنل مدیریت Saite</span>
            <span className={styles.tabClose} aria-hidden="true">
              ×
            </span>
          </div>
          <span className={styles.addTab} aria-hidden="true">
            +
          </span>
          <div className={styles.headerTools} aria-hidden="true">
            <span aria-hidden="true">↻</span>
            <span aria-hidden="true">⌁</span>
            <MoreVertical size={14} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.headerBottom}>
          <div className={styles.headerNav} aria-hidden="true">
            <ChevronLeft size={15} aria-hidden="true" />
            <ChevronRight size={15} aria-hidden="true" />
            <span aria-hidden="true">↻</span>
          </div>
          <div className={styles.location} title={`${currentGroup?.label ?? 'داشبورد'}`}>
            {`پنل مدیریت / ${currentGroup?.label ?? 'داشبورد'}`}
          </div>
          <div className={styles.headerTools} aria-hidden="true">
            <span aria-hidden="true">☆</span>
            <span aria-hidden="true">◉</span>
          </div>
        </div>
      </header>

      {/* rail - fixed on start side for RTL correctness (fixes #6) */}
      <aside
        ref={railRef}
        className={styles.rail}
        aria-label="ناوبری سریع"
        onMouseLeave={scheduleClose}
      >
        <div className={styles.logo} aria-hidden="true">
          س
        </div>

        {nav.map((group, index) => {
          const Icon = ADMIN_ICON_MAP[group.icon]
          const isActive = isAdminGroupActive(group, pathname)
          const isDisplayed = displayedGroupId === group.id && flyoutVisible

          return (
            <React.Fragment key={group.id}>
              {index === 4 && <div className={styles.rule} aria-hidden="true" />}
              <button
                type="button"
                data-group-id={group.id}
                className={cn(styles.railButton, (isActive || isDisplayed) && styles.railButtonActive)}
                onMouseEnter={() => handleOpenGroup(group.id)}
                onFocus={() => handleOpenGroup(group.id)}
                onClick={() => handleRailButtonClick(group.id)}
                aria-label={group.label}
                aria-expanded={isDisplayed}
                aria-controls="admin-flyout"
                aria-haspopup="menu"
              >
                <span className={styles.tooltip} aria-hidden="true">
                  {group.label}
                </span>
                <Icon className="size-5" aria-hidden="true" />
              </button>
            </React.Fragment>
          )
        })}

        <div className={styles.spacer} aria-hidden="true" />

        <div className={styles.railFooter}>
          {adminDisplay ? (
            <div className={styles.userBadge} title={adminDisplay} aria-label={adminDisplay}>
              {adminDisplay.charAt(0).toUpperCase()}
            </div>
          ) : null}

          <button
            type="button"
            className={styles.mobileMenu}
            onClick={handleMobileOpen}
            aria-label="باز کردن منو"
            aria-expanded={mobileOpen}
            aria-controls="admin-flyout"
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* backdrop for mobile (fixes #9) */}
      <div
        className={cn(styles.backdrop, mobileOpen && styles.backdropOpen)}
        onClick={handleMobileClose}
        aria-hidden="true"
        // prevent clicks when hidden
        style={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
      />

      {/* flyout - keyboard accessible, hidden menu not tabbable (fixes #7, #8) */}
      <aside
        ref={flyoutRef}
        id="admin-flyout"
        className={cn(
          styles.flyout,
          flyoutVisible && styles.flyoutOpen,
          mobileOpen && styles.mobileFlyout
        )}
        onMouseEnter={clearTimer}
        onMouseLeave={scheduleClose}
        aria-label="منوی کناری"
        aria-hidden={!flyoutVisible}
        // inert prevents tab focus when hidden (fixes #7)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(!flyoutVisible ? ({ inert: true } as any) : {})}
      >
        <div className={styles.flyoutHead}>
          <div>
            <small>SAITE ADMIN</small>
            <h2>{currentGroup?.label ?? 'داشبورد'}</h2>
            <p title={adminDisplay ?? undefined}>
              {adminDisplay ? (
                <>
                  {roleText} — {adminDisplay}
                </>
              ) : (
                roleText
              )}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleMobileClose}
            aria-label="بستن منو"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.flyoutBody} aria-label={currentGroup?.label ?? 'منو'}>
          {currentGroup ? (
            <>
              <div className={styles.groupLabel}>{currentGroup.label}</div>

              {/* direct href for groups without children (e.g., dashboard) */}
              {currentGroup.href && !currentGroup.children?.length ? (
                <Link
                  href={currentGroup.href}
                  onClick={handleMobileClose}
                  className={cn(
                    styles.flyItem,
                    (pathname === currentGroup.href ||
                      pathname.startsWith(`${currentGroup.href}/`) ||
                      (currentGroup.href === '/admin' && pathname === '/admin')) &&
                      styles.flyItemActive
                  )}
                  aria-current={
                    pathname === currentGroup.href || pathname === `${currentGroup.href}/`
                      ? 'page'
                      : undefined
                  }
                >
                  <span>{currentGroup.label}</span>
                </Link>
              ) : null}

              {(currentGroup.children ?? []).map((item) => {
                const Icon = ADMIN_ICON_MAP[item.icon]
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleMobileClose}
                    className={cn(styles.flyItem, active && styles.flyItemActive)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </>
          ) : null}
        </nav>

        <div className={styles.flyoutFoot}>
          <span className={styles.live} aria-hidden="true" />
          <span>وضعیت سیستم — آماده</span>
          <span className="ms-auto" />
          <div className="flex items-center gap-2">
            <AdminSignOut onNavigate={handleMobileClose} />
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mobileTopbar}>
          <button type="button" onClick={handleMobileOpen} aria-label="منو" aria-expanded={mobileOpen}>
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="text-sm font-bold">{currentGroup?.label ?? 'پنل مدیریت'}</span>
          <span className="ms-auto text-[10px] text-muted-foreground">{roleText}</span>
        </div>

        <div className={cn('container mx-auto px-4 py-8 md:py-10', styles.mainInner)}>{children}</div>
      </main>
    </div>
  )
}
