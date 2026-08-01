'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AccordionItemData {
  id: string
  title: string
  content: React.ReactNode
}

/**
 * آکاردئون دسترس‌پذیر برای بخش سوالات متداول.
 *
 * این یکی از معدود جاهایی است که انیمیشن «کاربردی» است نه تزئینی:
 * باز شدن تدریجی به کاربر نشان می‌دهد محتوا از کجا آمده است.
 */
export function Accordion({
  items,
  className,
  defaultOpenId,
}: {
  items: AccordionItemData[]
  className?: string
  defaultOpenId?: string
}) {
  const [openId, setOpenId] = React.useState<string | null>(defaultOpenId ?? null)
  const prefersReduced = useReducedMotion()

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        const panelId = `acc-panel-${item.id}`
        const buttonId = `acc-btn-${item.id}`

        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-2xl border transition-colors',
              isOpen ? 'border-primary/40 bg-surface-2' : 'border-border bg-surface-1'
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-right"
              >
                <span
                  className={cn(
                    'text-sm font-bold transition-colors',
                    isOpen ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {item.title}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                    isOpen && 'rotate-180 text-primary'
                  )}
                />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
