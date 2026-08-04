'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { getCategoryIcon } from '@/lib/category-icons'
import { BRANDS, CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * مگامنوی دسته‌بندی‌ها با پنل سه‌بعدی.
 *
 * پنل با چرخش روی محور X از لبهٔ بالا باز می‌شود. برخلاف Menu3D که برای
 * منوهای کوچک است، این کامپوننت با hover هم باز می‌شود (رفتار متعارف
 * مگامنو در دسکتاپ) و برای دسترس‌پذیری با کیبورد، کلیک و Escape را هم
 * پشتیبانی می‌کند.
 */
export function MegaMenu() {
  const [open, setOpen] = React.useState(false)
  const prefersReduced = useReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  React.useEffect(() => () => clearTimeout(closeTimer.current), [])

  const openNow = () => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  // تأخیر کوتاه هنگام خروج نشانگر تا حرکت مورب کاربر به سمت پنل، منو را نبندد
  const closeSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 140)
  }

  return (
    <div
      ref={ref}
      className="scene-3d relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors',
          open ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <LayoutGrid className="size-4" />
        دسته‌بندی‌ها
        <ChevronDown
          className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, rotateX: -14, y: -8 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, rotateX: -10, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-[min(90vw,44rem)] rounded-2xl border border-border bg-popover/95 p-5 shadow-depth-4 backdrop-blur-xl"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-l from-transparent via-primary/60 to-transparent"
            />

            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              {/* دسته‌ها */}
              <div>
                <p className="mb-3 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  گروه‌های کالا
                </p>
                <ul className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((c) => {
                    const Icon = getCategoryIcon(c.icon)
                    return (
                      <li key={c.slug}>
                        <Link
                          href={`/products?category=${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="group/item flex items-start gap-2.5 rounded-xl p-2.5 transition-all hover:bg-primary/10"
                        >
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 transition-colors group-hover/item:bg-primary/22">
                            <Icon className="size-4 text-primary" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-foreground">
                              {c.name}
                            </span>
                            <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted-foreground">
                              {c.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* برندها */}
              <div className="border-border md:border-r md:pr-5">
                <p className="mb-3 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
                  برندها
                </p>
                <ul className="space-y-1">
                  {BRANDS.map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={`/products?brand=${b.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                      >
                        <span dir="ltr" className="font-mono text-xs font-bold">
                          {b.displayName}
                        </span>
                        <span className="text-[11px]">{b.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-primary hover:underline"
              >
                مشاهدهٔ همهٔ محصولات ←
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
