'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Menu3DProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
  panelClassName?: string
  /** ترازبندی پنل نسبت به ماشه — در RTL پیش‌فرض راست است */
  align?: 'start' | 'end'
}

/**
 * منوی کشویی سه‌بعدی.
 *
 * پنل با چرخش روی محور X باز می‌شود (مثل درِ لولایی از بالا) و
 * transform-origin روی لبهٔ بالایی تنظیم شده تا حرکت طبیعی حس شود.
 * والد perspective دارد؛ بدون آن، rotateX کاملاً تخت دیده می‌شود.
 *
 * رفتار دسترس‌پذیری: بستن با Escape، بستن با کلیک بیرون،
 * aria-expanded روی ماشه و احترام به prefers-reduced-motion.
 */
export function Menu3D({
  trigger,
  children,
  className,
  panelClassName,
  align = 'start',
}: Menu3DProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  React.useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('scene-3d relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="outline-none"
      >
        {trigger}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, rotateX: -18, y: -8 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, rotateX: -14, y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
            className={cn(
              'absolute top-[calc(100%+0.6rem)] z-50 min-w-56 rounded-2xl border border-border',
              'bg-popover/95 p-2 shadow-depth-4 backdrop-blur-xl',
              align === 'start' ? 'right-0' : 'left-0',
              panelClassName
            )}
            role="menu"
          >
            {/* لبهٔ نوری بالای پنل — تقویت حس عمق */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-l from-transparent via-primary/60 to-transparent"
            />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** آیتم استاندارد داخل Menu3D */
export function Menu3DItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm',
        'text-muted-foreground transition-all duration-200',
        'hover:translate-x-[-2px] hover:bg-primary/12 hover:text-foreground',
        'focus-visible:bg-primary/12 focus-visible:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
