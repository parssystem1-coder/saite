'use client'

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface Card3DProps {
  children: React.ReactNode
  className?: string
  /** حداکثر زاویهٔ چرخش بر حسب درجه. پیش‌فرض عمداً محافظه‌کارانه است. */
  maxTilt?: number
  /** هالهٔ نئون که مکان نشانگر را دنبال می‌کند */
  glare?: boolean
}

/**
 * سطح سه‌بعدی تعاملی.
 *
 * تصمیم طراحی: زاویهٔ تیلت روی ۵ درجه محدود شده (نه ۱۰ یا ۱۵ درجه).
 * دلیل: در شبکهٔ مقایسهٔ محصولات، چرخش شدید کارت زیر نشانگر باعث
 * می‌شود چشم کاربر هنگام مقایسهٔ مشخصات فنی مدام تنظیم مجدد کند.
 * عمق واقعی از سایه‌های لایه‌ای و لبهٔ نوری می‌آید، نه از زاویهٔ زیاد.
 *
 * اگر کاربر prefers-reduced-motion فعال کرده باشد، تیلت کاملاً غیرفعال
 * می‌شود و فقط جلوه‌های ایستا باقی می‌ماند.
 */
/** سقف هویت بصری: تیلت هرگز از ۵ درجه بیشتر نمی‌شود */
const MAX_TILT_CAP = 5

export function Card3D({ children, className, maxTilt = 5, glare = true }: Card3DProps) {
  const prefersReduced = useReducedMotion()
  const tilt = Math.min(Math.max(maxTilt, 0), MAX_TILT_CAP)

  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const springCfg = { stiffness: 260, damping: 26, mass: 0.4 }
  const sx = useSpring(mouseX, springCfg)
  const sy = useSpring(mouseY, springCfg)

  const rotateY = useTransform(sx, [0, 1], [`-${tilt}deg`, `${tilt}deg`])
  const rotateX = useTransform(sy, [0, 1], [`${tilt}deg`, `-${tilt}deg`])

  const glareX = useTransform(sx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(sy, [0, 1], ['0%', '100%'])
  // useMotionTemplate تضمین می‌کند گرادیان با حرکت نشانگر واقعاً به‌روز شود
  const glareBg = useMotionTemplate`radial-gradient(260px circle at ${glareX} ${glareY}, hsl(var(--primary) / 0.15), transparent 70%)`

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  const handleLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <div className={cn('scene-3d', className)}>
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={
          prefersReduced
            ? undefined
            : { rotateX, rotateY, transformStyle: 'preserve-3d' }
        }
        whileHover={prefersReduced ? undefined : { z: 24 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="surface-3d group relative h-full rounded-2xl"
      >
        {glare && !prefersReduced && (
          <motion.div
            aria-hidden="true"
            style={{ background: glareBg }}
            className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
        {/*
          لایهٔ محتوا باید relative+z-index داشته باشد تا دکمه‌ها
          بالای glare و hit-test درست داشته باشند (باگ مقایسه/علاقه‌مندی).
        */}
        <div className="relative z-10 h-full">{children}</div>
      </motion.div>
    </div>
  )
}
