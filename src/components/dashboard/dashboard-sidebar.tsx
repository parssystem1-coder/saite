'use client'

import { GitCompareArrows, Heart, LogOut, ShoppingCart, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/types/user'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

/**
 * پیش از این چهار `<button>` بدون onClick بودند — کاربر کلیک می‌کرد
 * و هیچ اتفاقی نمی‌افتاد. حالا لینک واقعی‌اند.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'داشبورد', href: '/dashboard', icon: User },
  { label: 'سبد خرید', href: '/cart', icon: ShoppingCart },
  { label: 'علاقه‌مندی‌ها', href: '/wishlist', icon: Heart },
  { label: 'مقایسه', href: '/compare', icon: GitCompareArrows },
]

interface Props {
  user: AuthUser | null
  onLogout: () => void
}

export function DashboardSidebar({ user, onLogout }: Props) {
  const pathname = usePathname()

  return (
    <aside className="space-y-4 lg:col-span-1">
      <div className="surface-3d rounded-2xl p-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/15">
            <User className="size-10 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
          <p dir="ltr" className="mt-1 font-mono text-xs break-all text-muted-foreground">
            {user?.email}
          </p>
        </div>

        <nav className="space-y-1.5" aria-label="منوی پنل کاربری">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Button variant="ghost" className="mt-4 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onLogout}>
          <LogOut className="size-5" />
          خروج از حساب
        </Button>
      </div>
    </aside>
  )
}
