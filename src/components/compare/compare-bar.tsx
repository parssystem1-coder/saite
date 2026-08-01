'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GitCompareArrows, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { formatNumber } from '@/lib/format'
import { MAX_COMPARE, useCompareStore } from '@/store/compare-store'

/**
 * نوار شناور مقایسه.
 *
 * وقتی کاربر کالایی را برای مقایسه انتخاب می‌کند، این نوار از پایین
 * صفحه بالا می‌آید و انتخاب‌ها را نشان می‌دهد. چون خریدار تجهیزات
 * اداری معمولاً چند مدل را کنار هم می‌سنجد، دسترسی دائمی به این نوار
 * مسیر تصمیم‌گیری را کوتاه می‌کند.
 */
export function CompareBar() {
  const hydrated = useHasHydrated()
  const items = useCompareStore((s) => s.items)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const prefersReduced = useReducedMotion()

  const visible = hydrated && items.length > 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : { y: 100, opacity: 0 }}
          animate={prefersReduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-1/95 shadow-depth-4 backdrop-blur-xl"
        >
          <div className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <GitCompareArrows className="size-4 text-primary" />
              مقایسه
              <span className="text-xs font-normal text-muted-foreground">
                ({formatNumber(items.length)} از {formatNumber(MAX_COMPARE)})
              </span>
            </div>

            <ul className="flex flex-1 flex-wrap items-center gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-0/60 py-1 ps-1 pe-2"
                >
                  <span className="relative size-8 shrink-0 overflow-hidden rounded-lg bg-surface-0">
                    <Image src={item.image} alt="" fill className="object-contain p-0.5" />
                  </span>
                  <span dir="ltr" className="max-w-28 truncate font-mono text-[11px] text-foreground">
                    {item.model}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`حذف ${item.name} از مقایسه`}
                    className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clear}>
                پاک کردن
              </Button>
              <Button size="sm" disabled={items.length < 2} asChild={items.length >= 2}>
                {items.length >= 2 ? (
                  <Link href="/compare">مقایسه کن</Link>
                ) : (
                  <span>حداقل ۲ کالا</span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
