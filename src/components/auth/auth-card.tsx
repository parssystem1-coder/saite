'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AuthCardProps {
  children: ReactNode
  title: string
  description: string
}

/**
 * قاب مشترک صفحات ورود و ثبت‌نام.
 *
 * تغییرات نسبت به نسخهٔ قبل:
 *  - رنگ‌های hardcode (`bg-[#0d0d0f]`، `border-white/10`، `text-white`)
 *    با توکن‌های `surface-1`، `border` و `foreground` جایگزین شدند تا
 *    اگر روزی پالت عوض شد، این کارت هم همراه بقیه تغییر کند.
 *  - خط اسکن دائمی (`repeat: Infinity`) با prefers-reduced-motion
 *    غیرفعال می‌شود؛ انیمیشن بی‌پایان روی موبایل باتری مصرف می‌کند.
 */
export function AuthCard({ children, title, description }: AuthCardProps) {
  const prefersReduced = useReducedMotion()

  return (
    <div className="relative w-full max-w-md">
      {/* هالهٔ پس‌زمینه */}
      <div
        aria-hidden="true"
        className="absolute -inset-1 rounded-3xl bg-linear-to-r from-primary to-accent opacity-25 blur"
      />

      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface-1 px-8 py-10 shadow-depth-4"
      >
        {!prefersReduced && (
          <motion.div
            aria-hidden="true"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 left-0 h-0.5 w-20 bg-primary/50"
          />
        )}

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        {children}
      </motion.div>
    </div>
  )
}
